"""UI smoke using explicit Auth/API fixtures. Does not claim real Supabase E2E."""
from pathlib import Path
import os
import subprocess
import time
import json
import urllib.request
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
env=dict(os.environ,SCHEDULE_NEXT_DIST_DIR=".next-smoke",NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:5199",
         NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="public-test-key",
         NEXT_PUBLIC_API_URL="http://127.0.0.1:5198",NEXT_TELEMETRY_DISABLED="1")
log=(root/"verification"/"browser-smoke-server.log").open("w")
process=subprocess.Popen(["npm","run","dev","--","--hostname","127.0.0.1","--port","3199"],
    cwd=root/"frontend",env=env,stdout=log,stderr=log,start_new_session=True)
try:
    for _ in range(90):
        try:
            urllib.request.urlopen("http://127.0.0.1:3199",timeout=2)
            break
        except Exception:
            if process.poll() is not None:
                raise RuntimeError((root/"verification"/"browser-smoke-server.log").read_text())
            time.sleep(.5)
    else:
        raise RuntimeError("Frontend startup timed out; inspect browser-smoke-server.log")
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for role in ("STAFF","HEAD","TEACHER"):
            page=browser.new_page(viewport={"width":1440,"height":1000})
            rooms=[]
            captured=[]
            def auth(route):
                route.fulfill(status=200,content_type="application/json",body=json.dumps({
                    "access_token":"test-access-token","refresh_token":"test-refresh-token","token_type":"bearer","expires_in":3600,
                    "user":{"id":"00000000-0000-0000-0000-000000000001","aud":"authenticated","role":"authenticated",
                            "email":"test@example.com","app_metadata":{},"user_metadata":{},"created_at":"2026-01-01T00:00:00Z"}}))
            def api(route):
                path=route.request.url.rsplit("/",1)[-1]
                if "/commands/" in route.request.url:
                    command=route.request.post_data_json
                    captured.append((path,command["payload"]))
                    if path=="rooms":
                        rooms[:] = command["payload"]["rooms"]
                    body={"revision":len(captured)}
                elif path=="me":
                    body={"role":role,"teacher":"t" if role!="STAFF" else None,"department":"D" if role=="HEAD" else None}
                else:
                    body={"revision":len(captured),"has_publication":True,"evaluation":{"hard":0,"soft_total":0,"violations":[],"soft":{}},
                          "state":{"rooms":rooms,"reservations":[],"config":{"period_minutes":50,"break_minutes":10,"max_periods":8,"rooms":{"PROJECTOR":2,"COMPUTER":2},"slots":[]},
                          "departments":[{"id":"D","name":"Bộ môn CNTT","status":"SENT","note":""}],
                          "teachers":[{"id":"t","name":"Giảng viên","department":"D","assistant":False,"capabilities":{}}],
                          "sessions":[],"draft":[],"published":[{"id":"class","course":"CS101","room_id":"R1","day":2,"start":420,"end":530}],
                          "external":[]}}
                route.fulfill(status=200,content_type="application/json",body=json.dumps(body))
            page.route("http://127.0.0.1:5199/**",auth)
            page.route("http://127.0.0.1:5198/**",api)
            page.goto("http://127.0.0.1:3199")
            page.get_by_label("Email",exact=True).fill("test@example.com")
            page.get_by_label("Mật khẩu",exact=True).fill("fixture-password")
            page.get_by_role("button",name="Đăng nhập",exact=True).click()
            page.get_by_role("button",name="Đăng xuất").wait_for()
            if role=="STAFF":
                page.get_by_role("button",name="Cấu hình & kế hoạch",exact=True).click()
                page.get_by_role("heading",name="Khung giờ & quy định",exact=True).wait_for()
                page.get_by_role("button",name="Thêm bộ môn",exact=True).click()
                page.get_by_label("Mã bộ môn",exact=True).last.fill("CS")
                page.get_by_role("button",name="Phòng học",exact=True).click()
                page.get_by_label("Mã phòng",exact=True).fill("R1")
                page.get_by_label("Tên phòng",exact=True).fill("Phòng kiểm thử")
                page.get_by_label("Sức chứa đã xác nhận",exact=True).fill("60")
                page.get_by_label("Loại phòng",exact=True).fill("CLASSROOM")
                page.get_by_label("Thiết bị (cách nhau bằng dấu phẩy)",exact=True).fill("PROJECTOR, COMPUTER")
                page.get_by_role("button",name="Thêm khung để chỉnh sửa",exact=True).click()
                page.get_by_role("button",name="Lưu phòng",exact=True).click()
                page.get_by_role("button",name="Sửa R1",exact=True).wait_for()
                assert captured[-1][0]=="rooms"
                saved=captured[-1][1]["rooms"][0]
                assert saved["capacity"]==60 and saved["equipment"]==["PROJECTOR","COMPUTER"]
                assert saved["availability"][0]["start"]==420
                page.get_by_role("button",name="Sửa R1",exact=True).click()
                page.get_by_label("Sức chứa đã xác nhận",exact=True).fill("80")
                page.get_by_role("button",name="Lưu phòng",exact=True).click()
                page.get_by_text("80",exact=True).wait_for()
                assert captured[-1][1]["rooms"][0]["capacity"]==80
            else:
                assert page.get_by_role("button",name="Cấu hình & kế hoạch",exact=True).count()==0
                assert page.get_by_role("button",name="Phòng học",exact=True).count()==0
                page.get_by_role("button",name="Lịch của tôi",exact=True).click()
                page.get_by_role("heading",name="Khai báo lịch trường ngoài",exact=True).wait_for()
                page.locator(".calendar-event").get_by_text("CS101",exact=True).wait_for()
            page.screenshot(path=str(root/"verification"/f"ui-{role.lower()}.png"),full_page=True)
            page.close()
        browser.close()
    print("PASS: Chromium login and role navigation, catalog and room create/edit forms, captured room API payload, personal timetable and external form (mock Auth/API)")
finally:
    import signal
    if process.poll() is None:
        os.killpg(process.pid,signal.SIGTERM)
        process.wait(timeout=15)
    log.close()
