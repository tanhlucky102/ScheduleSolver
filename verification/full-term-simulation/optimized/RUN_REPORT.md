# Full-term scheduling run

Status: SOLVED

- Scope: all 290 sessions from 67 approved offerings.
- Rooms: 17; start windows: 66.
- Assigned: 290; invalid/missing teacher assignments: 0.
- Empty room/time domains: 0.
- Solver result: SOLVED.

## Missing declared capabilities

| Course | Kind | Department | Affected sessions |
|---|---|---|---|

## Interpretation

All 290 sessions have valid placements with zero hard violations on the explicit simulated input. See ../manifest.json for simulated fields. The runner created only a local draft; it did not publish or modify production data.

## Retry with complete confirmed data

From repository root:
    conda run -n ai20k python verification/full_term_readiness.py --state /path/to/confirmed-state.json --iterations 5000

The input must follow backend/app/domain.py State, with confirmed rooms/time windows, eligible teachers assigned to every session, and department status SUBMITTED. The runner saves a local draft on success and does not publish.
