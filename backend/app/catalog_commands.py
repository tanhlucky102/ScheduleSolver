from .seed_catalog import teacher_capabilities
from .domain_models import Department, Teacher
from .schemas import Catalog


def apply(state, action, data, p):
    if action == "catalog":
        catalog = Catalog.model_validate(data)
        if state.offerings or state.sessions:
            new_dept_ids = {d.id for d in catalog.departments}
            new_teacher_ids = {t.id for t in catalog.teachers}
            for s in state.sessions:
                if s.department not in new_dept_ids:
                    raise ValueError(f"Không thể xóa bộ môn '{s.department}' đang có lớp học phần trực thuộc")
            for t in catalog.teachers:
                if t.department not in new_dept_ids:
                    raise ValueError(f"Giảng viên '{t.name or t.id}' thuộc bộ môn không tồn tại '{t.department}'")
            for s in state.sessions:
                if s.teacher and s.teacher not in new_teacher_ids:
                    raise ValueError(f"Không thể xóa giảng viên '{s.teacher}' đang được phân công phụ trách lớp học phần")
            for ev in state.published:
                if ev.get("teacher") and ev.get("teacher") not in new_teacher_ids:
                    raise ValueError(f"Không thể xóa giảng viên '{ev['teacher']}' đang có lịch đã công bố")
            dept_map = {d.id: d for d in state.departments}
            for d in catalog.departments:
                if d.id in dept_map:
                    d.status = dept_map[d.id].status
                    d.note = dept_map[d.id].note
                else:
                    d.status = "UNSENT"
                    d.note = ""
        else:
            if any(d.status != "UNSENT" or d.note for d in catalog.departments):
                raise ValueError("New departments must be unsent")
        seed_caps = teacher_capabilities()
        for t in catalog.teachers:
            if not t.capabilities:
                existing = next((et for et in state.teachers if et.id == t.id), None)
                if existing and existing.capabilities:
                    t.capabilities = existing.capabilities
                elif t.id in seed_caps:
                    t.capabilities = seed_caps[t.id]
        state.departments, state.teachers = catalog.departments, catalog.teachers
    elif action == "department-save":
        dept_id = str(data.get("id", "")).strip()
        name = str(data.get("name", "")).strip()
        if not dept_id:
            raise ValueError("Mã bộ môn không được để trống")
        existing = next((d for d in state.departments if d.id == dept_id), None)
        if existing:
            existing.name = name or existing.name
        else:
            state.departments.append(Department(id=dept_id, name=name or dept_id, status="UNSENT", note=""))
    elif action == "department-delete":
        dept_id = str(data.get("id", "")).strip()
        target = next((d for d in state.departments if d.id == dept_id), None)
        if not target:
            raise ValueError(f"Không tìm thấy bộ môn {dept_id}")
        if any(t.department == dept_id for t in state.teachers):
            raise ValueError(f"Không thể xóa bộ môn '{dept_id}' vì vẫn còn giảng viên trực thuộc")
        if any(s.department == dept_id for s in state.sessions):
            raise ValueError(f"Không thể xóa bộ môn '{dept_id}' vì đang có lớp học phần trực thuộc")
        state.departments = [d for d in state.departments if d.id != dept_id]
    elif action == "teacher-save":
        teacher_id = str(data.get("id", "")).strip()
        name = str(data.get("name", "")).strip()
        department = str(data.get("department", "")).strip()
        assistant = bool(data.get("assistant", False))
        capabilities = data.get("capabilities", {})
        if not teacher_id:
            raise ValueError("Mã giảng viên không được để trống")
        if not department or not any(d.id == department for d in state.departments):
            raise ValueError(f"Bộ môn '{department}' không tồn tại")
        existing = next((t for t in state.teachers if t.id == teacher_id), None)
        seed_caps = teacher_capabilities()
        if existing:
            existing.name = name or existing.name
            existing.department = department
            existing.assistant = assistant
            if capabilities:
                existing.capabilities = capabilities
            elif not existing.capabilities and teacher_id in seed_caps:
                existing.capabilities = seed_caps[teacher_id]
        else:
            state.teachers.append(Teacher(
                id=teacher_id, name=name or teacher_id, department=department,
                assistant=assistant, capabilities=capabilities or seed_caps.get(teacher_id, {})
            ))
    elif action == "teacher-delete":
        teacher_id = str(data.get("id", "")).strip()
        target = next((t for t in state.teachers if t.id == teacher_id), None)
        if not target:
            raise ValueError(f"Không tìm thấy giảng viên {teacher_id}")
        if any(s.teacher == teacher_id for s in state.sessions):
            raise ValueError(f"Không thể xóa giảng viên '{teacher_id}' vì đang được phân công giảng dạy")
        if any(ev.get("teacher") == teacher_id for ev in state.published):
            raise ValueError(f"Không thể xóa giảng viên '{teacher_id}' vì đang có lịch công bố")
        state.teachers = [t for t in state.teachers if t.id != teacher_id]
    return {}
