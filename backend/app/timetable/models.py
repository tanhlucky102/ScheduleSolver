"""Validated timetable aggregate and value models."""
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


def normalize_iso_date(v) -> str:
    if v is None:
        return ""
    if hasattr(v, "strftime"):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if not s:
        return ""
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    head = s.split(" ")[0]
    for sep in ("/", "-", "."):
        parts = head.split(sep)
        if len(parts) == 3 and all(p.isdigit() for p in parts):
            if len(parts[0]) == 4:
                return f"{int(parts[0]):04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"
            if len(parts[2]) == 4:
                return f"{int(parts[2]):04d}-{int(parts[1]):02d}-{int(parts[0]):02d}"
    return s[:20]


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Department(Model):
    id: str = Field(min_length=1, max_length=80)
    name: str
    status: Literal["UNSENT", "SENT", "SUBMITTED"] = "UNSENT"
    note: str = ""


class ShiftRule(Model):
    id: str = Field(min_length=1, max_length=40)
    label: str = Field(min_length=1, max_length=100)
    periods_label: str = Field(default="", max_length=60)
    start: int = Field(ge=0, le=1439)
    periods: float = Field(default=2.5, gt=0, le=8)
    include_break: bool = False
    break_minutes: int = Field(default=0, ge=0, le=60)
    end: int = Field(ge=1, le=1440)
    evening: bool = False
    @model_validator(mode="after")
    def valid_shift(self):
        if self.start >= self.end:
            raise ValueError("Shift start must precede end")
        return self


class ColorRule(Model):
    id: str = Field(min_length=1, max_length=80)
    category: Literal["PROGRAM", "KIND", "STATUS", "INSTITUTION", "CUSTOM"] = "CUSTOM"
    key: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=160)
    bg_color: str = Field(default="#f8fafc", max_length=20)
    border_color: str = Field(default="#cbd5e1", max_length=20)
    text_color: str = Field(default="#0f172a", max_length=20)
    note: str = Field(default="", max_length=500)


class HolidayRule(Model):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    start_date: str = Field(min_length=8, max_length=20)
    end_date: str = Field(min_length=8, max_length=20)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def _clean_holiday_dates(cls, v):
        return normalize_iso_date(v)

    @model_validator(mode="after")
    def _valid_holiday_range(self):
        if not self.start_date or not self.end_date:
            raise ValueError("Holiday requires start_date and end_date")
        if self.start_date > self.end_date:
            raise ValueError("Holiday start_date must not exceed end_date")
        return self


class Teacher(Model):
    id: str = Field(min_length=1, max_length=80)
    name: str
    department: str
    assistant: bool = False
    active: bool = True
    # Declared by the department head; reviewed by staff at G4.
    capabilities: dict[str, list[Literal["LEC", "TUT", "COMBINED"]]] = Field(default_factory=dict)
    color_rules: list[ColorRule] = Field(default_factory=list, max_length=100)


class Offering(Model):
    id: str = Field(min_length=1, max_length=80)
    course: str = Field(min_length=1, max_length=80)
    name: str
    cohort: str
    department: str
    students: int = Field(gt=0, le=10000)
    lecture_periods: float = Field(ge=0, le=8)
    tutorial_periods: float = Field(ge=0, le=8)
    room: Literal["PROJECTOR", "COMPUTER"]
    program: Literal["STANDARD", "CLC", "TT"] = "STANDARD"
    required_equipment: list[str] = Field(default_factory=list)
    required_room_type: str | None = None
    combined: bool | None = None
    lecture_room: Literal["PROJECTOR", "COMPUTER"] | None = None
    tutorial_room: Literal["PROJECTOR", "COMPUTER"] | None = None
    lecture_count: int | None = Field(default=None, gt=0)
    tutorial_count: int | None = Field(default=None, gt=0)
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def _clean_offering_dates(cls, v):
        return normalize_iso_date(v)

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
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must not exceed end date")
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
    periods: float
    room: str
    program: str
    teacher: str | None = None
    required_equipment: list[str] = Field(default_factory=list)
    required_room_type: str | None = None
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def _clean_session_dates(cls, v):
        return normalize_iso_date(v)


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


def _default_hanu_holidays() -> list[HolidayRule]:
    return [
        HolidayRule(
            id="HOL-0902",
            name="Nghỉ Lễ Quốc khánh 2/9",
            start_date="2026-08-31",
            end_date="2026-09-02",
        ),
        HolidayRule(
            id="HOL-1120",
            name="Kỷ niệm Ngày Nhà giáo Việt Nam 20/11",
            start_date="2026-11-20",
            end_date="2026-11-20",
        ),
        HolidayRule(
            id="HOL-1124",
            name="Nghỉ Lễ Ngày Văn hóa Việt Nam 24/11",
            start_date="2026-11-24",
            end_date="2026-11-24",
        ),
        HolidayRule(
            id="HOL-0101",
            name="Nghỉ Tết Dương lịch",
            start_date="2027-01-01",
            end_date="2027-01-01",
        ),
    ]


class Config(Model):
    term_name: str = Field(default="Học kỳ 1 - Năm học 2026 - 2027", max_length=200)
    term_start_date: str = Field(default="2026-08-03", max_length=20)
    term_end_date: str = Field(default="2027-01-03", max_length=20)
    holidays: list[HolidayRule] = Field(default_factory=_default_hanu_holidays, max_length=100)
    period_minutes: float = Field(default=50, gt=0, le=120)
    break_minutes: int = Field(default=10, ge=0, le=60)
    include_break: bool = True
    first_period_start: int = Field(default=430, ge=300, le=720)
    active_days: list[int] = Field(default_factory=lambda: [2, 3, 4, 5, 6, 7])
    shift_rules: list[ShiftRule] = Field(default_factory=list, max_length=20)
    color_rules: list[ColorRule] = Field(default_factory=list, max_length=100)
    max_periods: float = Field(default=8, ge=1, le=12)
    rooms: dict[Literal["PROJECTOR", "COMPUTER"], int] = Field(
        default_factory=lambda: {"PROJECTOR": 10, "COMPUTER": 5})
    slots: list[Slot] = Field(default_factory=list, max_length=300)
    soft_weights: dict[Literal["restricted", "single_class", "overload", "gaps_minutes"], int] = Field(
        default_factory=lambda: {"restricted":1, "single_class":1, "overload":1, "gaps_minutes":1})

    @field_validator("term_start_date", "term_end_date", mode="before")
    @classmethod
    def _clean_term_dates(cls, v):
        return normalize_iso_date(v)
    @model_validator(mode="after")
    def valid_rooms(self):
        if set(self.soft_weights) != {"restricted", "single_class", "overload", "gaps_minutes"} or any(v < 0 or v > 1000 for v in self.soft_weights.values()):
            raise ValueError("Soft weights must include all four preferences and be between 0 and 1000")
        if set(self.rooms) != {"PROJECTOR", "COMPUTER"} or any(v < 0 for v in self.rooms.values()):
            raise ValueError("Both room counts must be nonnegative")
        if any(d < 2 or d > 8 for d in self.active_days):
            raise ValueError("Active days must be between 2 and 8")
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
    activity_type: Literal["EXTERNAL_TEACHING", "STUDYING", "PERSONAL_BUSY", "MAKEUP"] = "EXTERNAL_TEACHING"
    color: str = Field(default="", max_length=20)
    note: str = Field(default="", max_length=500)
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def _clean_external_dates(cls, v):
        return normalize_iso_date(v)

    @model_validator(mode="after")
    def order(self):
        if self.start >= self.end:
            raise ValueError("Start must precede end")
        if not self.institution.strip() or not self.course.strip() or not self.class_name.strip():
            raise ValueError("Institution, course and class are required")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must not exceed end date")
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
