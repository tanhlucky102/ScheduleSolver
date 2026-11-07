import copy
import json
import os
import re
import signal
import subprocess
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
port = 3497
base = f'http://127.0.0.1:{port}'
env = dict(os.environ, NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:5499',
           NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public-test-key',
           NEXT_PUBLIC_API_URL='http://127.0.0.1:5498', NEXT_TELEMETRY_DISABLED='1')
room = dict(id='R1', name='Phòng R1', capacity=100, room_type='PROJECTOR', equipment=['PROJECTOR'],
            availability=[dict(day=2, start=420, end=1080)], active=True,
            allowed_departments=[], allowed_programs=[], allowed_courses=[], note='')
base_state = dict(rooms=[room], reservations=[], config=dict(period_minutes=50, break_minutes=10,
    max_periods=8, rooms=dict(PROJECTOR=1, COMPUTER=0), slots=[dict(day=2,start=420,end=720,evening=False)]),
    departments=[dict(id='D',name='Bộ môn D',status='SENT',note='')],
    teachers=[dict(id='T1',name='Giảng viên T1',department='D',assistant=False,capabilities={'CS101':['LEC']})],
    sessions=[dict(id='S1',course='CS101',kind='LEC',students=30,periods=2,teacher='T1',department='D')],
    draft=[],published=[dict(id='S1',course='CS101',teacher='T1',room_id='R1',day=2,start=420,end=530)],external=[])
user = dict(id='00000000-0000-0000-0000-000000000001',aud='authenticated',role='authenticated',
            email='test@example.com',app_metadata={},user_metadata={},created_at='2026-01-01T00:00:00Z')
errors=[]
log=open('/tmp/refactor_browser_smoke.log','w')
server=subprocess.Popen(['npm','run','dev','--','--hostname','127.0.0.1','--port',str(port)],
    cwd=root/'frontend',env=env,stdout=log,stderr=log,start_new_session=True)
try:
    for _ in range(90):
        try:
            urllib.request.urlopen(base,timeout=2)
            break
        except Exception:
            if server.poll() is not None:
                raise RuntimeError(Path('/tmp/refactor_browser_smoke.log').read_text())
            time.sleep(.5)
    else:
        raise RuntimeError('Frontend startup timeout')
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch()
        for role in ('STAFF','HEAD','TEACHER'):
            page=browser.new_page(viewport={'width':1440,'height':900})
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.route('http://127.0.0.1:5499/**',lambda route:route.fulfill(status=200,content_type='application/json',
                body=json.dumps(dict(access_token='fixture-token',refresh_token='fixture-refresh',token_type='bearer',
                                     expires_in=3600,user=user))))
            def api(route):
                path=route.request.url.rsplit('/',1)[-1]
                if path=='me':
                    body=dict(role=role,teacher=None if role=='STAFF' else 'T1',department='D' if role=='HEAD' else None)
                else:
                    state=copy.deepcopy(base_state)
                    if role=='TEACHER':
                        state=dict(published=state['published'],external=[])
                    body=dict(revision=0,has_publication=True,state=state,
                              evaluation=dict(hard=0,soft_total=0,violations=[],soft={}))
                route.fulfill(status=200,content_type='application/json',body=json.dumps(body))
            page.route('http://127.0.0.1:5498/**',api)
            page.goto(base)
            page.get_by_label('Email công tác').fill('test@example.com')
            page.get_by_label('Mật khẩu').fill('fixture-password')
            page.get_by_role('button',name='Đăng nhập vào hệ thống').click()
            nav=page.get_by_role('navigation',name='Điều hướng chính')
            expect(nav.get_by_role('button',name=re.compile('Tổng quan'))).to_be_visible()
            if role=='STAFF':
                nav.get_by_role('button',name='Phòng học').click()
                expect(page.get_by_role('heading',name=re.compile('lịch chiếm dụng'))).to_be_visible()
                page.get_by_role('button',name=re.compile('Nhập phòng mới')).click()
                expect(page.get_by_label('Mã phòng',exact=True)).to_be_visible()
                page.get_by_role('button',name='Hủy',exact=True).click()
                nav.get_by_role('button',name='Giảng viên & Bộ môn').click()
                expect(page.get_by_role('heading',name=re.compile('Quản lý danh mục'))).to_be_visible()
                nav.get_by_role('button',name='Xếp lịch & công bố').click()
                expect(page.get_by_role('heading',name='Thẩm định & xếp lịch học kỳ')).to_be_visible()
                page.get_by_label('Tìm lớp trong bản nháp').fill('CS101')
                nav.get_by_role('button',name='Lịch học kỳ').click()
                expect(page.get_by_role('heading',name='Thời khóa biểu toàn học kỳ',level=2)).to_be_visible()
                nav.get_by_role('button',name='Xếp lịch & công bố').click()
                expect(page.get_by_label('Tìm lớp trong bản nháp')).to_have_value('CS101')
            elif role=='HEAD':
                expect(nav.get_by_role('button',name='Phòng học')).to_have_count(0)
                nav.get_by_role('button',name=re.compile('Phân công')).click()
                expect(page.get_by_role('heading',name='Phân công lớp học phần')).to_be_visible()
            else:
                expect(nav.get_by_role('button',name=re.compile('Phân công'))).to_have_count(0)
                nav.get_by_role('button',name='Lịch của tôi').click()
                expect(page.get_by_role('heading',name='Khai báo lịch trường ngoài')).to_be_visible()
                expect(page.locator('.calendar-event').first).to_be_visible()
                page.get_by_label('Trường',exact=True).fill('Đơn vị ngoài')
                nav.get_by_role('button',name=re.compile('Tổng quan')).click()
                nav.get_by_role('button',name='Lịch của tôi').click()
                expect(page.get_by_label('Trường',exact=True)).to_have_value('Đơn vị ngoài')
            page.close()
        browser.close()
    assert not errors, errors
    print('PASS: Chromium mocked Auth/API, STAFF/HEAD/TEACHER navigation, room form, draft/term/personal views, tab state persistence, no page errors')
finally:
    if server.poll() is None:
        os.killpg(server.pid,signal.SIGTERM)
        server.wait(timeout=15)
    log.close()
