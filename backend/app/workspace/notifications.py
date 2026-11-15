"""Build and filter role-scoped Vietnamese workspace notifications."""
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from ..timetable.models import NotificationItem, State


def _actor_label(p, state: State) -> str:
    if p.role == "STAFF":
        return "Giáo vụ"
    if p.role == "HEAD":
        if p.teacher:
            return f"Trưởng bộ môn {p.department} ({p.teacher})"
        return f"Trưởng bộ môn {p.department or ''}".strip()
    if p.teacher:
        t_obj = next((t for t in state.teachers if t.id == p.teacher), None)
        if t_obj and t_obj.name and t_obj.name != t_obj.id:
            return f"GV {t_obj.name} ({t_obj.id})"
        return f"Giảng viên {p.teacher}"
    return p.role or "Hệ thống"


def build_notification(action: str, payload: dict | None, state: State, revision: int, p) -> NotificationItem | None:
    data = payload if isinstance(payload, dict) else {}
    tone: Literal["info", "success", "warning"] = "info"
    department: str | None = None
    teacher: str | None = None
    summary = ""

    if action == "offerings":
        summary = f"Giáo vụ đã cập nhật kế hoạch mở lớp học kỳ ({len(state.offerings)} học phần)."
    elif action == "plan-reset":
        summary = "Giáo vụ đã đặt lại kế hoạch học kỳ."
        tone = "warning"
    elif action == "config":
        summary = "Giáo vụ đã cập nhật cấu hình khung giờ và học kỳ."
    elif action == "catalog":
        summary = f"Giáo vụ đã cập nhật danh sách nhân sự ({len(state.teachers)} giảng viên)."
    elif action == "teacher-save":
        tid = str(data.get("id") or "").strip()
        dept = str(data.get("department") or "").strip()
        summary = f"Giáo vụ đã cập nhật danh sách nhân sự / trạng thái giảng viên {tid}."
        teacher = tid or None
        department = dept or None
    elif action == "teacher-delete":
        tid = str(data.get("id") or "").strip()
        summary = f"Giáo vụ đã xóa giảng viên {tid} khỏi danh sách nhân sự."
        tone = "warning"
        teacher = tid or None
    elif action == "department-save":
        did = str(data.get("id") or "").strip()
        summary = f"Giáo vụ đã cập nhật thông tin Bộ môn {did}."
        department = did or None
    elif action == "department-delete":
        did = str(data.get("id") or "").strip()
        summary = f"Giáo vụ đã xóa Bộ môn {did}."
        tone = "warning"
        department = did or None
    elif action == "rooms":
        summary = f"Giáo vụ đã cập nhật danh mục phòng học ({len(state.rooms)} phòng)."
    elif action == "rooms-delete":
        summary = "Giáo vụ đã xóa phòng học khỏi danh mục."
        tone = "warning"
    elif action == "rooms-preset":
        summary = f"Giáo vụ đã nạp danh sách phòng học tiêu chuẩn ({len(state.rooms)} phòng)."
    elif action == "requirements":
        sid = str(data.get("session") or "").strip()
        summary = f"Giáo vụ đã cập nhật yêu cầu phòng học cho lớp {sid}." if sid else "Giáo vụ đã cập nhật yêu cầu phòng học."
    elif action == "reservation":
        rid = str(data.get("room_id") or "").strip()
        summary = f"Giáo vụ đã khóa lịch sử dụng phòng {rid}." if rid else "Giáo vụ đã cập nhật lịch giữ chỗ phòng học."
    elif action == "reservation-delete":
        summary = "Giáo vụ đã mở khóa lịch giữ chỗ phòng học."
    elif action == "send":
        dep = str(data.get("department") or "").strip()
        if dep:
            summary = f"Giáo vụ đã gửi kế hoạch phân công cho Bộ môn {dep}."
            department = dep
        else:
            summary = "Giáo vụ đã gửi kế hoạch phân công cho toàn bộ các Bộ môn."
    elif action == "send-all":
        summary = "Giáo vụ đã gửi kế hoạch phân công cho toàn bộ các Bộ môn."
    elif action == "return":
        dep = str(data.get("department") or "").strip()
        summary = f"Giáo vụ đã trả lại bảng phân công Bộ môn {dep} để điều chỉnh."
        tone = "warning"
        department = dep or None
    elif action == "capabilities-import":
        dep = p.department or ""
        summary = f"Trưởng bộ môn {dep} đã nhập năng lực giảng dạy từ file CSV."
        tone = "success"
        department = p.department
    elif action == "teacher":
        dep = p.department or ""
        tid = str(data.get("teacher") or "").strip()
        summary = f"Trưởng bộ môn {dep} đã cập nhật hồ sơ năng lực của {tid}."
        department = p.department
        teacher = tid or None
    elif action in ("assign", "balance"):
        dep = p.department or ""
        summary = f"Trưởng bộ môn {dep} đã cập nhật phân công giảng dạy."
        department = p.department
        if action == "assign":
            tid = str(data.get("teacher") or "").strip()
            teacher = tid or None
    elif action == "submit":
        dep = p.department or ""
        summary = f"Trưởng bộ môn {dep} đã hoàn tất và nộp bảng phân công lên Giáo vụ."
        tone = "success"
        department = p.department
    elif action in ("external", "external-import", "external-delete"):
        # Privacy invariant: NEVER include institution, course, class_name, room, or note.
        tid = p.teacher or ""
        summary = f"Giảng viên {tid} đã cập nhật khung giờ bận ngoài khoa."
        teacher = tid or None
    elif action == "solve":
        summary = "Giáo vụ đã chạy bộ giải xếp thời khóa biểu bản nháp."
    elif action == "placement":
        summary = "Giáo vụ đã điều chỉnh vị trí xếp lịch trên bản nháp."
    elif action in ("publish", "published-room"):
        summary = "Giáo vụ đã công bố Thời khóa biểu chính thức của học kỳ."
        tone = "success"
    elif action == "color-rules":
        if p.role == "STAFF" and not p.teacher:
            summary = "Giáo vụ đã cập nhật quy ước màu sắc học kỳ."
        else:
            tid = p.teacher or ""
            summary = f"Giảng viên {tid} đã cập nhật bảng màu cá nhân."
            teacher = tid or None
    else:
        return None

    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return NotificationItem(
        id=str(uuid4()),
        revision=revision,
        action=action,
        actor_id=str(p.id or "")[:120],
        actor_role=str(p.role or "")[:40],
        actor_label=_actor_label(p, state)[:120],
        department=department[:80] if department else None,
        teacher=teacher[:80] if teacher else None,
        summary=summary[:500],
        tone=tone,
        created_at=created_at,
    )


def filter_notifications(notifications: list[NotificationItem], p, state: State) -> list[dict]:
    matched: list[NotificationItem] = []
    for n in notifications:
        if p.role == "STAFF":
            if n.action == "color-rules" and n.actor_role != "STAFF":
                continue
            matched.append(n)
        elif p.role == "HEAD":
            if n.action in ("external", "external-import", "external-delete"):
                if p.teacher and n.teacher == p.teacher:
                    matched.append(n)
                continue
            if n.action == "color-rules":
                if n.actor_role == "STAFF" or (p.teacher and n.teacher == p.teacher):
                    matched.append(n)
                continue
            if n.action in ("offerings", "plan-reset", "config", "send-all", "publish", "published-room", "catalog"):
                matched.append(n)
            elif p.department and n.department == p.department:
                matched.append(n)
            elif p.teacher and n.teacher == p.teacher:
                matched.append(n)
        else:
            # TEACHER
            if n.action in ("external", "external-import", "external-delete"):
                if p.teacher and n.teacher == p.teacher:
                    matched.append(n)
                continue
            if n.action == "color-rules":
                if n.actor_role == "STAFF" or (p.teacher and n.teacher == p.teacher):
                    matched.append(n)
                continue
            if n.action in ("publish", "published-room", "config", "plan-reset"):
                matched.append(n)
            elif p.teacher and n.teacher == p.teacher:
                matched.append(n)
    return [n.model_dump() for n in reversed(matched)]
