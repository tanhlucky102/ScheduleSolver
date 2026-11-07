"""Validated timetable aggregate and value models."""
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator

class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Department(Model):
    id: str = Field(min_length=1, max_length=80)
    name: str
    status: Literal["UNSENT", "SENT", "SUBMITTED"] = "UNSENT"
    note: str = ""


class Teacher(Model):
    id: str = Field(min_length=1, max_length=80)
    name: str
    department: str
    assistant: bool = False
    # Declared by the department head; reviewed by staff at G4.
    capabilities: dict[str, list[Literal["LEC", "TUT", "COMBINED"]]] = Field(default_factory=dict)


class Offering(Model):
    id: str = Field(min_length=1, max_length=80)
    course: str = Field(min_length=1, max_length=80)
    name: str
    cohort: str
    department: str
    students: int = Field(gt=0, le=10000)
    lecture_periods: int = Field(ge=0, le=8)
    tutorial_periods: int = Field(ge=0, le=8)
    room: Literal["PROJECTOR", "COMPUTER"]
    program: Literal["STANDARD", "CLC", "TT"] = "STANDARD"
    required_equipment: list[str] = Field(default_factory=list)
    required_room_type: str | None = None
    combined: bool | None = None
    lecture_room: Literal["PROJECTOR", "COMPUTER"] | None = None
    tutorial_room: Literal["PROJECTOR", "COMPUTER"] | None = None
    lecture_count: int | None = Field(default=None, gt=0)
    tutorial_count: int | None = Field(default=None, gt=0)
    @model_validator(mode="after")
    def periods(self):
        if not 1 <= self.lecture_periods + self.tutorial_periods <= 8:
            raise ValueError("Total periods must be between 1 and 8")
        if self.combined is True and not (self.lecture_periods and self.tutorial_periods):
            raise ValueError("Combined requires both lecture and tutorial periods")
        if any(n is not None and n > self.students for n in (self.lecture_count, self.tutorial_count)):
            raise ValueError("More groups than students")
        if self.lecture_count and self.tutorial_count and not self.combined and self.tutorial_count < self.lecture_count:
            raise ValueError("Tutorial count must cover every lecture section")
        return self


class Session(Model):
    id: str
    offering: str
    course: str
    cohort: str
    department: str
    section: str
    kind: Literal["LEC", "TUT", "COMBINED"]
    students: int
    periods: int
    room: str
    program: str
    teacher: str | None = None
    required_equipment: list[str] = Field(default_factory=list)
    required_room_type: str | None = None


class Slot(Model):
    day: int = Field(ge=2, le=8)
    start: int = Field(ge=0, le=1439)
    end: int = Field(ge=1, le=1440)
    evening: bool = False
    @model_validator(mode="after")
    def order(self):
        if self.start >= self.end:
            raise ValueError("Start must precede end")
        return self


class Config(Model):
    period_minutes: int = Field(default=50, ge=1, le=120)
    break_minutes: int = Field(default=10, ge=0, le=60)
    max_periods: int = Field(default=8, ge=1, le=8)
    rooms: dict[Literal["PROJECTOR", "COMPUTER"], int] = Field(
        default_factory=lambda: {"PROJECTOR": 10, "COMPUTER": 5})
    slots: list[Slot] = Field(default_factory=list, max_length=300)
    soft_weights: dict[Literal["restricted", "single_class", "overload", "gaps_minutes"], int] = Field(
        default_factory=lambda: {"restricted":1, "single_class":1, "overload":1, "gaps_minutes":1})
    @model_validator(mode="after")
    def valid_rooms(self):
        if set(self.soft_weights) != {"restricted", "single_class", "overload", "gaps_minutes"} or any(v < 0 or v > 1000 for v in self.soft_weights.values()):
            raise ValueError("Soft weights must include all four preferences and be between 0 and 1000")
        if set(self.rooms) != {"PROJECTOR", "COMPUTER"} or any(v < 0 for v in self.rooms.values()):
            raise ValueError("Both room counts must be nonnegative")
        if len({(s.day, s.start, s.end) for s in self.slots}) != len(self.slots):
            raise ValueError("Duplicate slots")
        return self


class Room(Model):
    id: str = Field(min_length=1, max_length=80, pattern=r"^\S(?:.*\S)?$")
    name: str = Field(min_length=1, max_length=200)
    capacity: int = Field(gt=0, le=10000)
    room_type: str = Field(min_length=1, max_length=100)
    equipment: list[str] = Field(default_factory=list)
    availability: list[Slot] = Field(default_factory=list, max_length=300)
    active: bool = True
    allowed_departments: list[str] = Field(default_factory=list)
    allowed_programs: list[Literal["STANDARD", "CLC", "TT"]] = Field(default_factory=list)
    allowed_courses: list[str] = Field(default_factory=list)
    note: str = Field(default="", max_length=1000)


class Reservation(Slot):
    id: str = Field(min_length=1, max_length=80, pattern=r"^\S(?:.*\S)?$")
    room_id: str = Field(min_length=1, max_length=80, pattern=r"^\S(?:.*\S)?$")
    reason: str = Field(min_length=1, max_length=500)


class Placement(Model):
    session: str
    slot: int = Field(ge=0)
    room_id: str | None = None


class External(Model):
    id: str
    teacher: str
    day: int = Field(ge=2, le=8)
    start: int = Field(ge=360, le=1319)
    end: int = Field(ge=361, le=1320)
    course: str = Field(min_length=1, max_length=200)
    class_name: str = Field(min_length=1, max_length=100)
    room: str = Field(default="", max_length=100)
    institution: str = Field(min_length=1, max_length=200)
    @model_validator(mode="after")
    def order(self):
        if self.start >= self.end:
            raise ValueError("Start must precede end")
        if not self.institution.strip() or not self.course.strip() or not self.class_name.strip():
            raise ValueError("Institution, course and class are required")
        return self


class State(Model):
    config: Config = Field(default_factory=Config)
    departments: list[Department] = Field(default_factory=list)
    teachers: list[Teacher] = Field(default_factory=list)
    offerings: list[Offering] = Field(default_factory=list)
    sessions: list[Session] = Field(default_factory=list)
    draft: list[Placement] = Field(default_factory=list)
    published: list[dict] = Field(default_factory=list)
    external: list[External] = Field(default_factory=list)
    rooms: list[Room] = Field(default_factory=list)
    reservations: list[Reservation] = Field(default_factory=list)
    @model_validator(mode="after")
    def integrity(self):
        for items in (self.departments, self.teachers, self.offerings, self.sessions, self.external, self.rooms, self.reservations):
            if len({x.id for x in items}) != len(items):
                raise ValueError("Duplicate identity")
        deps = {d.id for d in self.departments}
        teachers = {t.id for t in self.teachers}
        offerings = {o.id for o in self.offerings}
        if any(t.department not in deps for t in self.teachers):
            raise ValueError("Unknown teacher department")
        if any(o.department not in deps for o in self.offerings):
            raise ValueError("Unknown offering department")
        if any(s.department not in deps or s.offering not in offerings or
               (s.teacher is not None and s.teacher not in teachers) for s in self.sessions):
            raise ValueError("Broken session reference")
        if any(e.teacher not in teachers for e in self.external):
            raise ValueError("Unknown external teacher")
        room_ids = {r.id for r in self.rooms}
        if any(r.room_id not in room_ids for r in self.reservations):
            raise ValueError("Unknown reserved room")
        if any(set(r.allowed_departments) - deps for r in self.rooms):
            raise ValueError("Unknown allowed department")
        return self
