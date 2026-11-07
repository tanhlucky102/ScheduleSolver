from pathlib import Path
import sys,json,csv
from collections import Counter
sys.path.insert(0,str(Path('backend').resolve()))
from app.domain import State,Room,Slot,Config,Reservation,eligible
from app.auth import Principal
from app.main import apply
base=Path('data/fall2026')
s=State.model_validate({**json.loads((base/'catalog_seed.json').read_text()),**json.loads((base/'approved_plan.json').read_text()),'sessions':json.loads((base/'approved_sessions.json').read_text())})
staff=Principal(id='00000000-0000-0000-0000-000000000001',workspace_id='00000000-0000-0000-0000-000000000010',role='STAFF')
starts=[420,480,540,600,780,840,900,960,1020,1080,1140]
slots=[Slot(day=d,start=m,end=720 if m<720 else 1320,evening=m>=1080) for d in range(2,8) for m in starts]
apply(s,'config',dict(period_minutes=50,break_minutes=10,max_periods=8,slots=[x.model_dump() for x in slots],soft_weights=dict(restricted=10,single_class=1,overload=5,gaps_minutes=1)),staff)
availability=[Slot(day=d,start=a,end=b) for d in range(2,8) for a,b in [(420,720),(780,1320)]]
counts=list(csv.DictReader(Path('resources/so_phong.csv').open(encoding='utf-8-sig')))
rooms=[]
for row in counts:
 equipment='PROJECTOR' if row['tinh_chat_phong']=='Phòng máy chiếu' else 'COMPUTER'
 for i in range(int(row['so_phong'])):
  rooms.append(Room(id=('MC' if equipment=='PROJECTOR' else 'MT')+str(i+1).zfill(2),name=('Máy chiếu' if equipment=='PROJECTOR' else 'Máy tính')+' '+str(i+1).zfill(2)+' (giả lập)',capacity=200 if equipment=='PROJECTOR' else (48 if i<3 else 40),room_type='LECTURE' if equipment=='PROJECTOR' else 'LAB',equipment=[equipment],availability=availability,allowed_programs=['CLC','TT'] if equipment=='COMPUTER' and i==10 else [],note='Giả lập mã/sức chứa/khả dụng; số lượng từ resources/so_phong.csv. Giáo vụ có thể chỉnh.'))
apply(s,'rooms',dict(rooms=[r.model_dump() for r in rooms]),staff)
apply(s,'reservation',dict(id='DEMO-MC01-MON',room_id='MC01',day=2,start=420,end=600,reason='Giả lập họp khoa - giáo vụ có thể giải phóng'),staff)
apply(s,'reservation',dict(id='DEMO-MT01-TUE',room_id='MT01',day=3,start=780,end=960,reason='Giả lập bảo trì - giáo vụ có thể giải phóng'),staff)
heads={r['ma_bm']:r['truong_bo_mon'] for r in csv.DictReader(Path('resources/bo_mon.csv').open(encoding='utf-8-sig'))}
changes=[]
for d in s.departments:
 apply(s,'send',dict(department=d.id),staff)
 p=Principal(id='00000000-0000-0000-0000-000000000002',workspace_id=staff.workspace_id,role='HEAD',department=d.id,teacher=heads[d.id])
 for x in s.sessions:
  if x.department!=d.id or any(eligible(x,t) for t in s.teachers):continue
  t=next(t for t in s.teachers if t.id==heads[d.id])
  before=list(t.capabilities.get(x.course,[]))
  after=sorted(set(before+(['LEC','TUT'] if x.kind=='COMBINED' else [x.kind])))
  caps=dict(t.capabilities);caps[x.course]=after
  apply(s,'teacher',dict(department=d.id,teacher=t.id,assistant=t.assistant,capabilities=caps),p)
  changes.append(dict(teacher=t.id,department=d.id,course=x.course,kind=x.kind,before=before,after=after,source='SIMULATED for isolated full-term test; not confirmed teacher qualification'))
 apply(s,'balance',dict(department=d.id),p)
 apply(s,'submit',dict(department=d.id),p)
out=Path('verification/full-term-simulation');out.mkdir(exist_ok=True)
(out/'input-state.json').write_text(s.model_dump_json(indent=2))
manifest=dict(mode='SIMULATED_FULL_TERM',source_plan='data/fall2026/approved_plan.json',offerings=len(s.offerings),sessions=len(s.sessions),room_source='resources/so_phong.csv',room_counts=dict(Counter(x.equipment[0] for x in s.rooms)),simulated_fields=['room IDs, capacities, availability, room type','time windows and reservations','7 missing course/kind capabilities on department heads','balanced assignments and submission workflow'],capability_changes=changes,teacher='QuyenNV',teacher_sessions=sum(x.teacher=='QuyenNV' for x in s.sessions),room_capacity_by_type={k:sorted({r.capacity for r in s.rooms if k in r.equipment}) for k in ['PROJECTOR','COMPUTER']},hosted_data_mutations=False)
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False))
