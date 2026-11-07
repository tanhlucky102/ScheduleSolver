import pytest
from app.domain import State, Department, Teacher, Offering, split
from app.main import apply
from app.auth import Principal

def test_catalog_crud_and_constraints():
    p = Principal(id="u1", role="STAFF", workspace_id="w1")
    offering = Offering(
        id="CS101-2026", course="CS101", name="CS 101", cohort="2026",
        department="KHMT", students=30, lecture_periods=2, tutorial_periods=0, room="PROJECTOR"
    )
    sessions = split(offering)
    state = State(
        departments=[Department(id="KHMT", name="Khoa học máy tính")],
        teachers=[Teacher(id="T1", name="Teacher 1", department="KHMT", capabilities={"CS101": ["LEC"]})],
        offerings=[offering],
        sessions=sessions
    )
    
    # 1. Add Department
    apply(state, "department-save", {"id": "CNPM", "name": "Công nghệ phần mềm"}, p)
    assert any(d.id == "CNPM" for d in state.departments)
    
    # 2. Edit Department
    apply(state, "department-save", {"id": "CNPM", "name": "Công nghệ phần mềm đổi tên"}, p)
    assert next(d.name for d in state.departments if d.id == "CNPM") == "Công nghệ phần mềm đổi tên"
    
    # 3. Delete Department with active teachers fails
    with pytest.raises(ValueError, match="vẫn còn giảng viên trực thuộc"):
        apply(state, "department-delete", {"id": "KHMT"}, p)
        
    # Delete teacher T1 first, then delete KHMT fails because sessions exist
    apply(state, "teacher-delete", {"id": "T1"}, p)
    with pytest.raises(ValueError, match="lớp học phần trực thuộc"):
        apply(state, "department-delete", {"id": "KHMT"}, p)
        
    # 4. Delete unused Department succeeds
    apply(state, "department-delete", {"id": "CNPM"}, p)
    assert not any(d.id == "CNPM" for d in state.departments)
    
    # 5. Add Teacher
    apply(state, "teacher-save", {"id": "T2", "name": "Teacher 2", "department": "KHMT"}, p)
    assert any(t.id == "T2" for t in state.teachers)
    
    # 6. Assign T2 to session and verify delete Teacher fails
    state.sessions[0].teacher = "T2"
    with pytest.raises(ValueError, match="phân công giảng dạy"):
        apply(state, "teacher-delete", {"id": "T2"}, p)
        
    # Unassign and delete succeeds
    state.sessions[0].teacher = None
    apply(state, "teacher-delete", {"id": "T2"}, p)
    assert not any(t.id == "T2" for t in state.teachers)
        
    # 7. Room presets from resources/so_phong.csv (25 rooms)
    apply(state, "rooms-preset", {}, p)
    assert len(state.rooms) == 25
    assert any(r.id == "801C" and "PROJECTOR" in r.equipment for r in state.rooms)
    assert any(r.id == "206A1" and "COMPUTER" in r.equipment and "PROJECTOR" in r.equipment for r in state.rooms)
    assert any(r.id == "402C" and "COMPUTER" in r.equipment for r in state.rooms)

    # 8. Test concurrent send-all
    assert state.departments[0].status == "UNSENT"
    apply(state, "send-all", {}, p)
    assert state.departments[0].status == "SENT"

    # 9. Test plan-reset
    assert len(state.sessions) > 0
    apply(state, "plan-reset", {}, p)
    assert len(state.sessions) == 0
    assert len(state.offerings) == 0
    assert state.departments[0].status == "UNSENT"
