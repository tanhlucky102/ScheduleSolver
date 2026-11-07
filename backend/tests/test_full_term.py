"""Regression for the approved 290-session term and independent conflict counting."""
from collections import Counter
from itertools import combinations
from pathlib import Path
import random
from app.domain import State,Placement,evaluate,events,solve,overlap,assignment_errors
from test_domain import ready

def test_approved_term_with_17_source_count_rooms():
    source=Path(__file__).resolve().parents[2]/'verification/full-term-simulation/input-state.json'
    state=State.model_validate_json(source.read_text())
    before=state.model_dump()
    placements,runs=solve(state,iterations=2,seed=42)
    assert state.model_dump()==before
    assert len(placements)==290
    assert Counter(r.equipment[0] for r in state.rooms)=={'PROJECTOR':6,'COMPUTER':11}
    assert not assignment_errors(state)
    assert evaluate(state,placements)['hard']==0
    rows,errors=events(state,placements)
    assert not errors and len({r['id'] for r in rows})==290
    assert sum(r['teacher']=='QuyenNV' for r in rows)==11
    assert all(r['initialization']=='constrained_greedy' for r in runs)
    for a,b in combinations(rows,2):
        if a['day']!=b['day'] or a['start']>=b['end'] or b['start']>=a['end']:
            continue
        assert a['room_id']!=b['room_id']
        assert a['teacher']!=b['teacher']
        assert not(a['offering']==b['offering'] and a['section']==b['section'] and {a['kind'],b['kind']}=={'LEC','TUT'})
        assert not(a['program']==b['program']=='CLC' and a['cohort']==b['cohort'] and a['section']==b['section'])

def test_day_partition_scoring_matches_independent_pairwise_oracle():
    state=ready(401)
    # All rows have legal room/time; only pairwise hard constraints can fail.
    for s in state.sessions:s.program='CLC'
    rng=random.Random(881)
    for _ in range(20):
        placements=[Placement(session=s.id,room_id='R1',slot=rng.randrange(len(state.config.slots))) for s in state.sessions]
        rows,errors=events(state,placements)
        assert not errors
        hard=0
        for a,b in combinations(rows,2):
            if a['day']!=b['day'] or a['start']>=b['end'] or b['start']>=a['end']:continue
            hard+=a['room_id']==b['room_id']
            hard+=a['teacher']==b['teacher']
            hard+=a['offering']==b['offering'] and a['section']==b['section'] and {a['kind'],b['kind']}=={'LEC','TUT'}
            hard+=a['program']==b['program']=='CLC' and a['cohort']==b['cohort'] and a['section']==b['section']
        assert evaluate(state,placements)['hard']==hard
