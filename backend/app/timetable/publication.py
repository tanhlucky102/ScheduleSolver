"""Publish validated drafts and register external teaching sessions."""
from copy import deepcopy
from .models import State, External
from .rules import require_ready, evaluate, events, overlap

def publish(state: State):
    require_ready(state)
    report = evaluate(state, state.draft)
    if report["hard"]:
        raise ValueError("Publication requires zero hard violations")
    state.published = deepcopy(events(state, state.draft)[0])


def add_external(state: State, external: External):
    if any(r["teacher"] == external.teacher and overlap(r, external.model_dump()) for r in state.published):
        raise ValueError("Faculty timetable has priority; external session conflicts")
    if any(e.teacher == external.teacher and overlap(e.model_dump(), external.model_dump()) for e in state.external):
        raise ValueError("External session overlaps an existing external session")
    state.external.append(external)
