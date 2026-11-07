# Full-term scheduling run

Status: BLOCKED_INPUT

- Scope: all 290 sessions from 67 approved offerings.
- Rooms: 0; start windows: 0.
- Assigned: 0; invalid/missing teacher assignments: 290.
- Empty room/time domains: 290.
- Solver result: All departments must submit.

## Missing declared capabilities

| Course | Kind | Department | Affected sessions |
|---|---|---|---|
| 61FIT3DSY | LEC | KHMT | 1 |
| 61FIT3DSY | TUT | KHMT | 3 |
| 61MME3WDE | LEC | TTDPT | 1 |
| 62FIT4EBU | LEC | HTTT | 3 |
| 62FIT4EBU | TUT | HTTT | 3 |
| 66FIT2RES | LEC | HTTT | 3 |
| 66FIT3SS1 | COMBINED | CNPM | 3 |

## Interpretation

Missing confirmed rooms, time windows, eligible assignments, and department submissions are input prerequisites. They are not evidence of a search algorithm crash or infeasibility of a complete term. No capabilities, rooms, assignments, or approval states were fabricated. No production data was changed.

## Retry with complete confirmed data

From repository root:
    conda run -n ai20k python verification/full_term_readiness.py --state /path/to/confirmed-state.json --iterations 5000

The input must follow backend/app/domain.py State, with confirmed rooms/time windows, eligible teachers assigned to every session, and department status SUBMITTED. The runner saves a local draft on success and does not publish.

## Regression check

Backend suite rerun: 43 passed in 5.42s. No production code change was needed for the input prerequisite rejection. Source is a read-only snapshot of the existing demo workspace at revision 0.
