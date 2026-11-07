from .seed_catalog import teacher_capabilities
from .policies import RequestError, require_head
from .domain_models import Teacher
from .domain_rules import eligible, assignment_errors
from .schemas import Assign, TeacherUpdate, Return


def apply(state, action, data, p):
    if action in ("assign", "balance", "teacher", "submit"):
        department = data["department"]
        require_head(p, department)
        dep = next(d for d in state.departments if d.id == department)
        if dep.status != "SENT":
            raise ValueError("Assignment editing requires a sent or returned department")
        sessions = [s for s in state.sessions if s.department == department]
        dept_courses = {s.course for s in sessions}
        teachers = [t for t in state.teachers if t.department == department or any(c in t.capabilities for c in dept_courses)]
        if action == "teacher":
            update = TeacherUpdate.model_validate({k:v for k,v in data.items() if k != "department"})
            t = next((t for t in state.teachers if t.id == update.teacher), None)
            if not t:
                raise ValueError(f"Không tìm thấy giảng viên {update.teacher}")
            candidate = Teacher.model_validate(dict(t.model_dump(), assistant=update.assistant, capabilities=update.capabilities))
            state.teachers[state.teachers.index(t)] = candidate
        elif action == "assign":
            item = Assign.model_validate({k:v for k,v in data.items() if k != "department"})
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
                raise ValueError(f"Không có giảng viên nào đủ năng lực cho các lớp còn trống của bộ môn {department}. Vui lòng đồng bộ hoặc cập nhật năng lực giảng viên.")
        else:
            errors = assignment_errors(state, department)
            if errors:
                raise ValueError("; ".join(errors))
            dep.status = "SUBMITTED"
            dep.note = ""
        state.draft = []
    elif action == "capabilities-preset":
        if p.role not in ("STAFF", "HEAD"):
            raise RequestError(403, "Chỉ Giáo vụ hoặc Trưởng bộ môn mới có quyền đồng bộ năng lực")
        seed_caps = teacher_capabilities(required=True)
        dept_filter = p.department if p.role == "HEAD" else data.get("department")
        updated = 0
        for t in state.teachers:
            if (not dept_filter or t.department == dept_filter) and t.id in seed_caps:
                t.capabilities = seed_caps[t.id]
                updated += 1
    elif action == "return":
        note = Return.model_validate({"note": data["note"]})
        dep = next(d for d in state.departments if d.id == data["department"])
        if dep.status != "SUBMITTED":
            raise ValueError("Only submitted assignments can be returned")
        dep.status, dep.note = "SENT", note.note
        state.draft = []
    return {}
