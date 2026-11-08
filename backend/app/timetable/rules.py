"""Pure timetable, room, and assignment validation rules."""
from collections import Counter, defaultdict
from math import ceil
from .models import State, Config, Session, Teacher, Offering, Room, Placement

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
    dept_ok = (s.department == t.department) or (s.course in t.capabilities)
    assistant_ok = (not t.assistant or s.kind == "TUT")
    kinds = t.capabilities.get(s.course, [])
    cap_ok = (s.kind in kinds or (s.kind == "COMBINED" and {"LEC", "TUT"}.issubset(kinds)))
    return dept_ok and assistant_ok and cap_ok


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


def room_errors(state: State, s: Session, room: Room, event: dict, res_index=None, pub_index=None):
    errors = []
    if not room.active:
        errors.append("inactive")
    if room.capacity < s.students:
        errors.append("capacity")
    equip = set(room.equipment)
    if room.room_type in ("PROJECTOR", "Phòng máy chiếu"):
        equip.add("PROJECTOR")
    if room.room_type in ("COMPUTER", "Phòng máy tính"):
        equip.add("COMPUTER")
    if not {s.room, *s.required_equipment}.issubset(equip):
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
    if res_index is not None:
        for r in res_index.get((room.id, event["day"]), ()):
            if r["start"] < event["end"] and event["start"] < r["end"]:
                errors.append("confirmed reservation")
                break
    else:
        for r in state.reservations:
            if r.room_id == room.id and r.day == event["day"] and r.start < event["end"] and event["start"] < r.end:
                errors.append("confirmed reservation")
                break
    if pub_index is not None:
        for r in pub_index.get((room.id, event["day"]), ()):
            if r["id"] != s.id and r["start"] < event["end"] and event["start"] < r["end"]:
                errors.append("published occupancy")
                break
    else:
        session_ids = {item.id for item in state.sessions}
        for r in state.published:
            if r.get("room_id") == room.id and r["id"] != s.id and r["id"] not in session_ids:
                if r["day"] == event["day"] and r["start"] < event["end"] and event["start"] < r["end"]:
                    errors.append("published occupancy")
                    break
    return errors


def placement_domains(state: State):
    result, diagnostics = {}, []
    res_index = defaultdict(list)
    for r in state.reservations:
        res_index[r.room_id, r.day].append({"start": r.start, "end": r.end})
    session_ids = {s.id for s in state.sessions}
    pub_index = defaultdict(list)
    for r in state.published:
        if r.get("room_id") and r["id"] not in session_ids:
            pub_index[r["room_id"], r["day"]].append({"id": r["id"], "start": r["start"], "end": r["end"]})
    for s in state.sessions:
        candidates, reasons = [], Counter()
        for i in legal_slots(s, state.config):
            slot = state.config.slots[i]
            event = dict(day=slot.day, start=slot.start, end=slot.start + duration(s, state.config))
            for room in state.rooms:
                errors = room_errors(state, s, room, event, res_index=res_index, pub_index=pub_index)
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
        if (s is None or not 0 <= p.slot < len(state.config.slots)
                or state.config.slots[p.slot].start + duration(s, state.config) > state.config.slots[p.slot].end):
            errors.append(f"Invalid placement: {p.session}")
            continue
        slot = state.config.slots[p.slot]
        rows.append(dict(s.model_dump(), day=slot.day, start=slot.start,
                         end=slot.start + duration(s, state.config), evening=slot.evening, room_id=p.room_id))
    errors.extend(f"Missing session: {s.id}" for s in state.sessions if s.id not in {r["id"] for r in rows})
    return rows, errors


def evaluate(state: State, placements: list[Placement], res_index=None, pub_index=None):
    rows, hard = events(state, placements)
    soft = Counter()
    rooms = {r.id: r for r in state.rooms}
    sessions = {s.id: s for s in state.sessions}
    if res_index is None:
        res_index = defaultdict(list)
        for r in state.reservations:
            res_index[r.room_id, r.day].append({"start": r.start, "end": r.end})
    if pub_index is None:
        session_ids = {s.id for s in state.sessions}
        pub_index = defaultdict(list)
        for r in state.published:
            if r.get("room_id") and r["id"] not in session_ids:
                pub_index[r["room_id"], r["day"]].append({"id": r["id"], "start": r["start"], "end": r["end"]})
    for row in rows:
        room = rooms.get(row["room_id"])
        if room is None:
            hard.append(f"Missing or unknown room: {row['id']}")
        else:
            hard.extend(f"Room {room.id}: {error}: {row['id']}" for error in room_errors(state, sessions[row["id"]], room, row, res_index=res_index, pub_index=pub_index))
    rows_by_day = defaultdict(list)
    for row in rows:
        rows_by_day[row["day"]].append(row)
    for day_rows in rows_by_day.values():
      for i, a in enumerate(day_rows):
        for b in day_rows[i+1:]:
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
