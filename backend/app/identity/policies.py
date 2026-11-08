"""Role and profile checks used by application services."""


class RequestError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def require_staff(principal):
    if principal.role != "STAFF":
        raise RequestError(403, "Staff role required")


def require_head(principal, department: str):
    if principal.role != "HEAD" or principal.department != department:
        raise RequestError(403, "Department head scope required")


def require_teacher_profile(principal, state):
    if principal.role in ("HEAD", "TEACHER"):
        teacher = next((t for t in state.teachers if t.id == principal.teacher), None)
        if teacher is None or (principal.role == "HEAD" and teacher.department != principal.department):
            raise RequestError(403, "Profile must reference a real teacher in its department")
