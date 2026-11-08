from ..identity.policies import RequestError, require_staff, require_teacher_profile
from ..catalog import commands as catalog_commands
from ..rooms import commands as room_commands
from ..planning import commands as plan_commands
from ..assignments import commands as assignment_commands
from ..scheduling import commands as schedule_commands

STAFF_ACTIONS = {
    "catalog", "config", "offerings", "plan-reset", "send", "send-all", "return", "solve", "placement", "publish",
    "rooms", "rooms-delete", "reservation", "reservation-delete", "requirements", "published-room",
    "department-save", "department-delete", "teacher-save", "teacher-delete", "rooms-preset",
}
HANDLERS = {
    **dict.fromkeys(("catalog", "department-save", "department-delete", "teacher-save", "teacher-delete"), catalog_commands.apply),
    **dict.fromkeys(("rooms-preset", "rooms", "rooms-delete", "published-room", "reservation", "reservation-delete", "requirements"), room_commands.apply),
    **dict.fromkeys(("config", "offerings", "plan-reset", "send", "send-all"), plan_commands.apply),
    **dict.fromkeys(("assign", "balance", "teacher", "submit", "capabilities-preset", "return"), assignment_commands.apply),
    **dict.fromkeys(("solve", "placement", "publish", "external-delete", "external"), schedule_commands.apply),
}


def apply(state, action, data, p):
    require_teacher_profile(p, state)
    if action in STAFF_ACTIONS:
        require_staff(p)
    handler = HANDLERS.get(action)
    if handler is None:
        raise RequestError(404, "Unknown command")
    return handler(state, action, data, p)
