from collections import defaultdict
from ..timetable.models import Config, Offering, Placement, Slot
from ..timetable.rules import split, shift_duration, slot_event_end


def _group_slots_by_day(slots):
    by_day = defaultdict(list)
    for idx, sl in enumerate(slots):
        by_day[sl.day].append((idx, sl))
    for d in by_day:
        by_day[d].sort(key=lambda item: (item[1].start, item[1].end))
    return by_day


def apply(state, action, data, p):
    if action == "config":
        old = state.config
        new_cfg = Config.model_validate(data)

        old_shifts = sorted([sh for sh in old.shift_rules if sh.end > sh.start], key=lambda x: x.start)
        new_shifts = sorted([sh for sh in new_cfg.shift_rules if sh.end > sh.start], key=lambda x: x.start)
        old_slots_by_day = _group_slots_by_day(old.slots)
        new_slots_by_day = _group_slots_by_day(new_cfg.slots)
        old_slot_rank = {
            idx: (day, rank)
            for day, items in old_slots_by_day.items()
            for rank, (idx, _sl) in enumerate(items)
        }

        if new_cfg.slots:
            min_st = min(sl.start for sl in new_cfg.slots)
            max_en = max(sl.end for sl in new_cfg.slots)
            old_days = set(old.active_days or [])
            for room in state.rooms:
                full_day_windows = [w for w in room.availability if w.end - w.start >= 480]
                if not full_day_windows:
                    continue
                covered_days = {w.day for w in full_day_windows}
                for w in full_day_windows:
                    w.start = min(w.start, min_st)
                    w.end = max(w.end, max_en)
                if old_days and old_days.issubset(covered_days):
                    for d in (new_cfg.active_days or []):
                        if d not in covered_days:
                            room.availability.append(Slot(day=d, start=min_st, end=max_en))

        state.config = new_cfg

        if state.draft:
            sessions_by_id = {s.id: s for s in state.sessions}
            remapped_draft = []
            for pl in state.draft:
                s = sessions_by_id.get(pl.session)
                loc = old_slot_rank.get(pl.slot)
                if s is None or loc is None:
                    continue
                day, rank = loc
                day_items = new_slots_by_day.get(day)
                if not day_items or rank >= len(day_items):
                    continue
                new_slot_idx, new_sl = day_items[rank]
                if slot_event_end(s, new_sl, new_cfg) <= new_sl.end:
                    remapped_draft.append(Placement(session=pl.session, slot=new_slot_idx, room_id=pl.room_id))
            state.draft = remapped_draft if len(remapped_draft) == len(state.sessions) else []

        if state.published:
            for pub in state.published:
                day = pub.get("day")
                old_start = int(pub.get("start", 0))
                if old_shifts:
                    rank = min(range(len(old_shifts)), key=lambda r: abs(old_shifts[r].start - old_start))
                elif day in old_slots_by_day and old_slots_by_day[day]:
                    day_old = old_slots_by_day[day]
                    rank = min(range(len(day_old)), key=lambda r: abs(day_old[r][1].start - old_start))
                else:
                    rank = 0

                if new_shifts:
                    r_idx = min(rank, len(new_shifts) - 1)
                    sh = new_shifts[r_idx]
                    pub["start"] = sh.start
                    if pub.get("kind") == "COMBINED" and r_idx + 1 < len(new_shifts):
                        pub["end"] = new_shifts[r_idx + 1].end
                    else:
                        pub["end"] = sh.end
                    pub["evening"] = bool(sh.evening)
                elif day in new_slots_by_day and new_slots_by_day[day]:
                    day_new = new_slots_by_day[day]
                    r_idx = min(rank, len(day_new) - 1)
                    _idx, new_sl = day_new[r_idx]
                    dur = shift_duration(
                        float(pub.get("periods") or 2),
                        new_cfg.period_minutes,
                        new_cfg.break_minutes,
                        new_cfg.include_break,
                    )
                    pub["start"] = new_sl.start
                    pub["end"] = min(new_sl.end, new_sl.start + dur)
                    pub["evening"] = bool(new_sl.evening)
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
