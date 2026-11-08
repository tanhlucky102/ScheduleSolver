"""Compatibility exports for existing callers; new modules import direct dependencies."""

from .timetable.models import (
    Model as Model,
    Department as Department,
    Teacher as Teacher,
    Offering as Offering,
    Session as Session,
    Slot as Slot,
    Config as Config,
    Room as Room,
    Reservation as Reservation,
    Placement as Placement,
    External as External,
    State as State,
)

from .timetable.rules import (
    split as split,
    eligible as eligible,
    assignment_errors as assignment_errors,
    require_ready as require_ready,
    duration as duration,
    legal_slots as legal_slots,
    overlap as overlap,
    room_errors as room_errors,
    placement_domains as placement_domains,
    SchedulingConflict as SchedulingConflict,
    events as events,
    evaluate as evaluate,
)

from .timetable.solver import (
    constructive_initial as constructive_initial,
    solve_worker as solve_worker,
    solve as solve,
)

from .timetable.publication import (
    publish as publish,
    add_external as add_external,
)

__all__ = [
    "Model",
    "Department",
    "Teacher",
    "Offering",
    "Session",
    "Slot",
    "Config",
    "Room",
    "Reservation",
    "Placement",
    "External",
    "State",
    "split",
    "eligible",
    "assignment_errors",
    "require_ready",
    "duration",
    "legal_slots",
    "overlap",
    "room_errors",
    "placement_domains",
    "SchedulingConflict",
    "events",
    "evaluate",
    "constructive_initial",
    "solve_worker",
    "solve",
    "publish",
    "add_external",
]
