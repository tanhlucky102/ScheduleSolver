from copy import deepcopy
import pytest
from app.domain import *


def ready(students=60):
    o = Offering(id="o", course="CS", name="Course", cohort="K1", department="D",
                 students=students, lecture_periods=2, tutorial_periods=1, room="PROJECTOR")
    t = Teacher(id="t", name="Teacher", department="D", capabilities={"CS":["LEC","TUT"]})
    slots = [Slot(day=day, start=start, end=start+180) for day in range(2,8) for start in (420,780)]
    state = State(departments=[Department(id="D", name="Department",status="SUBMITTED")],
                  teachers=[t], offerings=[o], sessions=split(o), config=Config(slots=slots))
    state.rooms = [Room(id="R1", name="Room 1", capacity=200, room_type="CLASSROOM", equipment=["PROJECTOR", "COMPUTER"], availability=slots)]
    for s in state.sessions:
        s.teacher = "t"
    return state


def test_split_boundary_and_conservation():
    state=ready(401)
    sessions=state.sessions
    assert len([s for s in sessions if s.kind=="LEC"])==3
    assert max(s.students for s in sessions if s.kind=="LEC")<=200
    assert sum(s.students for s in sessions if s.kind=="LEC")==401
    assert sum(s.students for s in sessions if s.kind=="TUT")==401
    assert max(s.students for s in sessions if s.kind=="TUT")<=30


def test_four_period_combined():
    o=ready().offerings[0].model_copy(update={"lecture_periods":2,"tutorial_periods":2})
    assert all(s.kind=="COMBINED" and s.periods==4 for s in split(o))


def test_assistant_and_subject():
    state=ready()
    t=state.teachers[0]
    t.assistant=True
    assert not eligible(next(s for s in state.sessions if s.kind=="LEC"),t)
    assert eligible(next(s for s in state.sessions if s.kind=="TUT"),t)
    t.capabilities={}
    assert assignment_errors(state)


def test_all_departments_required():
    state=ready()
    state.departments.append(Department(id="E",name="Empty department"))
    with pytest.raises(ValueError,match="All departments"):
        require_ready(state)


def test_overlap_and_missing_hard():
    state=ready()
    result=evaluate(state,[Placement(session=s.id,slot=0) for s in state.sessions])
    assert result["hard"]>0
    assert any("Lec/Tut" in v for v in result["violations"])
    assert evaluate(state,[])["hard"]==len(state.sessions)


def test_legacy_counts_do_not_override_declared_rooms():
    state=ready()
    # Distinct teacher and unrelated offerings to isolate soft resource overflow.
    a=state.sessions[0]
    b=a.model_copy(update={"id":"other","offering":"different","teacher":"other"})
    state.sessions=[a,b]
    state.config.rooms={"PROJECTOR":0,"COMPUTER":0}
    state.config.max_periods=1
    report=evaluate(state,[Placement(session=a.id,slot=0,room_id="R1"),Placement(session=b.id,slot=1,room_id="R1")])
    assert report["hard"]==0
    assert "room_overflow_minutes" not in report["soft"]
    assert report["soft"]["overload"]>0


def test_solver_preserves_assignments_and_snapshot():
    state=ready()
    teachers=[s.teacher for s in state.sessions]
    state.draft,runs=solve(state,iterations=100,seed=11)
    assert {r["algorithm"] for r in runs}=={"HC","SA","TABU"}
    assert [s.teacher for s in state.sessions]==teachers
    assert evaluate(state,state.draft)["hard"]==0
    publish(state)
    published=deepcopy(state.published)
    state.draft[0].slot=7
    state.sessions[0].teacher="new"
    assert state.published==published


def test_publish_rechecks_instead_of_trusting_client():
    state=ready()
    state.draft=[Placement(session=s.id,slot=0) for s in state.sessions]
    with pytest.raises(ValueError,match="zero hard"):
        publish(state)


def test_external_actual_minutes_half_open():
    state=ready()
    state.draft=[Placement(session=s.id,slot=i,room_id="R1") for i,s in enumerate(state.sessions)]
    publish(state)
    event=state.published[0]
    def external(start,end):
        return External(id=str(start),teacher="t",day=event["day"],start=start,end=end,institution="School",course="Math",class_name="A")
    with pytest.raises(ValueError,match="conflicts"):
        add_external(state,external(event["start"]+1,event["end"]-1))
    add_external(state,external(event["end"],event["end"]+30))
    assert len(state.external)==1


def test_bad_references_and_duplicate_ids():
    state=ready().model_dump()
    state["teachers"].append(state["teachers"][0])
    with pytest.raises(ValueError,match="Duplicate"):
        State.model_validate(state)
