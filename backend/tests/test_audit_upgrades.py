"""Comprehensive audit & architecture upgrade tests."""
import csv
import io
import json
from pathlib import Path
from app import main as main_module
from app.domain import Config, Offering, Room
import provision_demo
from test_api import api, post

ROOT = Path(__file__).resolve().parents[2]


def test_1_capabilities_preset_removed(api):
    client, p = api
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "capabilities-preset", {}, revision=rev).status_code in (403, 404)

    p.role = "HEAD"
    p.department = "D"
    p.teacher = "t"
    assert post(client, "capabilities-preset", {}, revision=rev).status_code in (403, 404)

    p.role = "TEACHER"
    p.department = None
    p.teacher = "t"
    assert post(client, "capabilities-preset", {}, revision=rev).status_code in (403, 404)


def test_2_staff_rbac_zero_auto_seed_and_active_toggle(api):
    client, p = api
    p.role = "STAFF"
    p.department = None
    p.teacher = None

    # Default demo_state has zero capabilities
    demo = provision_demo.demo_state(seed_capabilities=False)
    assert all(t.capabilities == {} for t in demo.teachers)

    # 1. STAFF creates a new teacher using an ID present in catalog_seed.json ("KhoaTN")
    #    AND attempts to inject capabilities in payload -> capabilities MUST stay {}!
    rev = client.get("/api/workspace").json()["revision"]
    res_new = post(
        client,
        "teacher-save",
        {
            "id": "KhoaTN",
            "name": "Trần Như Khoa",
            "department": "D",
            "assistant": False,
            "active": True,
            "capabilities": {"CS": ["LEC", "TUT"], "HACK": ["LEC"]},
        },
        revision=rev,
    )
    assert res_new.status_code == 200
    ws = client.get("/api/workspace").json()
    khoa = next(t for t in ws["state"]["teachers"] if t["id"] == "KhoaTN")
    assert khoa["capabilities"] == {}

    # 2. STAFF updates existing teacher "t" (which had {"CS": ["LEC", "TUT"]}) trying to overwrite capabilities -> preserved!
    rev = ws["revision"]
    assert post(
        client,
        "teacher-save",
        {
            "id": "t",
            "name": "Teacher Renamed",
            "department": "D",
            "assistant": False,
            "active": True,
            "capabilities": {"INJECTED": ["LEC"]},
        },
        revision=rev,
    ).status_code == 200
    ws = client.get("/api/workspace").json()
    t_obj = next(t for t in ws["state"]["teachers"] if t["id"] == "t")
    assert t_obj["capabilities"] == {"CS": ["LEC", "TUT"]}

    # 3. STAFF toggles active=False on teacher "t" currently assigned to sessions -> returns warning_assigned_sessions
    rev = ws["revision"]
    res_inact = post(
        client,
        "teacher-save",
        {"id": "t", "name": "Teacher Renamed", "department": "D", "assistant": False, "active": False},
        revision=rev,
    )
    assert res_inact.status_code == 200
    assert res_inact.json()["warning_assigned_sessions"] == len(ws["state"]["sessions"])
    ws = client.get("/api/workspace").json()
    assert next(t for t in ws["state"]["teachers"] if t["id"] == "t")["active"] is False

    # Toggle back active=True
    rev = ws["revision"]
    res_act = post(
        client,
        "teacher-save",
        {"id": "t", "name": "Teacher Renamed", "department": "D", "assistant": False, "active": True},
        revision=rev,
    )
    assert res_act.status_code == 200
    assert "warning_assigned_sessions" not in res_act.json()

    # 4. STAFF flips assistant=True on existing teacher -> strips "LEC" from existing capabilities
    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "teacher-save",
        {"id": "t", "name": "Teacher Renamed", "department": "D", "assistant": True, "active": True},
        revision=rev,
    ).status_code == 200
    ws = client.get("/api/workspace").json()
    assert next(t for t in ws["state"]["teachers"] if t["id"] == "t")["capabilities"] == {"CS": ["TUT"]}

    # 5. STAFF calls "catalog" trying to inject capabilities on new teacher & overwrite existing -> ignored!
    rev = ws["revision"]
    assert post(
        client,
        "catalog",
        {
            "departments": ws["state"]["departments"],
            "teachers": [
                {
                    "id": "t",
                    "name": "Teacher Renamed",
                    "department": "D",
                    "assistant": True,
                    "active": True,
                    "capabilities": {"CS": ["LEC", "TUT"], "FAKE": ["LEC"]},
                },
                {
                    "id": "QuyenNV",
                    "name": "Nguyễn Văn Quyền",
                    "department": "D",
                    "assistant": False,
                    "active": True,
                    "capabilities": {"CS": ["LEC"]},
                },
            ],
        },
        revision=rev,
    ).status_code == 200
    ws_after_cat = client.get("/api/workspace").json()
    assert next(t for t in ws_after_cat["state"]["teachers"] if t["id"] == "t")["capabilities"] == {"CS": ["TUT"]}
    assert next(t for t in ws_after_cat["state"]["teachers"] if t["id"] == "QuyenNV")["capabilities"] == {}


def test_3_head_capabilities_import_real_csv_scoping_and_assistants(api):
    client, p = api
    p.role = "STAFF"
    p.department = None
    p.teacher = None

    # Reset plan and load the 4 real HANU departments + 35 teachers (with zero capabilities)
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "plan-reset", {}, revision=rev).status_code == 200

    seed_data = json.loads((ROOT / "data/fall2026/catalog_seed.json").read_text(encoding="utf-8"))
    # Mark one KHMT teacher as assistant=True to verify LEC stripping on import
    khmt_teachers = [t for t in seed_data["teachers"] if t["department"] == "KHMT"]
    assert len(khmt_teachers) >= 2
    assistant_id = khmt_teachers[-1]["id"]
    head_khmt_id = khmt_teachers[0]["id"]
    for t in seed_data["teachers"]:
        if t["id"] == assistant_id:
            t["assistant"] = True

    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "catalog",
        {"departments": seed_data["departments"], "teachers": seed_data["teachers"]},
        revision=rev,
    ).status_code == 200

    ws0 = client.get("/api/workspace").json()
    assert all(t["capabilities"] == {} for t in ws0["state"]["teachers"])

    csv_text = (ROOT / "resources/nang_luc_giang_vien.csv").read_text(encoding="utf-8")

    # STAFF and TEACHER calling capabilities-import must get 403
    rev = ws0["revision"]
    assert post(client, "capabilities-import", {"csv_text": csv_text}, revision=rev).status_code == 403

    p.role = "TEACHER"
    p.teacher = head_khmt_id
    assert post(client, "capabilities-import", {"csv_text": csv_text}, revision=rev).status_code == 403

    # HEAD of KHMT imports unified CSV -> ONLY KHMT teachers updated, other departments skipped!
    p.role = "HEAD"
    p.department = "KHMT"
    p.teacher = head_khmt_id
    imp_res = post(client, "capabilities-import", {"csv_text": csv_text, "mode": "merge"}, revision=rev)
    assert imp_res.status_code == 200
    summary = imp_res.json()
    assert summary["imported_rows"] > 0
    assert summary["updated_teachers"] > 0
    assert summary["skipped_other_departments"] > 0

    # Also test assistant LEC stripping explicitly if assistant had LEC in CSV or via custom row
    rev = client.get("/api/workspace").json()["revision"]
    asst_res = post(
        client,
        "capabilities-import",
        {
            "csv_text": f"ma_gv,bo_mon,ma_mon,ten_mon,day_lec,day_tut\n{assistant_id},KHMT,66FIT3AI1,AI,1,1\n",
            "mode": "merge",
        },
        revision=rev,
    )
    assert asst_res.status_code == 200
    assert any(assistant_id in w for w in asst_res.json()["warnings"])

    # Verify via STAFF view: non-KHMT teachers STILL have {} capabilities, assistant has NO "LEC"
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    ws_check = client.get("/api/workspace").json()
    for t in ws_check["state"]["teachers"]:
        if t["department"] != "KHMT":
            assert t["capabilities"] == {}, f"Other department {t['department']} teacher {t['id']} was modified!"
        if t["id"] == assistant_id:
            for kinds in t["capabilities"].values():
                assert "LEC" not in kinds
            assert "TUT" in t["capabilities"]["66FIT3AI1"]

    # Test mode="replace" with rows payload
    p.role = "HEAD"
    p.department = "KHMT"
    p.teacher = head_khmt_id
    rev = ws_check["revision"]
    rep_res = post(
        client,
        "capabilities-import",
        {
            "rows": [{"teacher": head_khmt_id, "course": "66FIT3AI1", "lec": "1", "tut": "0"}],
            "mode": "replace",
        },
        revision=rev,
    )
    assert rep_res.status_code == 200
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    ws_rep = client.get("/api/workspace").json()
    assert next(t for t in ws_rep["state"]["teachers"] if t["id"] == head_khmt_id)["capabilities"] == {"66FIT3AI1": ["LEC"]}
    assert next(t for t in ws_rep["state"]["teachers"] if t["id"] == assistant_id)["capabilities"] == {}

    # Also verify SUBMITTED department blocks capabilities-import with 409
    rev = ws_rep["revision"]
    assert post(
        client,
        "offerings",
        {
            "offerings": [
                {
                    "id": "66FIT3AI1-2024",
                    "course": "66FIT3AI1",
                    "name": "Trí tuệ nhân tạo",
                    "cohort": "2024",
                    "department": "KHMT",
                    "students": 40,
                    "lecture_periods": 2.5,
                    "tutorial_periods": 0.0,
                    "room": "PROJECTOR",
                    "program": "TT",
                }
            ]
        },
        revision=rev,
    ).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "send", {"department": "KHMT"}, revision=rev).status_code == 200
    p.role = "HEAD"
    p.department = "KHMT"
    p.teacher = head_khmt_id
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "balance", {"department": "KHMT"}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "submit", {"department": "KHMT"}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "capabilities-import", {"csv_text": csv_text}, revision=rev).status_code == 409


def test_4_csv_templates_clean_and_valid(api):
    client, _ = api

    # 1. GET /api/templates/teachers has NO capabilities column and matches static file
    r_teachers = client.get("/api/templates/teachers")
    assert r_teachers.status_code == 200
    assert r_teachers.content.startswith(b"\xef\xbb\xbf")
    teachers_text = r_teachers.content.decode("utf-8-sig")
    t_rows = list(csv.reader(io.StringIO(teachers_text)))
    assert t_rows[0] == ["ma_gv", "ho_ten", "bo_mon", "vai_tro", "trang_thai"]
    assert "capabilities" not in teachers_text.lower()
    static_teachers = (ROOT / "frontend/public/templates/nhan-su-mau.csv").read_bytes()
    assert static_teachers.startswith(b"\xef\xbb\xbf")
    assert list(csv.reader(io.StringIO(static_teachers.decode("utf-8-sig"))))[0] == [
        "ma_gv", "ho_ten", "bo_mon", "vai_tro", "trang_thai"
    ]

    # 2. GET /api/templates/capabilities returns valid CSV and matches static file
    r_caps = client.get("/api/templates/capabilities")
    assert r_caps.status_code == 200
    assert r_caps.content.startswith(b"\xef\xbb\xbf")
    caps_text = r_caps.content.decode("utf-8-sig")
    c_rows = list(csv.reader(io.StringIO(caps_text)))
    assert c_rows[0] == ["ma_gv", "bo_mon", "ma_mon", "ten_mon", "day_lec", "day_tut"]
    assert len(c_rows) >= 2
    static_caps = (ROOT / "frontend/public/templates/nang-luc-bo-mon-mau.csv").read_bytes()
    assert static_caps.startswith(b"\xef\xbb\xbf")
    assert list(csv.reader(io.StringIO(static_caps.decode("utf-8-sig"))))[0] == [
        "ma_gv", "bo_mon", "ma_mon", "ten_mon", "day_lec", "day_tut"
    ]


def test_5_notifications_newest_first_visibility_and_external_privacy(api, monkeypatch):
    client, p = api
    broadcasts = []

    async def capture_broadcast(workspace_id, message):
        broadcasts.append(message)

    monkeypatch.setattr(main_module.hub, "broadcast", capture_broadcast)

    # Add a second department & teacher to verify cross-department and cross-teacher isolation
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "department-save", {"id": "KHMT", "name": "Khoa học máy tính"}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "teacher-save", {"id": "t2", "name": "GV 2", "department": "KHMT", "assistant": False, "active": True}, revision=rev).status_code == 200

    # Return department D -> creates warning notification scoped to D
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "return", {"department": "D", "note": "Cần rà soát"}, revision=rev).status_code == 200
    assert broadcasts[-1]["type"] == "workspace:updated"
    assert "notification" in broadcasts[-1]
    assert broadcasts[-1]["notification"]["department"] == "D"

    # Teacher "t" adds a private external busy block with sensitive institution/course/note
    p.role = "TEACHER"
    p.department = None
    p.teacher = "t"
    rev = client.get("/api/workspace").json()["revision"]
    secret_note = "Khám bệnh cá nhân tuyệt mật tại BV"
    secret_inst = "Tập đoàn Bí Mật XYZ"
    secret_course = "Dự án Riêng 999"
    assert post(
        client,
        "external",
        {
            "institution": secret_inst,
            "course": secret_course,
            "class_name": "VIP-1",
            "room": "P999",
            "day": 8,
            "start": 1100,
            "end": 1200,
            "activity_type": "PERSONAL_BUSY",
            "note": secret_note,
        },
        revision=rev,
    ).status_code == 200

    # Check TEACHER "t" view: newest-first, period_config has new shift fields, notifications not inside state
    ws_t = client.get("/api/workspace").json()
    assert "notifications" not in ws_t["state"]
    assert ws_t["period_config"]["afternoon_start"] == 740
    assert ws_t["period_config"]["evening_start"] == 1030
    assert ws_t["period_config"]["inter_shift_gap"] == 15
    assert ws_t["notifications"][0]["action"] == "external"
    # Even in the notification summary itself, private details are never included
    serialized_t = json.dumps(ws_t["notifications"], ensure_ascii=False)
    for secret in (secret_note, secret_inst, secret_course, "VIP-1", "P999"):
        assert secret not in serialized_t

    # Check OTHER TEACHER "t2" view: must NOT see teacher "t"'s external notification or department D's return
    p.role = "TEACHER"
    p.teacher = "t2"
    ws_t2 = client.get("/api/workspace").json()
    assert all(n["teacher"] != "t" for n in ws_t2["notifications"] if n["action"] == "external")
    assert all(n["action"] != "return" for n in ws_t2["notifications"])

    # Check HEAD of KHMT ("t2") view: must NOT see department D's return or teacher "t"'s external notification
    p.role = "HEAD"
    p.department = "KHMT"
    p.teacher = "t2"
    ws_head_khmt = client.get("/api/workspace").json()
    assert "notifications" not in ws_head_khmt["state"]
    assert "shift_rules" in ws_head_khmt
    assert ws_head_khmt["period_config"]["afternoon_start"] == 740
    assert all(n.get("department") != "D" for n in ws_head_khmt["notifications"])
    assert all(n["action"] != "external" for n in ws_head_khmt["notifications"])

    # Check STAFF view: newest-first, sees external summary without ANY private notes/institution/course
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    ws_staff = client.get("/api/workspace").json()
    assert "notifications" not in ws_staff["state"]
    staff_notifs = ws_staff["notifications"]
    assert len(staff_notifs) >= 4
    revisions = [n["revision"] for n in staff_notifs]
    assert revisions == sorted(revisions, reverse=True)
    assert staff_notifs[0]["summary"] == "Giảng viên t đã cập nhật khung giờ bận ngoài khoa."
    serialized_staff = json.dumps(ws_staff, ensure_ascii=False)
    for secret in (secret_note, secret_inst, secret_course, "VIP-1", "P999"):
        assert secret not in serialized_staff
    for bc in broadcasts:
        bc_str = json.dumps(bc, ensure_ascii=False)
        for secret in (secret_note, secret_inst, secret_course, "VIP-1", "P999"):
            assert secret not in bc_str


def test_6_publish_populates_course_name_and_study_dates_plus_mme_models(api):
    # Verify MME program support on Offering & Room and new Config fields
    cfg = Config(afternoon_start=750, evening_start=1050, inter_shift_gap=20)
    assert cfg.afternoon_start == 750 and cfg.evening_start == 1050 and cfg.inter_shift_gap == 20
    mme_off = Offering(
        id="61MME2GD1-2025",
        course="61MME2GD1",
        name="Thiết kế đồ họa đa phương tiện",
        cohort="2025",
        department="TTDPT",
        students=60,
        lecture_periods=2,
        tutorial_periods=2,
        room="COMPUTER",
        program="MME",
    )
    mme_room = Room(id="402C", name="Phòng 402C", capacity=60, room_type="COMPUTER", allowed_programs=["MME", "STANDARD"])
    assert mme_off.program == "MME" and "MME" in mme_room.allowed_programs

    # Verify publish populates course_name, start_date, end_date (falling back to term dates when offering dates omitted)
    client, p = api
    p.role = "STAFF"
    p.department = None
    p.teacher = None

    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "solve", {"iterations": 100, "seed": 11}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "publish", {}, revision=rev).status_code == 200

    ws = client.get("/api/workspace").json()
    published = ws["state"]["published"]
    assert len(published) > 0
    for ev in published:
        assert ev["course_name"] == "Course"
        assert ev["start_date"] == ws["state"]["config"]["term_start_date"]
        assert ev["end_date"] == ws["state"]["config"]["term_end_date"]
