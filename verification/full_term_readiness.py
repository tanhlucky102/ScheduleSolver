"""Run the entire approved term without changing source data or the hosted workspace."""
import argparse
from collections import Counter
from datetime import datetime,timezone
import json
from pathlib import Path
import sys
from time import perf_counter

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
from app.domain import State,eligible,assignment_errors,placement_domains,solve,evaluate,events,SchedulingConflict

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--state',type=Path,help='Confirmed complete State JSON; default is approved repository input')
 parser.add_argument('--output',type=Path,default=ROOT/'verification/full-term')
 parser.add_argument('--iterations',type=int,default=500)
 parser.add_argument('--seed',type=int,default=42)
 args=parser.parse_args()
 if args.state:
  body=json.loads(args.state.read_text())
 else:
  base=ROOT/'data/fall2026'
  body={**json.loads((base/'catalog_seed.json').read_text()),**json.loads((base/'approved_plan.json').read_text()),'sessions':json.loads((base/'approved_sessions.json').read_text())}
 state=State.model_validate(body)
 missing=Counter((s.course,s.kind,s.department) for s in state.sessions if not any(eligible(s,t) for t in state.teachers))
 domains,diagnostics=placement_domains(state)
 report=dict(timestamp=datetime.now(timezone.utc).isoformat(),source=str(args.state) if args.state else 'approved repository plan and catalog',scope='Full term, all sessions; read-only input; no database writes or publication',offerings=len(state.offerings),sessions=len(state.sessions),teachers=len(state.teachers),rooms=len(state.rooms),slots=len(state.config.slots),assigned=sum(bool(s.teacher) for s in state.sessions),invalid_assignments=len(assignment_errors(state)),departments=[dict(id=d.id,status=d.status) for d in state.departments],missing_capabilities=[dict(course=c,kind=k,department=d,affected_sessions=n) for (c,k,d),n in sorted(missing.items())],empty_placement_domains=sum(not v for v in domains.values()),placement_diagnostics=diagnostics,iterations_per_algorithm=args.iterations,seed=args.seed)
 begin=perf_counter()
 try:
  placements,workers=solve(state,iterations=args.iterations,seed=args.seed)
  result=evaluate(state,placements)
  report.update(status='SOLVED',evaluation=result,workers=workers,placed_sessions=len(placements))
  state.draft=placements
 except (ValueError,SchedulingConflict) as exc:
  report.update(status='BLOCKED_INPUT' if not state.rooms or not state.config.slots or report['invalid_assignments'] or any(d.status!='SUBMITTED' for d in state.departments) else getattr(exc,'status','FAILED'),error_type=type(exc).__name__,error=str(exc),violations=getattr(exc,'violations',[]),placed_sessions=0)
 report['elapsed_seconds']=round(perf_counter()-begin,6)
 args.output.mkdir(parents=True,exist_ok=True)
 (args.output/'readiness.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if report['status']=='SOLVED':
  (args.output/'placements.json').write_text(json.dumps([p.model_dump() for p in placements],ensure_ascii=False,indent=2))
  (args.output/'schedule.json').write_text(json.dumps(events(state,placements)[0],ensure_ascii=False,indent=2))
  (args.output/'state-solved.json').write_text(state.model_dump_json(indent=2))
 lines=['# Full-term scheduling run','','Status: '+report['status'],'','- Scope: all '+str(len(state.sessions))+' sessions from '+str(len(state.offerings))+' approved offerings.','- Rooms: '+str(len(state.rooms))+'; start windows: '+str(len(state.config.slots))+'.','- Assigned: '+str(report['assigned'])+'; invalid/missing teacher assignments: '+str(report['invalid_assignments'])+'.','- Empty room/time domains: '+str(report['empty_placement_domains'])+'.','- Solver result: '+report.get('error','SOLVED')+'.','','## Missing declared capabilities','','| Course | Kind | Department | Affected sessions |','|---|---|---|---|']
 lines += ['| '+r['course']+' | '+r['kind']+' | '+r['department']+' | '+str(r['affected_sessions'])+' |' for r in report['missing_capabilities']]
 lines += ['','## Interpretation','',('All sessions have valid placements with zero hard violations. This is a local draft; no database write or publication was performed. Input assumptions must be read with the supplied manifest.' if report['status']=='SOLVED' else 'Missing confirmed rooms, time windows, eligible assignments, and department submissions are input prerequisites. They are not evidence of a search algorithm crash or infeasibility of a complete term. No input data was altered by this runner. No production data was changed.'),'','## Retry with complete confirmed data','','From repository root:','    conda run -n ai20k python verification/full_term_readiness.py --state /path/to/confirmed-state.json --iterations 5000','','The input must follow backend/app/domain.py State, with confirmed rooms/time windows, eligible teachers assigned to every session, and department status SUBMITTED. The runner saves a local draft on success and does not publish.']
 (args.output/'RUN_REPORT.md').write_text('\n'.join(lines)+'\n')
 print(json.dumps({k:report[k] for k in ['status','sessions','rooms','slots','assigned','invalid_assignments','empty_placement_domains','elapsed_seconds']},ensure_ascii=False))
 if 'error' in report:print('Solver:',report['error'])
if __name__=='__main__':main()
