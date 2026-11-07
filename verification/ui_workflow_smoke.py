"""Role UX regression with deterministic Auth/API fixtures; no hosted data mutations."""
from pathlib import Path
import copy
import json
import os
import signal
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "verification" / "redesign"
ART.mkdir(exist_ok=True)
env = dict(os.environ, SCHEDULE_NEXT_DIST_DIR=".next-ux", NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:5299",
           NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="public-test-key", NEXT_PUBLIC_API_URL="http://127.0.0.1:5298",
           NEXT_TELEMETRY_DISABLED="1")
room = dict(id="A101", name="Phòng học A101", capacity=100, room_type="CLASSROOM", equipment=["PROJECTOR"],
            availability=[dict(day=2, start=420, end=1080)], active=True,
            allowed_departments=[], allowed_programs=[], allowed_courses=[], note="")
state = dict(rooms=[room], reservations=[], config=dict(period_minutes=50, break_minutes=10, max_periods=8,
             rooms=dict(PROJECTOR=1, COMPUTER=0), slots=[dict(day=2, start=420, end=720, evening=False),dict(day=2, start=600, end=900, evening=False)]),
             departments=[dict(id="CS", name="Bộ môn Công nghệ thông tin", status="UNSENT", note="")],
             teachers=[dict(id="T1", name="Nguyễn Minh Anh", department="CS", assistant=False, capabilities={"CS101":["LEC","TUT"]}),
                       dict(id="T2", name="Trần Hoàng Nam", department="CS", assistant=True, capabilities={"CS101":["TUT"]})],
             sessions=[dict(id="CS101-L01", course="CS101", kind="LEC", students=80, periods=3, teacher=None, department="CS"),
                       dict(id="CS101-T01", course="CS101", kind="TUT", students=30, periods=2, teacher=None, department="CS")],
             draft=[], published=[], external=[])
revision = 0
captured = []
errors = []
report = dict(hard=0, soft_total=2, violations=[], soft=dict(single_class=2))
fail_next = False

def auth(route):
    route.fulfill(status=200, content_type="application/json", body=json.dumps(dict(
        access_token="fixture-token", refresh_token="fixture-refresh", token_type="bearer", expires_in=3600,
        user=dict(id="00000000-0000-0000-0000-000000000001", aud="authenticated", role="authenticated",
                  email="test@example.com", app_metadata={}, user_metadata={}, created_at="2026-01-01T00:00:00Z"))))

def route_api(route, role):
    global revision, fail_next
    path = route.request.url.rsplit("/", 1)[-1]
    if "/commands/" in route.request.url:
        data = route.request.post_data_json
        assert data["revision"] == revision
        payload = data["payload"]
        captured.append((role, path, payload))
        if fail_next:
            fail_next = False
            route.fulfill(status=409, content_type="application/json", body=json.dumps({"detail":"Xung đột phòng A101. Chọn phòng hoặc khung giờ khác."}))
            return
        if path == "send": state["departments"][0]["status"] = "SENT"
        elif path == "assign":
            next(s for s in state["sessions"] if s["id"] == payload["session"])["teacher"] = payload["teacher"]
        elif path == "submit": state["departments"][0].update(status="SUBMITTED", note="")
        elif path == "return": state["departments"][0].update(status="SENT", note=payload["note"])
        elif path == "solve":
            state["draft"] = [dict(session=s["id"], slot=i, room_id="A101") for i,s in enumerate(state["sessions"])]
        elif path == "publish":
            state["published"] = [dict(id=s["id"], course=s["course"], teacher=s["teacher"], periods=s["periods"],
                                      room_id="A101", day=2, start=420+i*180, end=590+i*120)
                                  for i,s in enumerate(state["sessions"])]
        elif path == "external":
            state["external"].append(dict(payload, id="outside-1", teacher="T1"))
        elif path == "external-delete": state["external"] = []
        revision += 1
        body = dict(revision=revision)
    elif path == "me":
        body = dict(role=role, teacher=None if role=="STAFF" else "T1", department="CS" if role=="HEAD" else None)
    else:
        visible = copy.deepcopy(state)
        if role == "STAFF": visible.pop("external")
        elif role == "HEAD":
            visible["draft"] = []
            visible["published"] = [e for e in visible["published"] if e["teacher"]=="T1"]
        else:
            visible = dict(published=[e for e in visible["published"] if e["teacher"]=="T1"], external=visible["external"])
        body = dict(revision=revision, has_publication=bool(state["published"]), state=visible)
        if role=="STAFF": body["evaluation"] = report
    route.fulfill(status=200, content_type="application/json", body=json.dumps(body))

def login(browser, role):
    page = browser.new_page(viewport=dict(width=1440, height=1000))
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("http://127.0.0.1:5299/**", auth)
    page.route("http://127.0.0.1:5298/**", lambda route: route_api(route, role))
    page.goto("http://127.0.0.1:3299")
    page.get_by_label("Email", exact=True).fill("test@example.com")
    page.get_by_label("Mật khẩu", exact=True).fill("fixture-password")
    page.get_by_role("button", name="Đăng nhập", exact=True).click()
    expect(page.locator("nav button").first).to_be_visible()
    return page

def screenshot(page, name):
    page.screenshot(path=str(ART / (name+".png")), full_page=True)

def mobile(page, name):
    page.set_viewport_size(dict(width=390,height=844))
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Document overflows"
    screenshot(page, name)
    page.set_viewport_size(dict(width=1440,height=1000))

log = (ART/"server.log").open("w")
server = subprocess.Popen(["npm","run","dev","--","--hostname","127.0.0.1","--port","3299"],
                          cwd=ROOT/"frontend",env=env,stdout=log,stderr=log,start_new_session=True)
try:
    for _ in range(90):
        try:
            urllib.request.urlopen("http://127.0.0.1:3299", timeout=2)
            break
        except Exception:
            if server.poll() is not None: raise RuntimeError("Frontend exited")
            time.sleep(.5)
    else: raise RuntimeError("Frontend timeout")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        staff = login(browser,"STAFF")
        screenshot(staff,"staff-overview")
        mobile(staff,"staff-overview-mobile")
        staff.get_by_role("button",name="Gửi bộ môn",exact=False).click()
        expect(staff.get_by_text("Đã gửi kế hoạch cho bộ môn.",exact=True)).to_be_visible()
        head = login(browser,"HEAD")
        assert head.get_by_role("button",name="Phòng học",exact=True).count()==0
        head.locator("nav").get_by_role("button",name="Phân công",exact=False).click()
        expect(head.get_by_role("button",name="Nộp cho giáo vụ",exact=False)).to_be_disabled()
        lecture = head.get_by_label("Giảng viên cho CS101-L01",exact=True)
        assert lecture.locator('option[value="T2"]').count()==0, "Assistant cannot teach lecture"
        head.get_by_label("Tìm lớp, môn hoặc giảng viên").fill("not-found")
        expect(head.get_by_role("heading",name="Không tìm thấy lớp phù hợp")).to_be_visible()
        head.get_by_label("Tìm lớp, môn hoặc giảng viên").fill("")
        lecture.select_option("T1")
        expect(head.get_by_text("Đã lưu phân công giảng viên.",exact=True)).to_be_visible()
        head.get_by_label("Giảng viên cho CS101-T01",exact=True).select_option("T2")
        expect(head.get_by_role("button",name="Nộp cho giáo vụ",exact=False)).to_be_enabled()
        screenshot(head,"head-assignment")
        mobile(head,"head-assignment-mobile")
        head.get_by_role("button",name="Nộp cho giáo vụ",exact=False).click()
        expect(head.get_by_text("Đã nộp phân công cho giáo vụ",exact=True)).to_be_visible()
        expect(lecture).to_be_disabled()
        staff.get_by_role("button",name="Làm mới",exact=False).click()
        staff.get_by_role("button",name="Trả lại để điều chỉnh",exact=True).click()
        staff.get_by_label("Lý do trả lại Bộ môn Công nghệ thông tin").fill("Đối chiếu lại phân công CS101.")
        staff.get_by_role("button",name="Gửi phản hồi",exact=True).click()
        expect(staff.get_by_text("Đã gửi yêu cầu điều chỉnh cho bộ môn.",exact=True)).to_be_visible()
        head.get_by_role("button",name="Làm mới",exact=False).click()
        expect(head.get_by_text("Yêu cầu điều chỉnh: Đối chiếu lại phân công CS101.",exact=True)).to_be_visible()
        head.get_by_role("button",name="Nộp cho giáo vụ",exact=False).click()
        expect(head.get_by_role("button",name="Nộp cho giáo vụ",exact=False)).to_be_disabled()
        staff.get_by_role("button",name="Làm mới",exact=False).click()
        staff.locator("nav").get_by_role("button",name="Xếp lịch & công bố",exact=True).click()
        fail_next = True
        staff.get_by_role("button",name="Thẩm định & chạy bộ giải").click()
        expect(staff.locator(".notice.error")).to_contain_text("Xung đột phòng A101")
        screenshot(staff,"staff-error")
        staff.get_by_role("button",name="Thẩm định & chạy bộ giải").click()
        expect(staff.get_by_text("Đã tìm được lịch hợp lệ với phòng cụ thể.",exact=True)).to_be_visible()
        screenshot(staff,"staff-draft")
        staff.get_by_role("button",name="Công bố lịch",exact=True).click()
        expect(staff.get_by_text("Đã công bố lịch giảng dạy.",exact=True)).to_be_visible()
        teacher = login(browser,"TEACHER")
        assert teacher.get_by_role("button",name="Phân công",exact=False).count()==0
        teacher.locator("nav").get_by_role("button",name="Lịch của tôi",exact=True).click()
        expect(teacher.locator(".calendar-event").get_by_text("CS101",exact=True)).to_be_visible()
        teacher.get_by_role("button",name="Danh sách",exact=True).click()
        expect(teacher.locator(".agenda").get_by_text("CS101",exact=True)).to_be_visible()
        teacher.get_by_role("button",name="Lịch tuần",exact=True).click()
        screenshot(teacher,"teacher-calendar")
        mobile(teacher,"teacher-calendar-mobile")
        teacher.get_by_label("Nguồn lịch",exact=True).select_option("external")
        expect(teacher.get_by_role("heading",name="Chưa có buổi học trong lựa chọn này")).to_be_visible()
        teacher.get_by_label("Nguồn lịch",exact=True).select_option("all")
        teacher.get_by_label("Trường",exact=True).fill("Đơn vị khác")
        teacher.get_by_label("Môn",exact=True).fill("CS202")
        teacher.get_by_label("Lớp",exact=True).fill("L02")
        teacher.get_by_label("Bắt đầu",exact=True).fill("14:00")
        teacher.get_by_label("Kết thúc",exact=True).fill("13:00")
        expect(teacher.get_by_role("button",name="Lưu lịch ngoài")).to_be_disabled()
        teacher.get_by_label("Kết thúc",exact=True).fill("16:00")
        teacher.get_by_role("button",name="Lưu lịch ngoài").click()
        expect(teacher.get_by_text("Đã lưu lịch ngoài.",exact=True)).to_be_visible()
        # A newer publication can collide with an existing outside event.
        state["external"][0].update(start=450,end=550)
        teacher.get_by_role("button",name="Làm mới",exact=False).click()
        expect(teacher.locator(".calendar-event.conflict-event")).to_be_visible()
        screenshot(teacher,"teacher-conflict")
        teacher.on("dialog",lambda dialog:dialog.accept())
        teacher.get_by_role("button",name="Xóa buổi",exact=True).click()
        expect(teacher.locator(".calendar-event.conflict-event")).to_have_count(0)
        # Keyboard access and initial narrow layout.
        narrow=browser.new_page(viewport=dict(width=390,height=844))
        narrow.goto("http://127.0.0.1:3299")
        narrow.keyboard.press("Tab")
        expect(narrow.get_by_role("link",name="Đến nội dung chính")).to_be_focused()
        screenshot(narrow,"login-mobile")
        assert not errors, errors
        browser.close()
    result=dict(status="PASS",auth="mock",api="mock",browser="Chromium",roles=["STAFF","HEAD","TEACHER"],
                viewport=[1440,390],commands=len(captured),page_errors=errors,
                checks=["send","eligible assignment","search empty","workload","submit lock","return/resubmit",
                        "solver error/retry","publish","role navigation","calendar/list/source","external validation",
                        "publication conflict","external deletion","mobile overflow","keyboard skip link"])
    (ART/"results.json").write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,ensure_ascii=False))
finally:
    if server.poll() is None:
        os.killpg(server.pid,signal.SIGTERM)
        server.wait(timeout=15)
    log.close()
