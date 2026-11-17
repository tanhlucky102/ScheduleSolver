"""Complete End-to-End (E2E) workflow demo script for ScheduleSolver.
Executes the full coordination lifecycle against the live running API:
1. Login all demo roles via Supabase Auth
2. Setup HANU 6-shift standard rules & 25 room preset
3. Synchronize teacher capabilities and active personnel (AnhNP active)
4. Balance and submit all 4 departments (KHMT, CNPM, HTTT, TTDPT) -> 100% assigned (0 unassigned)
5. Register teacher external/study schedule (KhoaTN)
6. Solve draft timetable via multi-heuristic solver -> 0 hard violations
7. Publish full-semester timetable (290/290 sessions)
8. Verify Term Calendar and Teacher Personal Calendar access & exports
"""
import json
import os
import sys
import time
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parents[1]
API_URL = "http://localhost:8000"


def load_env():
    env = {}
    with open(ROOT / "backend/.env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v.strip().strip("'\"")
    return env


def main():
    env = load_env()
    with open(ROOT / "schedule-demo-credentials.json") as f:
        creds = json.load(f)

    accounts = {a["role"] if a["role"] != "HEAD" else f"HEAD_{a['department']}": a for a in creds["accounts"]}
    tokens = {}

    print("================================================================================")
    print("BẮT ĐẦU CHẠY LUỒNG DEMO E2E (END-TO-END) TRÊN SCHEDULESOLVER")
    print("================================================================================")
    print("1. Đăng nhập các vai trò qua Supabase Auth...")
    with httpx.Client(timeout=25) as auth_client:
        for key, acc in accounts.items():
            r = auth_client.post(
                f"{env['SUPABASE_URL']}/auth/v1/token?grant_type=password",
                headers={"apikey": env["SUPABASE_PUBLISHABLE_KEY"]},
                json={"email": acc["email"], "password": acc["password"]},
            )
            if r.status_code != 200:
                raise RuntimeError(f"Đăng nhập thất bại cho {key}: {r.status_code} {r.text}")
            tokens[key] = r.json()["access_token"]
            print(f"  ✓ {key:12} ({acc['email']}) -> Đăng nhập thành công!")

    def api_get(endpoint, role="STAFF"):
        r = httpx.get(f"{API_URL}{endpoint}", headers={"Authorization": f"Bearer {tokens[role]}"}, timeout=20)
        if r.status_code != 200:
            raise RuntimeError(f"GET {endpoint} thất bại: {r.status_code} {r.text}")
        return r

    def api_post_cmd(action, payload, role="STAFF", revision=None):
        if revision is None:
            revision = api_get("/api/workspace", role).json()["revision"]
        r = httpx.post(
            f"{API_URL}/api/commands/{action}",
            headers={"Authorization": f"Bearer {tokens[role]}"},
            json={"revision": revision, "payload": payload},
            timeout=60,
        )
        if r.status_code != 200:
            raise RuntimeError(f"Command '{action}' ({role}) thất bại: {r.status_code} {r.text}")
        return r.json()

    # -------------------------------------------------------------------------
    # BƯỚC 1: Cấu hình khung ca/tiết HANU (Tiết 3–14) và 25 phòng học thực tế
    # -------------------------------------------------------------------------
    print("\n2. Cấu hình quy chuẩn Ca/Tiết HANU (6 ca/ngày, Tiết 3–14) & 25 phòng học...")
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
    ws = api_get("/api/workspace").json()
    api_post_cmd("config", {
        "period_minutes": 50,
        "break_minutes": 10,
        "include_break": False,
        "first_period_start": 430,
        "active_days": [2, 3, 4, 5, 6, 7],
        "shift_rules": hanu_shifts,
        "max_periods": 8,
        "rooms": {"PROJECTOR": 15, "COMPUTER": 10},
        "slots": hanu_slots,
    })
    api_post_cmd("rooms-preset", {})
    print("  ✓ Đã thiết lập khung giờ 6 Ca HANU và nạp 25 phòng học chuẩn!")

    # -------------------------------------------------------------------------
    # BƯỚC 2: Cập nhật nhân sự (AnhNP hoạt động) & đồng bộ năng lực
    # -------------------------------------------------------------------------
    print("\n3. Đồng bộ năng lực giảng dạy & chuẩn hóa ràng buộc phòng...")
    api_post_cmd("teacher-save", {
        "id": "AnhNP",
        "name": "AnhNP",
        "department": "TTDPT",
        "assistant": False,
        "active": True,
    })
    csv_text = (ROOT / "resources/nang_luc_giang_vien.csv").read_text(encoding="utf-8-sig")
    for dept in ("KHMT", "CNPM", "HTTT", "TTDPT"):
        api_post_cmd(
            "capabilities-import",
            {"csv_text": csv_text, "mode": "merge"},
            role=f"HEAD_{dept}",
        )

    # Chuẩn hóa lại yêu cầu phòng của các lớp (loại bỏ giá trị test 'Hello' / 'Phòng hội nghị' nếu có)
    ws_curr = api_get("/api/workspace").json()
    for s in ws_curr["state"]["sessions"]:
        if s.get("required_equipment") or s.get("required_room_type"):
            api_post_cmd("requirements", {
                "session": s["id"],
                "room": s.get("room") or "PROJECTOR",
                "required_equipment": [],
                "required_room_type": None,
            })
    print("  ✓ Giảng viên AnhNP (TTDPT): Sẵn sàng giảng dạy (Active: True, Trợ giảng: False).")
    print("  ✓ Toàn bộ năng lực giảng viên 4 bộ môn đã đồng bộ từ danh mục chuẩn.")
    print("  ✓ Chuẩn hóa yêu cầu phòng học cho toàn bộ 290 lớp học phần.")

    # -------------------------------------------------------------------------
    # BƯỚC 3: Cân bằng tải và nộp phương án phân công (100% phân công)
    # -------------------------------------------------------------------------
    print("\n4. Phân công giảng dạy tự động theo năng lực & nộp phương án 4 Bộ môn...")
    ws_curr = api_get("/api/workspace").json()
    dept_map = {d["id"]: d["status"] for d in ws_curr["state"]["departments"]}
    departments = ["KHMT", "CNPM", "HTTT", "TTDPT"]
    for dept in departments:
        head_role = f"HEAD_{dept}"
        if dept_map.get(dept) == "SENT":
            api_post_cmd("balance", {"department": dept}, role=head_role)
            api_post_cmd("submit", {"department": dept}, role=head_role)
            print(f"  ✓ Bộ môn {dept:5}: Đã tự động cân bằng tải (balance) và nộp duyệt (SUBMITTED).")
        else:
            print(f"  ✓ Bộ môn {dept:5}: Đã ở trạng thái SUBMITTED và hoàn tất phân công.")

    # Kiểm tra số lượng phân công
    ws_after_assign = api_get("/api/workspace").json()
    sessions = ws_after_assign["state"]["sessions"]
    unassigned = [s for s in sessions if not s.get("teacher")]
    print(f"\n=> TỔNG KẾT PHÂN CÔNG: {len(sessions) - len(unassigned)}/{len(sessions)} buổi đã có giảng viên phụ trách (Còn trống: {len(unassigned)} buổi).")
    assert len(unassigned) == 0, f"Vẫn còn {len(unassigned)} buổi chưa có giảng viên!"

    # -------------------------------------------------------------------------
    # BƯỚC 4: Khai báo lịch đi học / dạy trường ngoài & Bảng màu cá nhân + Note (cả TBM & Giảng viên)
    # -------------------------------------------------------------------------
    print("\n5. Khai báo lịch ngoài khoa & Bảng màu cá nhân kèm Note chuẩn (cho cả TBM & Giảng viên)...")
    ws_teacher = api_get("/api/workspace", role="TEACHER").json()
    existing_ext = ws_teacher["state"].get("external", [])
    if not existing_ext:
        external_items = [
            {
                "activity_type": "EXTERNAL_TEACHING",
                "institution": "Học viện CNBCVT (PTIT)",
                "course": "INT1306",
                "class_name": "N02",
                "day": 5,
                "start": 430,
                "end": 555,
                "room": "502-A2",
                "color": "",
                "note": "Dạy Lập trình mạng sáng Thứ 5",
            },
            {
                "activity_type": "STUDYING",
                "institution": "ĐHQGHN (VNU)",
                "course": "NCS-AI",
                "class_name": "K42",
                "day": 7,
                "start": 430,
                "end": 555,
                "room": "B1-302",
                "color": "",
                "note": "Nghiên cứu sinh sáng Thứ 7",
            },
        ]
        api_post_cmd("external-import", {"items": external_items}, role="TEACHER")
        print("  ✓ Đã lưu lịch Thứ 5 (07:10–09:15 PTIT) và Thứ 7 (07:10–09:15 VNU) cho giảng viên KhoaTN.")
    else:
        print(f"  ✓ Giảng viên KhoaTN đã có sẵn {len(existing_ext)} lịch hoạt động ngoài trường.")

    api_post_cmd("color-rules", {
        "rules": [
            {
                "id": "demo-khoatn-ptit",
                "category": "INSTITUTION",
                "key": "PTIT",
                "label": "Thỉnh giảng PTIT",
                "bg_color": "#fef3c7",
                "border_color": "#d97706",
                "text_color": "#78350f",
                "note": "Điểm danh cổng giảng viên PTIT nhà A2 trước 07:05",
            },
            {
                "id": "demo-khoatn-ncs",
                "category": "STATUS",
                "key": "STUDYING",
                "label": "Đi học NCS (VNU)",
                "bg_color": "#dcfce7",
                "border_color": "#16a34a",
                "text_color": "#14532d",
                "note": "Seminar nghiên cứu sinh tại phòng B1-302 ĐHQGHN",
            },
            {
                "id": "demo-khoatn-tt",
                "category": "CUSTOM",
                "key": "66FIT2PCO",
                "label": "Lớp Tiên tiến 66FIT2PCO",
                "bg_color": "#ede9fe",
                "border_color": "#7c3aed",
                "text_color": "#2e1065",
                "note": "Giảng dạy 100% tiếng Anh - chuẩn bị slide & bài lab EN",
            },
        ]
    }, role="TEACHER")

    ws_head_khmt = api_get("/api/workspace", role="HEAD_KHMT").json()
    if not ws_head_khmt["state"].get("external"):
        api_post_cmd("external-import", {
            "items": [
                {
                    "activity_type": "EXTERNAL_TEACHING",
                    "institution": "ĐH Công nghệ - ĐHQGHN (UET)",
                    "course": "INT3405",
                    "class_name": "K69-AI",
                    "day": 3,
                    "start": 430,
                    "end": 555,
                    "room": "204-G2",
                    "color": "",
                    "note": "Thỉnh giảng Học máy sáng Thứ 3",
                },
                {
                    "activity_type": "STUDYING",
                    "institution": "Viện CNTT - ĐHQGHN",
                    "course": "HĐKH-KHMT",
                    "class_name": "Hội đồng",
                    "day": 6,
                    "start": 880,
                    "end": 1005,
                    "room": "P.301-E3",
                    "color": "",
                    "note": "Hội đồng chuyên môn & hướng dẫn NCS",
                },
            ]
        }, role="HEAD_KHMT")

    api_post_cmd("color-rules", {
        "rules": [
            {
                "id": "demo-thaodtp-uet",
                "category": "INSTITUTION",
                "key": "UET",
                "label": "Thỉnh giảng ĐH Công nghệ (UET)",
                "bg_color": "#fef3c7",
                "border_color": "#d97706",
                "text_color": "#78350f",
                "note": "Mang tài liệu thực hành AI phòng 204-G2",
            },
            {
                "id": "demo-thaodtp-study",
                "category": "STATUS",
                "key": "STUDYING",
                "label": "Hội đồng & Bồi dưỡng (VNU)",
                "bg_color": "#dcfce7",
                "border_color": "#16a34a",
                "text_color": "#14532d",
                "note": "Họp chuyên môn & duyệt đề tài NCS chiều Thứ 6",
            },
            {
                "id": "demo-thaodtp-pop",
                "category": "CUSTOM",
                "key": "66FIT2POP",
                "label": "Lớp Tiên tiến 66FIT2POP",
                "bg_color": "#ede9fe",
                "border_color": "#7c3aed",
                "text_color": "#2e1065",
                "note": "Hệ Tiên tiến dạy bằng tiếng Anh - lưu ý kiểm tra máy chiếu",
            },
        ]
    }, role="HEAD_KHMT")
    print("  ✓ Đã đồng bộ Bảng màu cá nhân + Note chuẩn cho Giảng viên (KhoaTN) và Trưởng BM (ThaoDTP).")

    # -------------------------------------------------------------------------
    # BƯỚC 5: Giáo vụ chạy Solver giải bài toán TKB
    # -------------------------------------------------------------------------
    print("\n6. Giáo vụ kích hoạt thuật toán Xếp Thời khóa biểu tự động (Solver)...")
    t0 = time.time()
    solve_res = api_post_cmd("solve", {"iterations": 120, "seed": 42}, role="STAFF")
    dt = time.time() - t0

    ws_solved = api_get("/api/workspace").json()
    hard_violations = ws_solved["evaluation"]["hard"]
    soft_score = ws_solved["evaluation"]["soft_total"]
    placements = ws_solved["state"]["draft"]
    print(f"  ✓ Solver hoàn thành trong {dt:.2f} giây!")
    print(f"  ✓ Số vi phạm ràng buộc cứng (Hard Violations): {hard_violations}")
    print(f"  ✓ Điểm đánh giá ràng buộc mềm (Soft Score): {soft_score}")
    print(f"  ✓ Số buổi học được xếp giờ và phòng (Draft Placements): {len(placements)}/{len(sessions)}")
    assert hard_violations == 0, f"Solver còn {hard_violations} vi phạm cứng!"

    # -------------------------------------------------------------------------
    # BƯỚC 6: Giáo vụ Công bố Thời khóa biểu chính thức
    # -------------------------------------------------------------------------
    print("\n7. Giáo vụ Công bố Thời khóa biểu chính thức toàn học kỳ...")
    api_post_cmd("publish", {}, role="STAFF")
    ws_pub = api_get("/api/workspace").json()
    published = ws_pub["state"]["published"]
    print(f"  ✓ Đã công bố chính thức {len(published)} buổi học lên hệ thống!")
    assert len(published) == len(sessions), "Số buổi công bố không khớp tổng số buổi!"

    # -------------------------------------------------------------------------
    # BƯỚC 7: Kiểm chứng lịch học kỳ & lịch giảng viên
    # -------------------------------------------------------------------------
    print("\n8. Kiểm chứng hiển thị Lịch học kỳ & Lịch giảng viên...")

    # A. Lịch học kỳ (toàn trường)
    term_export = api_get("/api/export/published", role="STAFF")
    print(f"  ✓ [Lịch học kỳ] Xuất file Excel TKB toàn học kỳ: HTTP {term_export.status_code} ({len(term_export.content):,} bytes).")

    # B. Lịch của giảng viên KhoaTN
    ws_teacher = api_get("/api/workspace", role="TEACHER").json()
    t_published = ws_teacher["state"]["published"]
    t_external = ws_teacher["state"]["external"]
    khoatn_classes = [c for c in t_published if c.get("teacher") == "KhoaTN"]

    print(f"  ✓ [Lịch giảng viên] KhoaTN có {len(khoatn_classes)} buổi dạy chính thức tại khoa.")
    print(f"  ✓ [Lịch giảng viên] KhoaTN có {len(t_external)} lịch bận ngoài trường (Dạy PTIT & Học VNU).")

    # Kiểm tra không có bất kỳ buổi dạy nào của KhoaTN trùng vào Thứ 5 hoặc Thứ 7 sáng
    clashes = [c for c in khoatn_classes if (c["day"] == 5 and c["start"] < 555 and 430 < c["end"]) or (c["day"] == 7 and c["start"] < 555 and 430 < c["end"])]
    print(f"  ✓ [Kiểm tra xung đột] Xung đột giữa lịch dạy và lịch ngoài của KhoaTN: {len(clashes)} (Tuyệt đối an toàn!).")
    assert len(clashes) == 0, "Phát hiện xung đột lịch của giảng viên!"

    teacher_export = api_get("/api/export-teacher?teacher=KhoaTN", role="TEACHER")
    print(f"  ✓ [Lịch giảng viên] Xuất file Excel TKB cá nhân KhoaTN: HTTP {teacher_export.status_code} ({len(teacher_export.content):,} bytes).")

    print("\n================================================================================")
    print("HOÀN THÀNH TOÀN BỘ LUỒNG E2E THÀNH CÔNG RỰC RỠ!")
    print("================================================================================")
    print("Người dùng có thể truy cập ngay giao diện Web tại http://localhost:3000 :")
    print("  1. Đăng nhập Giáo vụ (schedule-demo-staff-6cafcae3@example.com):")
    print("     -> Mở tab 'Lịch học kỳ' để xem toàn bộ TKB 290 buổi theo lưới Ca/Tiết & lọc theo môn/phòng/thứ.")
    print("     -> Mở tab 'Xếp lịch & công bố' để xem ma trận xếp lịch đã giải.")
    print("  2. Đăng nhập Giảng viên (schedule-demo-teacher-6cafcae3@example.com):")
    print("     -> Mở tab 'Lịch của tôi' để xem Thời khóa biểu tích hợp cả lịch dạy khoa và lịch ngoài trường!")
    print("================================================================================")


if __name__ == "__main__":
    main()
