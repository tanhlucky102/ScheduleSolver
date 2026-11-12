from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from ..identity.policies import RequestError
from ..timetable.models import Placement, External
from ..timetable.rules import evaluate, placement_domains, require_ready, SchedulingConflict
from ..timetable.solver import solve, solve_worker
from ..timetable.publication import publish, add_external
from .schemas import Run


def _run_configured_solver(state, run: Run, on_progress=None):
    if run.algorithm == "PORTFOLIO" and run.threads == 3:
        return solve(state, run.iterations, run.seed, on_progress=on_progress)
    require_ready(state)
    if any(not r.get("room_id") for r in state.published):
        raise SchedulingConflict("ROOM_REVIEW_REQUIRED", ["Confirm room assignments for legacy published occupancy before solving"])
    domains, diagnostics = placement_domains(state)
    if diagnostics:
        raise SchedulingConflict("INFEASIBLE_INPUT", diagnostics)
    alg_cycle = ("HC", "SA", "TABU")
    algs = [alg_cycle[i % 3] if run.algorithm == "PORTFOLIO" else run.algorithm for i in range(run.threads)]
    with ThreadPoolExecutor(max_workers=run.threads) as pool:
        futures = [
            pool.submit(solve_worker, state, alg, run.seed + i, run.iterations, domains, on_progress=on_progress)
            for i, alg in enumerate(algs)
        ]
        results = [f.result() for f in futures]
    best = min(results, key=lambda item: tuple(item[1]["score"]))
    report = evaluate(state, best[0])
    if report["hard"]:
        raise SchedulingConflict("SEARCH_EXHAUSTED", report["violations"])
    return best[0], [r[1] for r in results]


def apply(state, action, data, p):
    if action == "solve":
        run = Run.model_validate(data)
        state.draft, runs = _run_configured_solver(state, run)
        return {"runs": runs, "evaluation": evaluate(state, state.draft)}
    elif action == "placement":
        placement = Placement.model_validate(data)
        if placement.session not in {s.id for s in state.sessions}:
            raise ValueError("Unknown session")
        if placement.room_id not in {r.id for r in state.rooms}:
            raise ValueError("Unknown room")
        state.draft = [x for x in state.draft if x.session != placement.session] + [placement]
        return {"evaluation": evaluate(state, state.draft)}
    elif action == "publish":
        publish(state)
    elif action == "external-delete":
        if p.role not in ("HEAD", "TEACHER") or not p.teacher:
            raise RequestError(403, "Teacher identity required")
        item = next(e for e in state.external if e.id == data["id"] and e.teacher == p.teacher)
        state.external.remove(item)
    elif action == "external":
        if p.role not in ("HEAD", "TEACHER") or not p.teacher:
            raise RequestError(403, "Teacher identity required")
        if "teacher" in data or "id" in data:
            raise RequestError(422, "Teacher and identity are server assigned")
        external = External.model_validate(dict(data, id=str(uuid4()), teacher=p.teacher))
        add_external(state, external)
    elif action == "external-import":
        if p.role not in ("HEAD", "TEACHER") or not p.teacher:
            raise RequestError(403, "Teacher identity required")
        items = data.get("items")
        if not isinstance(items, list) or not items:
            raise ValueError("Danh sách lịch import rỗng")
        imported = 0
        for raw_item in items:
            cleaned = {k: v for k, v in raw_item.items() if k not in ("id", "teacher")}
            external = External.model_validate(dict(cleaned, id=str(uuid4()), teacher=p.teacher))
            add_external(state, external)
            imported += 1
        return {"imported": imported}
    return {}
