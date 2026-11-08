from uuid import uuid4
from ..identity.policies import RequestError
from ..timetable.models import Placement, External
from ..timetable.rules import evaluate
from ..timetable.solver import solve
from ..timetable.publication import publish, add_external
from .schemas import Run


def apply(state, action, data, p):
    if action == "solve":
        run = Run.model_validate(data)
        state.draft, runs = solve(state, run.iterations, run.seed)
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
    return {}
