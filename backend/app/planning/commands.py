from ..timetable.models import Config, Offering
from ..timetable.rules import split


def apply(state, action, data, p):
    if action == "config":
        state.config = Config.model_validate(data)
        state.draft = []
    elif action in ("offerings", "plan-reset"):
        if action == "plan-reset":
            state.offerings = []
            state.sessions = []
            state.draft = []
            state.published = []
            for d in state.departments:
                d.status = "UNSENT"
                d.note = ""
            return {}
        items = [Offering.model_validate(o) for o in data["offerings"]]
        if not items:
            raise ValueError("Empty plan")
        state.offerings = items
        state.sessions = [s for o in items for s in split(o)]
        state.draft = []
        state.published = []
        for d in state.departments:
            d.status = "UNSENT"
            d.note = ""
    elif action in ("send", "send-all"):
        target_dept = data.get("department") if (data and isinstance(data, dict)) else None
        if target_dept:
            dep = next(d for d in state.departments if d.id == target_dept)
            if dep.status != "UNSENT" or not any(s.department == dep.id for s in state.sessions):
                raise ValueError("Department must have unsent classes")
            dep.status = "SENT"
        else:
            sent_any = False
            for dep in state.departments:
                if dep.status == "UNSENT" and any(s.department == dep.id for s in state.sessions):
                    dep.status = "SENT"
                    sent_any = True
            if not sent_any:
                raise ValueError("Không có bộ môn nào ở trạng thái chờ gửi có lớp học phần")
    return {}
