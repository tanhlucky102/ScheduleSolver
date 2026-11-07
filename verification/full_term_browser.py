"""Real Supabase Auth -> local FastAPI/PostgreSQL, with explicitly simulated term data."""
import argparse,json,os,secrets,signal,subprocess,sys,time,urllib.request
from pathlib import Path
from uuid import UUID
from itertools import combinations
from collections import Counter
from dotenv import load_dotenv
import psycopg
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
ART=ROOT/'verification/full-term-simulation'
from app.domain import evaluate,assignment_errors,events,overlap,eligible
from app.models import Workspace,Profile
from app import storage
from app.domain import State

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--keep-serving',action='store_true')
 args=parser.parse_args()
 load_dotenv(ROOT/'backend/.env')
 credentials=json.loads((ROOT/'schedule-demo-credentials.json').read_text())
 selected=[next(a for a in credentials['accounts'] if a['role']=='STAFF'),
           next(a for a in credentials['accounts'] if a['role']=='HEAD' and a['department']=='CNPM'),
           next(a for a in credentials['accounts'] if a['role']=='TEACHER')]
 assert all(a.get('id') and a.get('password') for a in selected)
 name='schedule-fullterm-'+secrets.token_hex(4);password=secrets.token_urlsafe(24)
 processes=[];logs=[];success=False
 errors=[];http_errors=[];tokens={}
 try:
  subprocess.run(['docker','run','--rm','-d','--name',name,'-e','POSTGRES_PASSWORD='+password,'-p','127.0.0.1::5432','postgres:17-alpine'],check=True,capture_output=True)
  port=subprocess.check_output(['docker','port',name,'5432/tcp'],text=True).strip().rsplit(':',1)[1]
  dsn=f'postgresql://postgres:{password}@127.0.0.1:{port}/postgres'
  for _ in range(60):
   try:
    with psycopg.connect(dsn,connect_timeout=2):break
   except psycopg.OperationalError:time.sleep(.5)
  else:raise RuntimeError('Local PostgreSQL startup timeout')
  with psycopg.connect(dsn) as c:
   c.execute('create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated')
   c.execute((ROOT/'supabase/migrations/001_schedule_web.sql').read_text())
   c.execute((ROOT/'supabase/migrations/002_room_constraints.sql').read_text())
   for a in selected:c.execute('insert into auth.users values(%s)',(UUID(a['id']),))
  os.environ['DATABASE_URL']=dsn
  state=State.model_validate_json((ART/'input-state.json').read_text())
  with storage.get_session() as db:
   ws=Workspace(name='HK1-2026 · 67 môn / 290 buổi · phòng giả lập 6+11',body=state.model_dump(),revision=0)
   db.add(ws);db.flush();wid=ws.id
   for a in selected:
    db.add(Profile(id=UUID(a['id']),workspace_id=wid,role=a['role'],department=a.get('department'),teacher='QuyenNV' if a['role']=='TEACHER' else a.get('teacher')))
  env=dict(os.environ,FRONTEND_ORIGINS='http://127.0.0.1:3399,http://localhost:3399',PYTHONUNBUFFERED='1')
  front=dict(env,SCHEDULE_NEXT_DIST_DIR='.next-fullterm',NEXT_PUBLIC_SUPABASE_URL=os.environ['SUPABASE_URL'],NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=os.environ['SUPABASE_PUBLISHABLE_KEY'],NEXT_PUBLIC_API_URL='http://127.0.0.1:8298',NEXT_TELEMETRY_DISABLED='1')
  for label,command,cwd,variables,url in [
   ('backend',[sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8298'],ROOT/'backend',env,'http://127.0.0.1:8298/health'),
   ('frontend',['npm','run','dev','--','--hostname','127.0.0.1','--port','3399'],ROOT/'frontend',front,'http://127.0.0.1:3399')]:
   log=(ART/(label+'.log')).open('w');logs.append(log)
   proc=subprocess.Popen(command,cwd=cwd,env=variables,stdout=log,stderr=log,start_new_session=True);processes.append(proc)
   for _ in range(120):
    try:urllib.request.urlopen(url,timeout=2);break
    except Exception:
     if proc.poll() is not None:raise RuntimeError(label+' exited')
     time.sleep(.5)
   else:raise RuntimeError(label+' did not start')
  with sync_playwright() as p:
   browser=p.chromium.launch()
   def login(account):
    page=browser.new_page(viewport=dict(width=1920,height=1080))
    page.on('pageerror',lambda err:errors.append(str(err)))
    def req(request):
     if request.url.startswith('http://127.0.0.1:8298') and request.headers.get('authorization'):tokens[account['role']]=request.headers['authorization']
    page.on('request',req)
    page.on('response',lambda response:http_errors.append(dict(status=response.status,url=response.url)) if response.url.startswith('http://127.0.0.1:8298') and response.status>=400 else None)
    page.goto('http://127.0.0.1:3399')
    page.get_by_label('Email',exact=True).fill(account['email'])
    page.get_by_label('Mật khẩu',exact=True).fill(account['password'])
    page.get_by_role('button',name='Đăng nhập',exact=True).click()
    expect(page.locator('nav')).to_be_visible(timeout=60000)
    expect(page.get_by_role('button',name='Làm mới',exact=False)).to_be_visible(timeout=60000)
    return page
   staff=login(selected[0])
   staff.locator('nav').get_by_role('button',name='Phòng học',exact=True).click()
   staff.get_by_role('button',name='Sửa MC01',exact=True).click()
   staff.get_by_label('Sức chứa đã xác nhận',exact=True).fill('220')
   staff.get_by_role('button',name='Lưu phòng',exact=True).click()
   expect(staff.get_by_text('Đã lưu thay đổi.',exact=True)).to_be_visible(timeout=30000)
   assert next(r for r in storage.read(wid)[0].rooms if r.id=='MC01').capacity==220
   staff.get_by_role('button',name='Sửa MC01',exact=True).click()
   staff.get_by_label('Sức chứa đã xác nhận',exact=True).fill('200')
   staff.get_by_role('button',name='Lưu phòng',exact=True).click()
   expect(staff.get_by_text('Đã lưu thay đổi.',exact=True)).to_be_visible(timeout=30000)
   staff.get_by_label('Tìm phòng',exact=True).fill('MT11')
   staff.get_by_role('button',name='Sửa MT11',exact=True).click()
   staff.get_by_label('Sức chứa đã xác nhận',exact=True).wait_for()
   staff.screenshot(path=str(ART/'staff-room-constraints.png'),full_page=True)
   # Return/resubmit the real CNPM assignment through local API and actual UI.
   staff.locator('nav').get_by_role('button',name='Tổng quan',exact=True).click()
   row=staff.locator('.department-row').filter(has_text='CNPM')
   row.get_by_role('button',name='Trả lại để điều chỉnh',exact=True).click()
   row.get_by_role('textbox').fill('Kiểm tra toàn bộ phân công học kỳ và lịch QuyenNV trong bộ giả lập.')
   row.get_by_role('button',name='Gửi phản hồi',exact=True).click()
   expect(staff.get_by_text('Đã gửi yêu cầu điều chỉnh cho bộ môn.',exact=True)).to_be_visible()
   head=login(selected[1])
   head.locator('nav').get_by_role('button',name='Phân công',exact=False).click()
   head.get_by_label('Tìm lớp, môn hoặc giảng viên',exact=True).fill('QuyenNV')
   expect(head.locator('tbody tr')).to_have_count(11)
   head.screenshot(path=str(ART/'head-full-term-assignment.png'),full_page=True)
   head.get_by_role('button',name='Nộp cho giáo vụ',exact=False).click()
   expect(head.get_by_text('Đã nộp phân công cho giáo vụ.',exact=True)).to_be_visible(timeout=30000)
   staff.get_by_role('button',name='Làm mới',exact=False).click()
   staff.locator('nav').get_by_role('button',name='Xếp lịch & công bố',exact=True).click()
   begin=time.perf_counter()
   staff.get_by_role('button',name='Thẩm định & chạy bộ giải',exact=True).click()
   expect(staff.get_by_text('Đã tìm được lịch hợp lệ với phòng cụ thể.',exact=True)).to_be_visible(timeout=300000)
   solve_wall=time.perf_counter()-begin
   solved,revision=storage.read(wid)
   score=evaluate(solved,solved.draft)
   assert score['hard']==0 and len(solved.draft)==290
   (ART/'state-solved.json').write_text(solved.model_dump_json(indent=2))
   (ART/'evaluation.json').write_text(json.dumps(score,ensure_ascii=False,indent=2))
   rows=events(solved,solved.draft)[0]
   assert len({r['id'] for r in rows})==290
   for a,b in combinations(rows,2):
    if not overlap(a,b):continue
    assert a['room_id']!=b['room_id']
    assert a['teacher']!=b['teacher']
    assert not(a['offering']==b['offering'] and a['section']==b['section'] and {a['kind'],b['kind']}=={'LEC','TUT'})
    assert not(a['program']==b['program']=='CLC' and a['cohort']==b['cohort'] and a['section']==b['section'])
   # Every reservation and simulated usage constraint is independently respected.
   rooms={r.id:r for r in solved.rooms}
   for e in rows:
    r=rooms[e['room_id']]
    assert r.capacity>=e['students'] and e['room'] in r.equipment
    assert set(e['required_equipment']).issubset(r.equipment)
    assert not r.allowed_programs or e['program'] in r.allowed_programs
    assert not r.allowed_departments or e['department'] in r.allowed_departments
    assert not r.allowed_courses or e['course'] in r.allowed_courses
    assert not e['required_room_type'] or e['required_room_type']==r.room_type
    assert any(w.day==e['day'] and w.start<=e['start'] and e['end']<=w.end for w in r.availability)
    assert not any(v.room_id==r.id and overlap(e,v.model_dump()) for v in solved.reservations)
   staff.screenshot(path=str(ART/'staff-solved.png'),full_page=False)
   staff.get_by_role('button',name='Công bố lịch',exact=True).click()
   expect(staff.get_by_text('Đã công bố lịch giảng dạy.',exact=True)).to_be_visible(timeout=30000)
   staff.locator('nav').get_by_role('button',name='Lịch học kỳ',exact=True).click()
   expect(staff.locator('.term-event')).to_have_count(290)
   ids=staff.locator('.term-event').evaluate_all('(els)=>els.map(e=>e.dataset.session)')
   assert set(ids)=={s.id for s in solved.sessions}
   staff.screenshot(path=str(ART/'staff-entire-term.png'),full_page=True)
   staff.screenshot(path=str(ART/'staff-entire-term-viewport.png'),full_page=False)
   staff.get_by_label('Giảng viên trong học kỳ',exact=True).select_option('QuyenNV')
   expect(staff.locator('.term-event')).to_have_count(11)
   staff.screenshot(path=str(ART/'staff-quyennv.png'),full_page=True)
   staff.get_by_label('Giảng viên trong học kỳ',exact=True).select_option('')
   # Cover all events in readable per-day screenshots as well as the full-week artifact.
   for day in range(2,8):
    staff.get_by_label('Thứ trong học kỳ',exact=True).select_option(str(day))
    expect(staff.locator('.term-event')).to_have_count(sum(e['day']==day for e in rows))
    staff.screenshot(path=str(ART/f'staff-day-{day}.png'),full_page=True)
   staff.get_by_label('Thứ trong học kỳ',exact=True).select_option('')
   teacher=login(selected[2])
   teacher.locator('nav').get_by_role('button',name='Lịch của tôi',exact=True).click()
   expect(teacher.locator('.calendar-event')).to_have_count(11)
   assert 'QuyenNV' in teacher.locator('.user-profile').inner_text()
   teacher.get_by_role('button',name='Xem toàn bộ khung giờ',exact=True).click()
   teacher.screenshot(path=str(ART/'teacher-quyennv.png'),full_page=True)
   teacher.locator('.personal-calendar').screenshot(path=str(ART/'teacher-quyennv-calendar.png'))
   teacher.get_by_role('button',name='Danh sách',exact=True).click()
   expect(teacher.locator('.agenda-event')).to_have_count(11)
   teacher.screenshot(path=str(ART/'teacher-quyennv-list.png'),full_page=True)
   teacher.set_viewport_size(dict(width=390,height=844))
   assert teacher.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
   teacher.screenshot(path=str(ART/'teacher-quyennv-mobile.png'),full_page=True)
   # Genuine Auth tokens against real local API RBAC.
   for role in ['HEAD','TEACHER']:
    denied=browser.new_context().request.post('http://127.0.0.1:8298/api/commands/rooms',headers={'Authorization':tokens[role]},data={'revision':storage.read(wid)[1],'payload':{'rooms':[]}})
    assert denied.status==403
   res=staff.request.get('http://127.0.0.1:8298/api/export/published',headers={'Authorization':tokens['STAFF']})
   assert res.status==200
   (ART/'Timetable-full-term.xlsx').write_bytes(res.body())
   browser.close()
  assert not errors,errors
  assert not http_errors,http_errors
  final,revision=storage.read(wid)
  (ART/'state-published.json').write_text(final.model_dump_json(indent=2))
  result=dict(status='PASS',auth='Real Supabase Auth, existing demo accounts',api='Real local FastAPI',database='Real isolated PostgreSQL 17 Docker',data='SIMULATED rooms/availability/capability additions; approved plan 67 offerings',sessions=290,placed_sessions=290,published_sessions=len(final.published),hard=score['hard'],soft_total=score['soft_total'],soft=score['soft'],rooms=17,room_counts={'PROJECTOR':6,'COMPUTER':11},teacher='QuyenNV',teacher_sessions=11,teacher_profile='Existing demo Auth user mapped to QuyenNV only in isolated local DB',roles=['STAFF','HEAD','TEACHER'],page_errors=errors,http_errors=http_errors,room_edit_capacity_roundtrip=True,independent_pairwise_checks=True,all_290_events_in_staff_calendar=True,head_return_resubmit=True,rbac_denied_room_edits=['HEAD','TEACHER'],solver_ui_seconds=round(solve_wall,3),revision=revision,workspace_id=str(wid),frontend_url='http://127.0.0.1:3399',hosted_database_mutated=False)
  (ART/'browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  success=True
  if args.keep_serving:
   private=Path('/tmp/schedule-fullterm-runtime.json')
   fd=os.open(private,os.O_CREAT|os.O_TRUNC|os.O_WRONLY,0o600)
   with os.fdopen(fd,'w') as stream:json.dump(dict(container=name,pids=[p.pid for p in processes],database_url=dsn,workspace_id=str(wid)),stream)
  print(json.dumps(result,ensure_ascii=False),flush=True)
 finally:
  if not(success and args.keep_serving):
   for proc in reversed(processes):
    if proc.poll() is None:os.killpg(proc.pid,signal.SIGTERM);proc.wait(timeout=15)
   subprocess.run(['docker','rm','-f',name],capture_output=True)
  for log in logs:log.close()

if __name__=='__main__':main()
