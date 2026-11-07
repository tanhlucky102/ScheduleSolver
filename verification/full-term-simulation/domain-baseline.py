"""Business rules sourced from the BA document, sections 2–5."""
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from math import ceil, exp
import random

from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Literal


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


def split(offering: Offering) -> list[Session]:
    o = offering
    def sizes(n, k):
        return [n // k + (i < n % k) for i in range(k)]
    result = []
    def add(kind, section, group, students, periods):
        result.append(Session(id=f"{o.id}-{kind}-{group}", offering=o.id, course=o.course,
            cohort=o.cohort, department=o.department, section=section, kind=kind,
            students=students, periods=periods, room=(o.lecture_room or o.room) if kind=="LEC" else (o.tutorial_room or o.room), program=o.program,
            required_equipment=o.required_equipment, required_room_type=o.required_room_type))
    if o.combined is True or (o.combined is None and o.lecture_periods + o.tutorial_periods == 4):
        for i, n in enumerate(sizes(o.students, o.tutorial_count or ceil(o.students / 30))):
            add("COMBINED", str(i), str(i), n, o.lecture_periods + o.tutorial_periods)
    elif not o.lecture_periods:
        for i, n in enumerate(sizes(o.students, o.tutorial_count or ceil(o.students / 30))):
            add("TUT", str(i), str(i), n, o.tutorial_periods)
    else:
        lecture_count = o.lecture_count or ceil(o.students / 200)
        for i, n in enumerate(sizes(o.students, lecture_count)):
            add("LEC", str(i), str(i), n, o.lecture_periods)
            if o.tutorial_periods:
                group_count = sizes(o.tutorial_count, lecture_count)[i] if o.tutorial_count else ceil(n / 30)
                for j, m in enumerate(sizes(n, group_count)):
                    add("TUT", str(i), f"{i}-{j}", m, o.tutorial_periods)
    return result


def eligible(s: Session, t: Teacher) -> bool:
    return (s.department == t.department and (not t.assistant or s.kind == "TUT")
            and (s.kind in t.capabilities.get(s.course, []) or (s.kind == "COMBINED" and {"LEC", "TUT"}.issubset(t.capabilities.get(s.course, [])))))


def assignment_errors(state: State, department: str | None = None) -> list[str]:
    teachers = {t.id: t for t in state.teachers}
    return [f"Invalid teacher: {s.id}" for s in state.sessions
            if (department is None or s.department == department)
            and (s.teacher not in teachers or not eligible(s, teachers[s.teacher]))]


def require_ready(state: State):
    if not state.sessions or not state.departments:
        raise ValueError("No plan")
    if any(d.status != "SUBMITTED" for d in state.departments):
        raise ValueError("All departments must submit")
    errors = assignment_errors(state)
    if errors:
        raise ValueError("; ".join(errors))


def duration(s: Session, c: Config):
    return s.periods * c.period_minutes + (s.periods - 1) * c.break_minutes


def legal_slots(s: Session, c: Config):
    return [i for i, slot in enumerate(c.slots) if slot.start + duration(s, c) <= slot.end]


def overlap(a, b):
    return a["day"] == b["day"] and a["start"] < b["end"] and b["start"] < a["end"]


def room_errors(state: State, s: Session, room: Room, event: dict):
    errors = []
    if not room.active:
        errors.append("inactive")
    if room.capacity < s.students:
        errors.append("capacity")
    if not {s.room, *s.required_equipment}.issubset(room.equipment):
        errors.append("equipment")
    if s.required_room_type and room.room_type != s.required_room_type:
        errors.append("room type")
    if ((room.allowed_departments and s.department not in room.allowed_departments)
        or (room.allowed_programs and s.program not in room.allowed_programs)
        or (room.allowed_courses and s.course not in room.allowed_courses)):
        errors.append("usage conditions")
    if not any(w.day == event["day"] and w.start <= event["start"] and event["end"] <= w.end
               for w in room.availability):
        errors.append("availability")
    if any(r.room_id == room.id and overlap(r.model_dump(), event) for r in state.reservations):
        errors.append("confirmed reservation")
    if any(r.get("room_id") == room.id and r["id"] != s.id and overlap(r, event) for r in state.published):
        errors.append("published occupancy")
    return errors


def placement_domains(state: State):
    result, diagnostics = {}, []
    for s in state.sessions:
        candidates, reasons = [], Counter()
        for i in legal_slots(s, state.config):
            slot = state.config.slots[i]
            event = dict(day=slot.day, start=slot.start, end=slot.start + duration(s, state.config))
            for room in state.rooms:
                errors = room_errors(state, s, room, event)
                reasons.update(errors)
                if not errors:
                    candidates.append(Placement(session=s.id, slot=i, room_id=room.id))
        result[s.id] = candidates
        if not candidates:
            diagnostics.append(f"No feasible room/time for {s.id}: " +
                ("no rooms declared" if not state.rooms else str(dict(reasons)) if reasons else "no legal time slot"))
    return result, diagnostics


class SchedulingConflict(ValueError):
    def __init__(self, status, violations):
        self.status, self.violations = status, violations
        super().__init__("; ".join(violations))


def events(state: State, placements: list[Placement]):
    sessions = {s.id: s for s in state.sessions}
    rows, errors, seen = [], [], set()
    for p in placements:
        if p.session in seen:
            errors.append(f"Duplicate session: {p.session}")
            continue
        seen.add(p.session)
        s = sessions.get(p.session)
        if s is None or p.slot not in legal_slots(s, state.config):
            errors.append(f"Invalid placement: {p.session}")
            continue
        slot = state.config.slots[p.slot]
        rows.append(dict(s.model_dump(), day=slot.day, start=slot.start,
                         end=slot.start + duration(s, state.config), evening=slot.evening, room_id=p.room_id))
    errors.extend(f"Missing session: {s.id}" for s in state.sessions if s.id not in {r["id"] for r in rows})
    return rows, errors


def evaluate(state: State, placements: list[Placement]):
    rows, hard = events(state, placements)
    soft = Counter()
    rooms = {r.id: r for r in state.rooms}
    sessions = {s.id: s for s in state.sessions}
    for row in rows:
        room = rooms.get(row["room_id"])
        if room is None:
            hard.append(f"Missing or unknown room: {row['id']}")
        else:
            hard.extend(f"Room {room.id}: {error}: {row['id']}" for error in room_errors(state, sessions[row["id"]], room, row))
    for i, a in enumerate(rows):
        for b in rows[i+1:]:
            if not overlap(a, b):
                continue
            if a["room_id"] is not None and a["room_id"] == b["room_id"]:
                hard.append(f"Room overlap: {a['room_id']}: {a['id']} / {b['id']}")
            if a["teacher"] == b["teacher"]:
                hard.append(f"Teacher overlap: {a['id']} / {b['id']}")
            if (a["offering"] == b["offering"] and a["section"] == b["section"]
                    and {a["kind"], b["kind"]} == {"LEC", "TUT"}):
                hard.append(f"Lec/Tut overlap: {a['id']} / {b['id']}")
            if a["program"] == b["program"] == "CLC" and a["cohort"] == b["cohort"] and a["section"] == b["section"]:
                hard.append(f"CLC overlap: {a['id']} / {b['id']}")
    groups = defaultdict(list)
    for r in rows:
        groups[r["teacher"], r["day"]].append(r)
        soft["restricted"] += int(r["day"] == 7) + int(r["evening"])
    for group in groups.values():
        group.sort(key=lambda r: r["start"])
        soft["single_class"] += int(len(group) == 1)
        soft["overload"] += max(0, sum(r["periods"] for r in group) - state.config.max_periods)
        # Union interval frontier prevents double-counting nested overlapping lessons.
        end = group[0]["end"]
        for r in group[1:]:
            soft["gaps_minutes"] += max(0, r["start"] - end)
            end = max(end, r["end"])
    return {"hard": len(hard), "violations": hard, "soft": dict(soft), "soft_total": sum(value * state.config.soft_weights[key] for key, value in soft.items())}


def solve_worker(state: State, algorithm: str, seed: int, iterations: int):
    rng = random.Random(seed)
    domains, _ = placement_domains(state)
    current = [deepcopy(rng.choice(domains[s.id])) for s in state.sessions if domains[s.id]]
    def score(p):
        e = evaluate(state, p)
        return e["hard"], e["soft_total"]
    current_score = score(current)
    best, best_score = deepcopy(current), current_score
    tabu = []
    for step in range(iterations):
        if not current:
            break
        idx = rng.randrange(len(current))
        candidate = deepcopy(current)
        old = (candidate[idx].slot, candidate[idx].room_id)
        candidate[idx] = deepcopy(rng.choice(domains[candidate[idx].session]))
        new = (candidate[idx].slot, candidate[idx].room_id)
        next_score = score(candidate)
        move = (idx, new)
        if algorithm == "TABU" and move in tabu and next_score >= best_score:
            continue
        accept = next_score < current_score
        if algorithm == "SA":
            temperature = max(.01, 1-step/max(1, iterations))
            # Never sacrifice a hard improvement for an arbitrarily large soft score.
            accept = next_score[0] < current_score[0] or (next_score[0] == current_score[0] and
                (accept or rng.random() < exp(min(0, (current_score[1]-next_score[1])/(100*temperature)))))
        if algorithm == "TABU":
            accept = True
        if accept:
            current, current_score = candidate, next_score
            tabu = (tabu + [(idx, old)])[-15:]
            if current_score < best_score:
                best, best_score = deepcopy(current), current_score
    return best, {"algorithm": algorithm, "seed": seed, "score": best_score}


def solve(state: State, iterations: int = 500, seed: int = 42):
    require_ready(state)
    if any(not r.get("room_id") for r in state.published):
        raise SchedulingConflict("ROOM_REVIEW_REQUIRED", ["Confirm room assignments for legacy published occupancy before solving"])
    _, diagnostics = placement_domains(state)
    if diagnostics:
        raise SchedulingConflict("INFEASIBLE_INPUT", diagnostics)
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(solve_worker, state, a, seed+i, iterations)
                   for i, a in enumerate(("HC", "SA", "TABU"))]
        results = [f.result() for f in futures]
    best = min(results, key=lambda item: tuple(item[1]["score"]))
    report = evaluate(state, best[0])
    if report["hard"]:
        raise SchedulingConflict("SEARCH_EXHAUSTED", report["violations"])
    return best[0], [r[1] for r in results]


def publish(state: State):
    require_ready(state)
    report = evaluate(state, state.draft)
    if report["hard"]:
        raise ValueError("Publication requires zero hard violations")
    state.published = deepcopy(events(state, state.draft)[0])


def add_external(state: State, external: External):
    if not state.published:
        raise ValueError("Published faculty timetable required")
    if any(r["teacher"] == external.teacher and overlap(r, external.model_dump()) for r in state.published):
        raise ValueError("Faculty timetable has priority; external session conflicts")
    if any(e.teacher == external.teacher and overlap(e.model_dump(), external.model_dump()) for e in state.external):
        raise ValueError("External session overlaps an existing external session")
    state.external.append(external)
