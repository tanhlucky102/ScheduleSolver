from copy import deepcopy
from itertools import product
import pytest
from app.domain import *
from test_domain import ready
from test_api import api, post


@pytest.mark.parametrize("change,reason", [
    ({"capacity": 20}, "capacity"),
    ({"equipment": []}, "equipment"),
    ({"availability": []}, "availability"),
    ({"active": False}, "inactive"),
    ({"allowed_courses": ["OTHER"]}, "usage conditions"),
    ({"allowed_programs": ["CLC"]}, "usage conditions"),
])
def test_room_input_conflicts(change, reason):
    state = ready()
    state.rooms[0] = state.rooms[0].model_copy(update=change)
    with pytest.raises(SchedulingConflict, match=reason) as exc:
        solve(state)
    assert exc.value.status == "INFEASIBLE_INPUT"


def test_no_invented_rooms():
    state = ready()
    state.rooms = []
    with pytest.raises(SchedulingConflict, match="no rooms declared"):
        solve(state)
    assert evaluate(state, [Placement(session=s.id, slot=i) for i, s in enumerate(state.sessions)])["hard"] > 0


def test_overlap_adjacency_and_reservations():
    state = ready()
    a, b = state.sessions[:2]
    # Isolate room constraints from teacher and class constraints.
    b.teacher = "other"; b.offering = "other"
    state.sessions = [a, b]
    placements = [Placement(session=s.id, slot=0, room_id="R1") for s in state.sessions]
    assert any("Room overlap" in v for v in evaluate(state, placements)["violations"])
    state.reservations = [Reservation(id="B", room_id="R1", day=2, start=530, end=600, reason="Booked")]
    event = dict(day=2, start=420, end=530)
    assert not room_errors(state, a, state.rooms[0], event)
    event["end"] = 531
    assert "confirmed reservation" in room_errors(state, a, state.rooms[0], event)


def test_equipment_type_and_full_interval():
    state = ready()
    s = state.sessions[0]
    s.required_equipment = ["MICROSCOPE"]
    s.required_room_type = "LAB"
    errors = room_errors(state, s, state.rooms[0], dict(day=2, start=420, end=531))
    assert "equipment" in errors and "room type" in errors
    state.rooms[0].availability = [Slot(day=2, start=420, end=500)]
    assert "availability" in room_errors(state, s, state.rooms[0], dict(day=2, start=420, end=530))


def test_search_exhaustion_does_not_claim_infeasibility():
    state = ready()
    state.config.slots = state.config.slots[:1]
    with pytest.raises(SchedulingConflict) as exc:
        solve(state, iterations=5)
    assert exc.value.status == "SEARCH_EXHAUSTED"
    assert any("overlap" in v for v in exc.value.violations)


def test_tiny_exhaustive_oracle():
    state = ready()
    state.sessions = state.sessions[:2]
    state.config.slots = state.config.slots[:2]
    domains, errors = placement_domains(state)
    assert not errors
    feasible = [list(p) for p in product(*domains.values()) if evaluate(state, list(p))["hard"] == 0]
    assert feasible
    result, _ = solve(state, 100, 11)
    assert evaluate(state, result)["hard"] == 0
    assert [s.teacher for s in state.sessions] == ["t", "t"]


def test_api_rooms_rbac_revision_and_failure_rollback(api):
    client, p = api
    p.role = "TEACHER"; p.teacher = "t"
    for action in ("rooms", "reservation", "reservation-delete", "requirements", "published-room"):
        assert post(client, action).status_code == 403
    p.role = "STAFF"; p.teacher = None
    assert post(client, "rooms", {"rooms": []}).status_code == 200
    before = client.get("/api/workspace").json()
    response = post(client, "solve", revision=1)
    assert response.status_code == 409
    assert response.json()["status"] == "INFEASIBLE_INPUT"
    after = client.get("/api/workspace").json()
    assert after == before


def test_published_room_changes_protected(api):
    client, _ = api
    assert post(client, "solve", {"iterations": 100, "seed": 11}).status_code == 200
    assert post(client, "publish", revision=1).status_code == 200
    assert post(client, "rooms", {"rooms": []}, revision=2).status_code == 409
    state = client.get("/api/workspace").json()["state"]
    event = state["published"][0]
    booking = dict(id="B", room_id="R1", day=event["day"], start=event["start"], end=event["end"], reason="Other")
    assert post(client, "reservation", booking, revision=2).status_code == 409


def test_reservation_references_and_room_identity(api):
    client, _ = api
    assert post(client, "reservation", dict(id="B", room_id="unknown", day=2, start=420, end=500, reason="Booked")).status_code == 409
    room = client.get("/api/workspace").json()["state"]["rooms"][0]
    assert post(client, "rooms", {"rooms": [room, room]}).status_code == 422


def test_solver_reproducible_and_snapshot_room():
    state = ready()
    a, _ = solve(state, 100, 11)
    b, _ = solve(state, 100, 11)
    assert a == b
    state.draft = a
    publish(state)
    snapshot = deepcopy(state.published)
    state.rooms[0].name = "Renamed"
    state.draft[0].room_id = "Other"
    assert state.published == snapshot
    assert all(r["room_id"] == "R1" for r in snapshot)


def test_legacy_publication_requires_explicit_room_review():
    state = ready()
    state.draft, _ = solve(state, 100, 11)
    publish(state)
    for row in state.published:
        row.pop("room_id")
    with pytest.raises(SchedulingConflict) as exc:
        solve(state)
    assert exc.value.status == "ROOM_REVIEW_REQUIRED"


def test_soft_weights_cannot_override_hard_constraints():
    state = ready()
    state.config.soft_weights = {k: 0 for k in state.config.soft_weights}
    placements = [Placement(session=s.id,slot=0,room_id="R1") for s in state.sessions]
    report = evaluate(state, placements)
    assert report["hard"] > 0 and report["soft_total"] == 0
    with pytest.raises(ValueError, match="Soft weights"):
        Config(soft_weights={"restricted": -1})


def test_distinct_rooms_allow_concurrency_with_distinct_teachers():
    state = ready()
    a, b = state.sessions[:2]
    b.teacher = "other"; b.offering = "other"
    state.sessions = [a, b]
    state.rooms.append(state.rooms[0].model_copy(update={"id":"R2"}))
    placements = [Placement(session=a.id, slot=0, room_id="R1"), Placement(session=b.id, slot=0, room_id="R2")]
    assert evaluate(state, placements)["hard"] == 0


def test_specific_requirements_and_reservation_lifecycle(api):
    client, _ = api
    assert post(client, "requirements", {"session":"o-LEC-0","room":"COMPUTER","required_equipment":["SPECIAL"],"required_room_type":"LAB"}).status_code == 200
    response = post(client, "solve", revision=1)
    assert response.status_code == 409 and "equipment" in response.json()["detail"]
    booking = dict(id="B",room_id="R1",day=2,start=420,end=530,reason="Confirmed")
    assert post(client,"reservation",booking,revision=1).status_code == 200
    assert post(client,"reservation",booking,revision=2).status_code == 409
    assert post(client,"reservation-delete",{"id":"B"},revision=2).status_code == 200
    assert not client.get("/api/workspace").json()["state"]["reservations"]
