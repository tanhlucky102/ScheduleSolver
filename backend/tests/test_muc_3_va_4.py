from io import BytesIO
from openpyxl import Workbook, load_workbook
from app.domain import (
    Config,
    Department,
    External,
    Offering,
    Placement,
    Room,
    ShiftRule,
    Slot,
    State,
    Teacher,
    duration,
    eligible,
    evaluate,
    publish,
    solve,
    split,
)
from app.exporter import workbook
from test_api import api, post


def test_muc3_hanu_2_5_periods_and_break_checkbox():
    """Verify Ca = #tiết * phút mỗi tiết + giải lao (checkbox) for HANU 2.5 periods."""
    offering = Offering(
        id="61FIT3SS1-61",
        course="61FIT3SS1",
        name="Phát triển PM nguồn mở",
        cohort="61",
        department="CNPM",
        students=60,
        lecture_periods=2.5,
        tutorial_periods=2.5,
        room="PROJECTOR",
        lecture_room="PROJECTOR",
        tutorial_room="COMPUTER",
    )
    sessions = split(offering)
    assert all(s.periods == 2.5 for s in sessions)

    # 1. Checkbox unchecked (include_break=False): 2.5 * 50 + 0 = 125 mins (07:10 -> 09:15)
    cfg_no_break = Config(
        period_minutes=50,
        break_minutes=10,
        include_break=False,
        first_period_start=430,
        active_days=[2, 3, 4, 5, 6, 7],
        shift_rules=[
            ShiftRule(id="M1", label="Ca 1", start=430, periods=2.5, include_break=False, end=555),
            ShiftRule(id="M2", label="Ca 2", start=570, periods=2.5, include_break=False, end=695),
        ],
        slots=[
            Slot(day=d, start=st, end=en)
            for d in range(2, 8)
            for st, en in ((430, 555), (570, 695))
        ],
    )
    assert duration(sessions[0], cfg_no_break) == 125
    assert 430 + duration(sessions[0], cfg_no_break) == 555  # 07:10 -> 09:15 exact

    # 2. Checkbox checked (include_break=True): 2.5 * 50 + 10 = 135 mins
    cfg_with_break = cfg_no_break.model_copy(update={"include_break": True})
    assert duration(sessions[0], cfg_with_break) == 135


def test_muc4_1_personnel_active_online_and_cross_dept_visibility(api):
    """Verify Nhân Sự active status, online tracking, and HEAD editing competency matrix anytime."""
    client, p = api
    # Staff adds a second department & cross-department teacher
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "department-save", {"id": "CNPM", "name": "Công nghệ phần mềm"}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "teacher-save",
        {"id": "t_cross", "name": "GV Liên Bộ Môn", "department": "CNPM", "assistant": False, "active": True, "capabilities": {"CS": ["LEC", "TUT"]}},
        revision=rev,
    ).status_code == 200

    # Switch to HEAD of department D (which is currently SUBMITTED, not SENT!)
    p.role = "HEAD"
    p.department = "D"
    p.teacher = "t"
    ws_head = client.get("/api/workspace").json()
    assert "t" in ws_head["online_teachers"]
    # HEAD of D can see cross-department teacher t_cross because t_cross can teach CS
    visible_ids = {t["id"] for t in ws_head["state"]["teachers"]}
    assert {"t", "t_cross"}.issubset(visible_ids)

    # HEAD can update t_cross capabilities / active status even when department D is SUBMITTED (as long as assigned classes stay valid)
    rev = ws_head["revision"]
    res = post(
        client,
        "teacher",
        {"department": "D", "teacher": "t_cross", "assistant": False, "active": False, "capabilities": {"CS": ["TUT"]}},
        revision=rev,
    )
    assert res.status_code == 200

    # Inactive teacher is no longer eligible
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    ws_staff = client.get("/api/workspace").json()
    t_cross_obj = Teacher.model_validate(next(t for t in ws_staff["state"]["teachers"] if t["id"] == "t_cross"))
    sample_session = State.model_validate(dict(ws_staff["state"], external=[])).sessions[0]
    assert not eligible(sample_session, t_cross_obj)


def test_muc4_3_templates_and_pre_publish_external_study_import(api):
    """Verify sample templates download, pre-publication external/study import, PTIT Excel parsing, and solver avoiding external conflicts."""
    client, p = api

    # 1. Sample template endpoints work
    for kind in ("plan", "external", "teachers", "rooms"):
        r = client.get(f"/api/templates/{kind}")
        assert r.status_code == 200
        assert len(r.content) > 40

    # 2. Plan template round-trip into /api/import/preview succeeds (including 2.5 periods!)
    plan_bytes = client.get("/api/templates/plan").content
    prev_plan = client.post("/api/import/preview", files={"file": ("Mau_Ke_Hoach.xlsx", plan_bytes)})
    assert prev_plan.status_code == 200
    assert prev_plan.json()["can_import"] is True
    assert any(o["lecture_periods"] == 2.5 for o in prev_plan.json()["offerings"])

    # 3. Teacher imports external teaching + studying schedule BEFORE faculty publication!
    p.role = "TEACHER"
    p.teacher = "t"
    ext_bytes = client.get("/api/templates/external").content
    prev_ext = client.post("/api/import/external-preview", files={"file": ("Mau_Lich_Ngoai.xlsx", ext_bytes)})
    assert prev_ext.status_code == 200
    ext_data = prev_ext.json()
    assert ext_data["can_import"] is True
    assert len(ext_data["items"]) == 3

    rev = client.get("/api/workspace").json()["revision"]
    imp_res = post(client, "external-import", {"items": ext_data["items"]}, revision=rev)
    assert imp_res.status_code == 200
    ws_teacher = client.get("/api/workspace").json()
    assert set(ws_teacher["state"]) == {"published", "external"}
    assert len(ws_teacher["state"]["external"]) == 3

    # 4. Also verify PTIT-style multi-date Excel deduplication (Tiết bắt đầu + Số tiết)
    ptit_wb = Workbook()
    ws = ptit_wb.active
    ws.append(["Mã môn học", "Tên môn học", "Nhóm", "Thứ", "Ngày", "Tiết bắt đầu (*)", "Số tiết", "Tài khoản"])
    ws.append(["INT1306", "Cấu trúc dữ liệu", "02", 6, "20/08/26", 13, 3, "gv@ptit.edu.vn"])
    ws.append(["INT1306", "Cấu trúc dữ liệu", "02", 6, "27/08/26", 13, 3, "gv@ptit.edu.vn"])
    buf = BytesIO()
    ptit_wb.save(buf)
    ptit_prev = client.post("/api/import/external-preview", files={"file": ("ptit.xlsx", buf.getvalue())})
    assert ptit_prev.status_code == 200
    assert ptit_prev.json()["can_import"] is True
    assert len(ptit_prev.json()["items"]) == 1
    assert ptit_prev.json()["items"][0]["institution"] == "PTIT"

    # 5. Staff solves -> solver automatically avoids teacher's external/study slots!
    p.role = "STAFF"
    p.teacher = None
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "solve", {"iterations": 120, "seed": 11}, revision=rev).status_code == 200
    ws_after_solve = client.get("/api/workspace").json()
    assert ws_after_solve["evaluation"]["hard"] == 0


def test_muc4_4_color_palette_notes_and_tt_excel_export(api):
    """Verify TT (Tiên tiến / 66FIT) distinct color, custom color rules + notes, and Excel export."""
    client, p = api
    p.role = "TEACHER"
    p.teacher = "t"
    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "color-rules",
        {
            "rule": {
                "id": "prog-tt",
                "category": "PROGRAM",
                "key": "TT",
                "label": "Hệ Tiên tiến TT",
                "bg_color": "#A7F3D0",
                "border_color": "#34D399",
                "text_color": "#064E3B",
                "note": "Ghi chú riêng hệ Tiên tiến",
            }
        },
        revision=rev,
    ).status_code == 200
    ws_t1 = client.get("/api/workspace").json()
    assert len(ws_t1["color_rules"]) == 1
    assert ws_t1["color_rules"][0]["label"] == "Hệ Tiên tiến TT"

    # Global staff config.color_rules remains untouched by teacher t's personal color palette
    p.role = "STAFF"
    p.teacher = None
    ws_staff = client.get("/api/workspace").json()
    assert ws_staff["state"]["config"]["color_rules"] == []

    # Verify TT export styling directly on domain state
    o_tt = Offering(
        id="66FIT3AI1-66",
        course="66FIT3AI1",
        name="AI Tiên tiến",
        cohort="66",
        department="D",
        students=50,
        lecture_periods=2.5,
        tutorial_periods=0,
        room="PROJECTOR",
        program="TT",
    )
    t = Teacher(id="t", name="Teacher", department="D", capabilities={"66FIT3AI1": ["LEC"]})
    slots = [Slot(day=2, start=430, end=555)]
    st = State(
        departments=[Department(id="D", name="Dept", status="SUBMITTED")],
        teachers=[t],
        offerings=[o_tt],
        sessions=split(o_tt),
        config=Config(
            include_break=False,
            slots=slots,
            color_rules=[
                {
                    "id": "prog-tt",
                    "category": "PROGRAM",
                    "key": "TT",
                    "label": "Hệ Tiên tiến",
                    "bg_color": "#A7F3D0",
                    "border_color": "#34D399",
                    "text_color": "#064E3B",
                    "note": "Note TT tùy chỉnh",
                }
            ],
        ),
        rooms=[Room(id="801C", name="801C", capacity=100, room_type="PROJECTOR", equipment=["PROJECTOR"], availability=slots)],
    )
    st.sessions[0].teacher = "t"
    st.draft, _ = solve(st, 50, 7)
    publish(st)
    xlsx_bytes = workbook(st, "published")
    wb = load_workbook(BytesIO(xlsx_bytes))
    assert wb.sheetnames == ["Danh sách lớp", "IT + MME", "IT CLC + TT", "Đánh giá"]
    assert wb["Danh sách lớp"].cell(2, 14).value == "TT"
    assert "Note TT tùy chỉnh" in (wb["Danh sách lớp"].cell(2, 15).value or "")
    assert "A7F3D0" in (wb["IT CLC + TT"].cell(3, 3).fill.fgColor.rgb or "")


def test_muc3_4_end_to_end_hanu_6_shifts_full_workflow(api):
    """End-to-end verification of Section 3 + Section 4 full workflow (HANU 6 shifts, 2.5 periods, COMBINED, Nhân Sự, External/Study import, Export)."""
    from datetime import time as dtime

    client, p = api
    p.role = "STAFF"
    p.department = None
    p.teacher = None

    # 1. Configure HANU 6 shifts (Tiết 3–14, matching real Edusoft HANU timetable)
    hanu_shifts = [
        {"id": "M1", "label": "Ca 1 (Sáng)", "periods_label": "Tiết 3 – 4", "start": 430, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 555, "evening": False},
        {"id": "M2", "label": "Ca 2 (Sáng)", "periods_label": "Tiết 5 – 6", "start": 570, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 695, "evening": False},
        {"id": "A1", "label": "Ca 3 (Chiều)", "periods_label": "Tiết 7 – 8", "start": 740, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 865, "evening": False},
        {"id": "A2", "label": "Ca 4 (Chiều)", "periods_label": "Tiết 9 – 10", "start": 880, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 1005, "evening": False},
        {"id": "E1", "label": "Ca 5 (Tối)", "periods_label": "Tiết 11 – 12", "start": 1030, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 1155, "evening": True},
        {"id": "E2", "label": "Ca 6 (Tối)", "periods_label": "Tiết 13 – 14", "start": 1170, "periods": 2.5, "include_break": False, "break_minutes": 0, "end": 1295, "evening": True},
    ]
    hanu_slots = [
        {"day": d, "start": st, "end": en, "evening": ev}
        for d in range(2, 8)
        for st, en, ev in (
            (430, 695, False),
            (570, 695, False),
            (740, 1005, False),
            (880, 1005, False),
            (1030, 1295, True),
            (1170, 1295, True),
        )
    ]
    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "config",
        {
            "period_minutes": 50,
            "break_minutes": 10,
            "include_break": False,
            "first_period_start": 430,
            "active_days": [2, 3, 4, 5, 6, 7],
            "shift_rules": hanu_shifts,
            "max_periods": 8,
            "rooms": {"PROJECTOR": 15, "COMPUTER": 10},
            "slots": hanu_slots,
        },
        revision=rev,
    ).status_code == 200

    # 2. Load 25 real HANU rooms (availability up to 21:00 = 1260)
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "rooms-preset", {}, revision=rev).status_code == 200

    # 3. Reset old fixture plan, set up departments + Nhân Sự, and import sample HANU training plan
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "plan-reset", {}, revision=rev).status_code == 200

    plan_xlsx = client.get("/api/templates/plan").content
    preview = client.post("/api/import/preview", files={"file": ("Mau_Ke_Hoach_Dao_Tao_HANU.xlsx", plan_xlsx)}).json()
    assert preview["can_import"] is True
    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "catalog",
        {
            "departments": [
                {"id": "CNPM", "name": "Công nghệ phần mềm", "status": "UNSENT"},
                {"id": "HTTT", "name": "Hệ thống thông tin", "status": "UNSENT"},
                {"id": "KHMT", "name": "Khoa học máy tính", "status": "UNSENT"},
                {"id": "TTDPT", "name": "Truyền thông ĐPT", "status": "UNSENT"},
            ],
            "teachers": [
                {"id": "gv_cnpm", "name": "GV CNPM", "department": "CNPM", "assistant": False, "active": True, "capabilities": {"61FIT3SS1": ["LEC", "TUT"]}},
                {"id": "gv_nghi", "name": "GV Tạm Nghỉ", "department": "CNPM", "assistant": False, "active": False, "capabilities": {"61FIT3SS1": ["LEC", "TUT"]}},
                {"id": "gv_httt", "name": "GV HTTT", "department": "HTTT", "assistant": False, "active": True, "capabilities": {"61FIT3OS1CLC": ["LEC", "TUT"]}},
                {"id": "gv_khmt", "name": "GV KHMT", "department": "KHMT", "assistant": False, "active": True, "capabilities": {"66FIT3AI1": ["LEC", "TUT"]}},
                {"id": "gv_mme", "name": "GV MME", "department": "TTDPT", "assistant": False, "active": True, "capabilities": {"61MME2GD1": ["LEC", "TUT"]}},
            ],
        },
        revision=rev,
    ).status_code == 200

    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "offerings", {"offerings": preview["offerings"]}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "send-all", {}, revision=rev).status_code == 200

    # 4. Teacher gv_cnpm imports Excel schedule with native Excel datetime.time cells BEFORE publication
    p.role = "TEACHER"
    p.teacher = "gv_cnpm"
    ext_wb = Workbook()
    ext_ws = ext_wb.active
    ext_ws.append(["Loại lịch", "Trường / Đơn vị", "Mã môn / Hoạt động", "Lớp / Nhóm", "Thứ", "Giờ bắt đầu", "Giờ kết thúc", "Phòng", "Ghi chú"])
    ext_ws.append(["EXTERNAL_TEACHING", "PTIT", "INT1306", "N02", 5, dtime(7, 10), dtime(9, 15), "502-NT", "Dạy ngoài sáng T5"])
    ext_ws.append(["STUDYING", "VNU", "NCS-AI", "K42", 7, dtime(7, 10), dtime(9, 15), "B1-302", "Đi học NCS sáng T7"])
    ext_buf = BytesIO()
    ext_wb.save(ext_buf)
    ext_prev = client.post("/api/import/external-preview", files={"file": ("ext_excel_time.xlsx", ext_buf.getvalue())}).json()
    assert ext_prev["can_import"] is True
    assert ext_prev["items"][0]["start"] == 430 and ext_prev["items"][0]["end"] == 555

    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "external-import", {"items": ext_prev["items"]}, revision=rev).status_code == 200

    # 5. HEAD of each department balances & submits
    for dept_id, head_tid in (("CNPM", "gv_cnpm"), ("HTTT", "gv_httt"), ("KHMT", "gv_khmt"), ("TTDPT", "gv_mme")):
        p.role = "HEAD"
        p.department = dept_id
        p.teacher = head_tid
        rev = client.get("/api/workspace").json()["revision"]
        assert post(client, "balance", {"department": dept_id}, revision=rev).status_code == 200
        rev = client.get("/api/workspace").json()["revision"]
        assert post(client, "submit", {"department": dept_id}, revision=rev).status_code == 200

    # 6. STAFF runs solver -> 0 hard violations, inactive teacher gets 0 classes, external/study slots avoided!
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "solve", {"iterations": 300, "seed": 42}, revision=rev).status_code == 200

    ws_solved = client.get("/api/workspace").json()
    assert ws_solved["evaluation"]["hard"] == 0
    sessions = ws_solved["state"]["sessions"]
    assert all(s["teacher"] != "gv_nghi" for s in sessions)

    # Export draft BEFORE publish works (supports viewing/exporting weekly timetable right after solve)
    exp_draft = client.get("/api/export/draft")
    assert exp_draft.status_code == 200

    # Publish and verify teacher gv_cnpm has zero overlap with Thursday 07:10-09:15 and Saturday 07:10-09:15
    rev = ws_solved["revision"]
    assert post(client, "publish", {}, revision=rev).status_code == 200
    pub = client.get("/api/workspace").json()["state"]["published"]
    assert len(pub) == len(sessions)

    cnpm_events = [e for e in pub if e["teacher"] == "gv_cnpm"]
    assert len(cnpm_events) == 5  # 1 LEC + 4 TUT of 61FIT3SS1
    for e in cnpm_events:
        assert e["end"] - e["start"] == 125  # 2.5 periods * 50m = 125m exact
        assert not (e["day"] == 5 and e["start"] < 555 and 430 < e["end"])
        assert not (e["day"] == 7 and e["start"] < 555 and 430 < e["end"])

    mme_events = [e for e in pub if e["course"] == "61MME2GD1"]
    assert len(mme_events) == 3  # 3 COMBINED classes
    assert all(e["kind"] == "COMBINED" and (e["end"] - e["start"] == 200) for e in mme_events)


def test_real_hanu_external_csv_exact_overlap(api):
    """Verify real HANU lich_truong_khac.csv parsing and exact external schedule conflict avoidance."""
    from pathlib import Path
    from app.timetable.rules import placement_domains

    client, p = api
    p.role = "TEACHER"
    p.teacher = "VanHT"

    real_csv = Path(__file__).resolve().parents[2] / "resources" / "lich_truong_khac.csv"
    res = client.post("/api/import/external-preview", files={"file": ("lich_truong_khac.csv", real_csv.read_bytes())})
    assert res.status_code == 200
    data = res.json()
    assert data["can_import"] is True
    assert len(data["items"]) == 3
    assert all(it["institution"] == "ĐH Thủy lợi" for it in data["items"])

    # Friday (day=6): VanHT teaches at ĐH Thủy lợi 09:40–12:10 (580..730).
    # Ca 2 (09:30–11:35 = 570..695) overlaps directly and is blocked; Ca 3 (12:20–14:25 = 740..865) does not overlap and is allowed.
    o = Offering(id="61FIT-V", course="61FIT", name="Mạng MT", cohort="61", department="D", students=40, lecture_periods=2.5, tutorial_periods=0, room="PROJECTOR")
    slots = [Slot(day=6, start=570, end=695), Slot(day=6, start=740, end=865)]
    st = State(
        departments=[Department(id="D", name="Dept", status="SUBMITTED")],
        teachers=[Teacher(id="VanHT", name="VanHT", department="D", capabilities={"61FIT": ["LEC"]})],
        offerings=[o],
        sessions=split(o),
        config=Config(include_break=False, slots=slots),
        rooms=[Room(id="801C", name="801C", capacity=100, room_type="PROJECTOR", equipment=["PROJECTOR"], availability=slots)],
        external=[External(id="ext1", teacher="VanHT", day=6, start=580, end=730, institution="ĐH Thủy lợi", course="Mạng MT", class_name="K66")],
    )
    st.sessions[0].teacher = "VanHT"
    domains, diag = placement_domains(st)
    assert not diag
    assert [c.slot for c in domains[st.sessions[0].id]] == [1]


def test_real_hanu_master_workbook_v52_and_ke_hoach_match(api):
    """Verify both the 11-sheet HANU master file (FIT Time table Fall2026 V5.2.xlsx) and ke_hoach_mo_lop_HK1_2026.xlsx import cleanly into 67 offerings / 290 sessions."""
    import json
    from pathlib import Path

    client, p = api
    p.role = "STAFF"
    p.teacher = None

    root = Path(__file__).resolve().parents[2]
    approved = [
        Offering.model_validate(o).model_dump()
        for o in json.loads((root / "data/fall2026/approved_plan.json").read_text(encoding="utf-8"))["offerings"]
    ]

    # 1. 1-sheet 12-column Vietnamese plan matches approved_plan.json 100%
    kh_bytes = (root / "resources/ke_hoach_mo_lop_HK1_2026.xlsx").read_bytes()
    r1 = client.post("/api/import/preview", files={"file": ("ke_hoach_mo_lop_HK1_2026.xlsx", kh_bytes)}).json()
    assert r1["can_import"] is True and not r1["errors"]
    assert r1["offerings"] == approved

    # 2. 11-sheet master workbook FIT Time table Fall2026 V5.2.xlsx imports 67 offerings -> 290 sessions WITH real HANU start/end dates
    v52_bytes = (root / "resources/FIT Time table Fall2026 V5.2.xlsx").read_bytes()
    r2 = client.post("/api/import/preview", files={"file": ("FIT Time table Fall2026 V5.2.xlsx", v52_bytes)}).json()
    assert r2["can_import"] is True and not r2["errors"]
    assert len(r2["offerings"]) == 67
    assert any(o.get("start_date") == "2026-08-17" for o in r2["offerings"])
    assert any(o.get("start_date") == "2026-09-07" for o in r2["offerings"])
    sessions = [s for o in r2["offerings"] for s in split(Offering.model_validate(o))]
    assert len(sessions) == 290


def test_solver_algorithm_threads_dates_and_teacher_export(api):
    """Verify algorithm/threads selection, start_date/end_date propagation, weekly filter, and /api/export-teacher."""
    from io import BytesIO
    from openpyxl import load_workbook
    from test_api import post

    client, p = api
    p.role = "STAFF"
    p.teacher = None

    rev = client.get("/api/workspace").json()["revision"]
    assert post(
        client,
        "offerings",
        {
            "offerings": [
                {
                    "id": "61FIT3CGR-2024",
                    "course": "61FIT3CGR",
                    "name": "Đồ họa máy tính",
                    "cohort": "2024",
                    "department": "D",
                    "students": 35,
                    "lecture_periods": 2.0,
                    "tutorial_periods": 0.0,
                    "room": "PROJECTOR",
                    "program": "STANDARD",
                    "start_date": "17/08/2026",
                    "end_date": "22/11/2026",
                },
                {
                    "id": "61FIT2DMA-2025",
                    "course": "61FIT2DMA",
                    "name": "Toán rời rạc",
                    "cohort": "2025",
                    "department": "D",
                    "students": 35,
                    "lecture_periods": 2.0,
                    "tutorial_periods": 0.0,
                    "room": "PROJECTOR",
                    "program": "STANDARD",
                    "start_date": "07/09/2026",
                    "end_date": "13/12/2026",
                },
            ]
        },
        revision=rev,
    ).status_code == 200

    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "send-all", {}, revision=rev).status_code == 200

    p.role = "HEAD"
    p.department = "D"
    p.teacher = "t"
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "teacher", {"department": "D", "teacher": "t", "assistant": False, "active": True, "capabilities": {"61FIT3CGR": ["LEC"], "61FIT2DMA": ["LEC"]}}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "balance", {"department": "D"}, revision=rev).status_code == 200
    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "submit", {"department": "D"}, revision=rev).status_code == 200

    # Solve with explicit algorithm="SA", threads=4
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    rev = client.get("/api/workspace").json()["revision"]
    s_res = post(client, "solve", {"algorithm": "SA", "threads": 4, "iterations": 60, "seed": 7}, revision=rev)
    assert s_res.status_code == 200
    runs = s_res.json()["runs"]
    assert len(runs) == 4 and all(r["algorithm"] == "SA" for r in runs)

    rev = client.get("/api/workspace").json()["revision"]
    assert post(client, "publish", {}, revision=rev).status_code == 200

    # Teacher adds a 1-week makeup class in December (non-overlapping date range with 61FIT3CGR which ended 2026-11-22!)
    p.role = "TEACHER"
    p.teacher = "t"
    ws_t = client.get("/api/workspace").json()
    assert ws_t["term_config"]["term_start_date"] == "2026-08-03"
    cgr_pub = next(x for x in ws_t["state"]["published"] if x["course"] == "61FIT3CGR")
    assert cgr_pub["start_date"] == "2026-08-17" and cgr_pub["end_date"] == "2026-11-22"

    # Even on the SAME weekday/time as 61FIT3CGR, a December makeup class (after Nov 22) does NOT conflict!
    rev = ws_t["revision"]
    assert post(
        client,
        "external",
        {
            "institution": "HANU",
            "course": "Dạy bù tháng 12",
            "class_name": "N01",
            "room": "402C",
            "day": cgr_pub["day"],
            "start": cgr_pub["start"],
            "end": cgr_pub["end"],
            "activity_type": "MAKEUP",
            "start_date": "2026-12-01",
            "end_date": "2026-12-07",
        },
        revision=rev,
    ).status_code == 200

    # Export teacher workbook for Week 4 (2026-08-24 -> only 61FIT3CGR active, K2025 & Dec makeup NOT active!)
    exp_w4 = client.get("/api/export-teacher?week_start=2026-08-24")
    assert exp_w4.status_code == 200
    wb_w4 = load_workbook(BytesIO(exp_w4.content))
    detail_rows = list(wb_w4["Danh sách chi tiết"].iter_rows(min_row=2, values_only=True))
    assert len(detail_rows) == 1 and detail_rows[0][2] == "61FIT3CGR"

    # Export teacher workbook for full semester -> all 3 items present!
    exp_all = client.get("/api/export-teacher")
    assert exp_all.status_code == 200
    wb_all = load_workbook(BytesIO(exp_all.content))
    assert len(list(wb_all["Danh sách chi tiết"].iter_rows(min_row=2, values_only=True))) == 3


def test_holiday_calendar_and_next_week_makeup_shift(api):
    """Verify HANU holiday calendar rules + automatic next-week same-weekday makeup extension without losing draft/published."""
    from datetime import date
    from app.timetable.exporter import _evaluate_holiday_occurrence
    from app.timetable.models import HolidayRule

    holidays = [
        HolidayRule(id="HOL-0902", name="Nghỉ Lễ Quốc khánh 2/9", start_date="2026-08-31", end_date="2026-09-02"),
        HolidayRule(id="HOL-1120", name="Kỷ niệm Ngày Nhà giáo Việt Nam 20/11", start_date="2026-11-20", end_date="2026-11-20"),
    ]

    # K24 Tuesday class (base 12 weeks: 2026-08-17 -> 2026-11-08) hits Sept 1 (National Day break)
    tue_item = {"day": 3, "start": 430, "end": 555, "start_date": "2026-08-17", "end_date": "2026-11-08"}
    occ_w5 = _evaluate_holiday_occurrence(tue_item, date(2026, 8, 31), holidays)
    assert occ_w5["visible"] is True
    assert occ_w5["status"] == "HOLIDAY_OFF"
    assert occ_w5["makeup_next_date"] == "2026-09-08"

    # Immediately following Tuesday (2026-09-08 in Week 6) teaches shifted session #3
    occ_w6 = _evaluate_holiday_occurrence(tue_item, date(2026, 9, 7), holidays)
    assert occ_w6["visible"] is True
    assert occ_w6["status"] == "SHIFTED_NEXT_WEEK"
    assert occ_w6["session_number"] == 3

    # Week 15 (Monday 2026-11-09 -> Tuesday 2026-11-10) automatically hosts extended makeup session #12!
    occ_w15 = _evaluate_holiday_occurrence(tue_item, date(2026, 11, 9), holidays)
    assert occ_w15["visible"] is True
    assert occ_w15["status"] == "MAKEUP_EXTENSION"
    assert occ_w15["session_number"] == 12
    assert occ_w15["effective_end_date"] == "2026-11-10"

    # Week 16 (Monday 2026-11-16) is past session #12 -> not visible
    assert _evaluate_holiday_occurrence(tue_item, date(2026, 11, 16), holidays)["visible"] is False

    # K24 Thursday class (day=5) in same 12-week cohort does NOT hit 31/08-02/09 -> finishes at Week 14 (2026-11-05)
    thu_item = {"day": 5, "start": 430, "end": 555, "start_date": "2026-08-17", "end_date": "2026-11-08"}
    assert _evaluate_holiday_occurrence(thu_item, date(2026, 8, 31), holidays)["status"] == "NORMAL"
    assert _evaluate_holiday_occurrence(thu_item, date(2026, 11, 9), holidays)["visible"] is False

    # API test: updating config.holidays preserves existing draft & exposes holidays in TEACHER workspace + Excel export
    client, p = api
    p.role = "STAFF"
    p.department = None
    p.teacher = None
    ws0 = client.get("/api/workspace").json()
    cfg = dict(ws0["state"]["config"])
    cfg["holidays"] = [h.model_dump() for h in holidays]
    r_cfg = post(client, "config", cfg, revision=ws0["revision"])
    assert r_cfg.status_code == 200
    ws_after = client.get("/api/workspace").json()
    assert ws_after["state"]["config"]["holidays"][0]["id"] == "HOL-0902"

    p.role = "TEACHER"
    p.teacher = "t"
    ws_teacher = client.get("/api/workspace").json()
    assert len(ws_teacher["term_config"]["holidays"]) == 2




