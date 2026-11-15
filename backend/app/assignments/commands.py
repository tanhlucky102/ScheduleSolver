import csv
import io
from ..identity.policies import RequestError, require_head
from ..timetable.models import Teacher
from ..timetable.rules import eligible, assignment_errors
from .schemas import Assign, TeacherUpdate, Return


def _pick(norm_row: dict, keys: tuple[str, ...]):
    for k in keys:
        if k in norm_row and norm_row[k] is not None:
            return norm_row[k]
    return None


def _flag_truthy(val) -> bool:
    if val is None or val is False:
        return False
    if val is True:
        return True
    s = str(val).strip()
    if not s:
        return False
    return s.lower() not in ("0", "false", "no", "khong", "không", "-")


def apply(state, action, data, p):
    if action in ("assign", "balance", "teacher", "submit"):
        department = data["department"]
        require_head(p, department)
        dep = next(d for d in state.departments if d.id == department)
        if action != "teacher" and dep.status != "SENT":
            raise ValueError("Assignment editing requires a sent or returned department")
        sessions = [s for s in state.sessions if s.department == department]
        dept_courses = {s.course for s in sessions} | {o.course for o in state.offerings if o.department == department}
        teachers = [t for t in state.teachers if t.department == department or any(c in t.capabilities for c in dept_courses)]
        if action == "teacher":
            update = TeacherUpdate.model_validate({k: v for k, v in data.items() if k != "department"})
            t = next((t for t in state.teachers if t.id == update.teacher), None)
            if not t:
                raise ValueError(f"Không tìm thấy giảng viên {update.teacher}")
            next_active = t.active if update.active is None else update.active
            cleaned_caps = (
                {c: [k for k in kinds if k != "LEC"] for c, kinds in update.capabilities.items()}
                if update.assistant
                else update.capabilities
            )
            if update.assistant:
                cleaned_caps = {c: kinds for c, kinds in cleaned_caps.items() if kinds}
            candidate = Teacher.model_validate(dict(
                t.model_dump(),
                assistant=update.assistant,
                active=next_active,
                capabilities=cleaned_caps,
            ))
            idx = state.teachers.index(t)
            state.teachers[idx] = candidate
            if dep.status == "SUBMITTED" and assignment_errors(state, department):
                state.teachers[idx] = t
                raise ValueError("Không thể xóa năng lực hoặc tạm ngưng giảng viên đang phụ trách lớp của bộ môn đã nộp")
            return {}
        elif action == "assign":
            item = Assign.model_validate({k: v for k, v in data.items() if k != "department"})
            s = next(s for s in sessions if s.id == item.session)
            t = next((t for t in teachers if t.id == item.teacher), None)
            if not t:
                raise ValueError(f"Không tìm thấy giảng viên {item.teacher}")
            if not eligible(s, t):
                raise ValueError("Teacher is not eligible for this class")
            s.teacher = t.id
        elif action == "balance":
            loads = {t.id: sum(s.periods for s in sessions if s.teacher == t.id) for t in teachers}
            assigned_count = 0
            for s in sessions:
                if s.teacher:
                    continue
                candidates = [t for t in teachers if eligible(s, t)]
                if not candidates:
                    continue
                t = min(candidates, key=lambda t: (loads[t.id], t.id))
                s.teacher = t.id
                loads[t.id] += s.periods
                assigned_count += 1
            if assigned_count == 0 and any(not s.teacher for s in sessions):
                raise ValueError(f"Không có giảng viên nào đủ năng lực cho các lớp còn trống của bộ môn {department}. Vui lòng nhập hoặc cập nhật năng lực giảng viên.")
        else:
            errors = assignment_errors(state, department)
            if errors:
                raise ValueError("; ".join(errors))
            dep.status = "SUBMITTED"
            dep.note = ""
        state.draft = []
    elif action == "capabilities-import":
        if p.role != "HEAD" or not p.department:
            raise RequestError(403, "Chỉ Trưởng bộ môn mới có quyền nhập năng lực giảng viên.")
        if data.get("department") and str(data["department"]).strip() != p.department:
            raise RequestError(403, "Chỉ Trưởng bộ môn mới có quyền nhập năng lực giảng viên.")
        dep = next((d for d in state.departments if d.id == p.department), None)
        if dep is None:
            raise RequestError(404, f"Không tìm thấy bộ môn {p.department}")
        if dep.status == "SUBMITTED":
            raise RequestError(409, "Bộ môn đã nộp phân công. Vui lòng nhờ Giáo vụ mở khóa trước khi nhập lại năng lực.")

        mode = str(data.get("mode") or "merge").strip().lower()
        if mode not in ("merge", "replace"):
            raise ValueError("Chế độ nhập không hợp lệ (chỉ hỗ trợ 'merge' hoặc 'replace')")

        raw_rows: list[dict] = []
        if "csv_text" in data and data["csv_text"] is not None:
            csv_text = str(data["csv_text"]).lstrip("\ufeff")
            if not csv_text.strip():
                raise ValueError("Nội dung CSV rỗng")
            reader = csv.DictReader(io.StringIO(csv_text))
            raw_rows = [r for r in reader if r and any(v is not None and str(v).strip() != "" for v in r.values())]
        elif "rows" in data and isinstance(data["rows"], list):
            raw_rows = [dict(r) for r in data["rows"] if isinstance(r, dict)]
        else:
            raise ValueError("Cần cung cấp 'csv_text' hoặc 'rows' để nhập năng lực giảng viên")

        dept_teachers = {t.id: t for t in state.teachers if t.department == p.department}
        all_teachers = {t.id: t for t in state.teachers}
        if mode == "replace":
            for t in dept_teachers.values():
                kept_caps: dict[str, list[str]] = {}
                for s in state.sessions:
                    if s.teacher == t.id:
                        req = ["LEC", "TUT"] if s.kind == "COMBINED" else [s.kind]
                        cur = set(kept_caps.get(s.course, []))
                        cur.update(req)
                        kept_caps[s.course] = [k for k in ("LEC", "TUT", "COMBINED") if k in cur]
                t.capabilities = kept_caps

        imported_rows = 0
        skipped_other_departments = 0
        updated_teacher_ids: set[str] = set()
        unknown_teachers: list[str] = []
        warnings: list[str] = []

        for raw_row in raw_rows:
            norm = {str(k).strip().lower().lstrip("\ufeff"): v for k, v in raw_row.items() if k is not None}
            tid = str(_pick(norm, ("ma_gv", "id", "teacher", "giang_vien", "mã gv", "giảng viên")) or "").strip()
            row_dept = str(_pick(norm, ("bo_mon", "department", "bộ môn")) or "").strip()
            course = str(_pick(norm, ("ma_mon", "ma_hoc_phan", "course", "hoc_phan", "mã môn", "mã học phần")) or "").strip()
            if not tid or not course:
                continue

            t = all_teachers.get(tid)
            if t is not None:
                if t.department != p.department:
                    skipped_other_departments += 1
                    continue
            else:
                if row_dept and row_dept != p.department:
                    skipped_other_departments += 1
                    continue
                if tid not in unknown_teachers:
                    unknown_teachers.append(tid)
                    warnings.append(f"Không tìm thấy giảng viên '{tid}' trong danh sách nhân sự bộ môn {p.department}.")
                continue

            want_lec = _flag_truthy(_pick(norm, ("day_lec", "ly_thuyet", "lec", "dạy lec", "lý thuyết")))
            want_tut = _flag_truthy(_pick(norm, ("day_tut", "thuc_hanh", "tut", "dạy tut", "thực hành")))

            row_kinds: list[str] = []
            if want_lec:
                if t.assistant:
                    warnings.append(f"Trợ giảng {t.id} không được dạy lý thuyết (LEC) môn {course}; đã lược bỏ LEC.")
                else:
                    row_kinds.append("LEC")
            if want_tut:
                row_kinds.append("TUT")

            imported_rows += 1
            if row_kinds:
                existing_set = set(t.capabilities.get(course, []))
                merged = [k for k in ("LEC", "TUT", "COMBINED") if k in (existing_set | set(row_kinds))]
                t.capabilities[course] = merged
                updated_teacher_ids.add(t.id)
            elif mode == "replace":
                updated_teacher_ids.add(t.id)

        for idx, t in enumerate(state.teachers):
            if t.department == p.department:
                state.teachers[idx] = Teacher.model_validate(t.model_dump())

        return {
            "imported_rows": imported_rows,
            "updated_teachers": len(updated_teacher_ids),
            "skipped_other_departments": skipped_other_departments,
            "unknown_teachers": unknown_teachers,
            "warnings": warnings,
        }
    elif action == "return":
        note = Return.model_validate({"note": data["note"]})
        dep = next(d for d in state.departments if d.id == data["department"])
        if dep.status != "SUBMITTED":
            raise ValueError("Only submitted assignments can be returned")
        dep.status, dep.note = "SENT", note.note
        state.draft = []
    return {}
