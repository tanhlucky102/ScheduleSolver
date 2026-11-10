"""Search algorithms for a validated timetable aggregate."""
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from math import exp
import random
from .models import State
from .rules import duration, overlap, placement_domains, evaluate, require_ready, SchedulingConflict

def constructive_initial(state: State, domains, rng):
    """Seed search with constrained greedy placements; independent evaluation remains authoritative."""
    neighbors = {}
    for s in state.sessions:
        neighbors[s.id] = {t.id for t in state.sessions if t.id != s.id and (
            s.teacher == t.teacher or
            (s.offering == t.offering and s.section == t.section and {s.kind, t.kind} == {"LEC", "TUT"}) or
            (s.program == t.program == "CLC" and s.cohort == t.cohort and s.section == t.section))}
    # Most constrained and longest sessions first; seeds vary equal-priority ordering.
    order = sorted(state.sessions, key=lambda s: (
        -len(neighbors[s.id]), -duration(s, state.config), len(domains[s.id]), rng.random()))
    placed, occupied, teacher_days = {}, defaultdict(list), defaultdict(list)
    for s in order:
        by_slot = {}
        for p in domains[s.id]:
            by_slot.setdefault(p.slot, []).append(p)
        best, best_key = None, None
        for slot_index, options in by_slot.items():
            slot = state.config.slots[slot_index]
            event = dict(day=slot.day, start=slot.start, end=slot.start + duration(s, state.config))
            clashes = sum(overlap(placed[n][1], event) for n in neighbors[s.id] if n in placed)
            teaching = teacher_days[s.teacher, slot.day]
            # Prefer compact days without hardening the configurable soft preferences.
            weights = state.config.soft_weights
            soft_hint = weights["restricted"] * (int(slot.day == 7) + int(slot.evening))
            if teaching:
                gap = min(max(0, max(e["start"] - event["end"], event["start"] - e["end"])) for e in teaching)
                soft_hint += weights["gaps_minutes"] * gap
            else:
                soft_hint += weights["single_class"]
            periods = sum(e["periods"] for e in teaching)
            soft_hint += weights["overload"] * max(0, periods + s.periods - state.config.max_periods)
            for p in options:
                room_clashes = sum(overlap(e, event) for e in occupied[p.room_id, slot.day])
                key = (clashes + room_clashes, soft_hint, rng.random())
                if best_key is None or key < best_key:
                    best, best_key = p, key
        if best is None:
            continue
        slot = state.config.slots[best.slot]
        event = dict(day=slot.day, start=slot.start, end=slot.start + duration(s, state.config), periods=s.periods)
        placed[s.id] = (best, event)
        occupied[best.room_id, slot.day].append(event)
        teacher_days[s.teacher, slot.day].append(event)
    return [deepcopy(placed[s.id][0]) for s in state.sessions if s.id in placed]


def solve_worker(
    state: State,
    algorithm: str,
    seed: int,
    iterations: int,
    domains: dict | None = None,
    on_progress=None,
):
    rng = random.Random(seed)
    if domains is None:
        domains, _ = placement_domains(state)
    current = constructive_initial(state, domains, rng)
    res_index = defaultdict(list)
    for r in state.reservations:
        res_index[r.room_id, r.day].append({"start": r.start, "end": r.end})
    session_ids = {s.id for s in state.sessions}
    pub_index = defaultdict(list)
    for r in state.published:
        if r.get("room_id") and r["id"] not in session_ids:
            pub_index[r["room_id"], r["day"]].append({"id": r["id"], "start": r["start"], "end": r["end"]})
    def score(p):
        e = evaluate(state, p, res_index=res_index, pub_index=pub_index)
        return e["hard"], e["soft_total"]
    current_score = score(current)
    initial_score = current_score
    best, best_score = deepcopy(current), current_score
    tabu = []
    stagnant_steps = 0
    completed_steps = 0
    last_progress_step = 0

    def report_progress(step):
        nonlocal last_progress_step
        if on_progress and (step % 20 == 0 or step == iterations):
            on_progress({
                "algorithm": algorithm,
                "step": step,
                "iterations": iterations,
                "hard": best_score[0],
                "soft": best_score[1],
            })
            last_progress_step = step

    for step in range(iterations):
        completed_steps = step + 1
        if not current:
            break
        if best_score[0] == 0 and stagnant_steps >= 25:
            break
        idx = rng.randrange(len(current))
        # Placements are replaced, never mutated; copying the list preserves isolation.
        candidate = list(current)
        old = (candidate[idx].slot, candidate[idx].room_id)
        candidate[idx] = deepcopy(rng.choice(domains[candidate[idx].session]))
        new = (candidate[idx].slot, candidate[idx].room_id)
        next_score = score(candidate)
        move = (idx, new)
        if algorithm == "TABU" and move in tabu and next_score >= best_score:
            report_progress(completed_steps)
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
                stagnant_steps = 0
            else:
                stagnant_steps += 1
        report_progress(completed_steps)
    if on_progress and completed_steps != last_progress_step:
        on_progress({
            "algorithm": algorithm,
            "step": completed_steps,
            "iterations": iterations,
            "hard": best_score[0],
            "soft": best_score[1],
        })
    return best, {"algorithm": algorithm, "seed": seed, "score": best_score, "initial_score": initial_score, "initialization": "constrained_greedy"}


def solve(state: State, iterations: int = 150, seed: int = 42, on_progress=None):
    require_ready(state)
    if any(not r.get("room_id") for r in state.published):
        raise SchedulingConflict("ROOM_REVIEW_REQUIRED", ["Confirm room assignments for legacy published occupancy before solving"])
    domains, diagnostics = placement_domains(state)
    if diagnostics:
        raise SchedulingConflict("INFEASIBLE_INPUT", diagnostics)
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(solve_worker, state, a, seed+i, iterations, domains, on_progress)
                   for i, a in enumerate(("HC", "SA", "TABU"))]
        results = [f.result() for f in futures]
    best = min(results, key=lambda item: tuple(item[1]["score"]))
    report = evaluate(state, best[0])
    if report["hard"]:
        raise SchedulingConflict("SEARCH_EXHAUSTED", report["violations"])
    return best[0], [r[1] for r in results]
