# FR.04.1.2: Lịch bận cố định cho cả học kỳ

## Requirement

**ID:** FR.04.1.2  
**Title:** Lịch bận cố định cho cả học kỳ  
**Priority:** Must Have  
**Status:** Implemented (28/10/2026)

### Statement

Hệ thống ScheduleSolver **phải (shall)** coi mỗi lịch bận của GV là cố định, lặp lại mọi tuần trong học kỳ; GV **không** chọn tuần bận, ngày hiệu lực hay ngày ngoại lệ.

> Thay đổi so với bản Draft 26/10: bỏ lặp theo khoảng ngày và ngày nghỉ ngoại lệ, theo yêu cầu chốt của nhóm ngày 28/10/2026 (DEC.19). Lý do: TKB của khoa cũng là lịch tuần cố định cho cả kỳ, nên lịch bận cùng dạng giúp giảng viên khai báo nhanh, giáo vụ và bộ giải xử lý đơn giản.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.1 | Lịch cá nhân tổng hợp |
| Customer Problem | CP.04 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [x] AC.1: Form khai báo chỉ có thứ, từ ca, đến ca, nơi bận, ghi chú; không có ô chọn tuần.
- [x] AC.2: Lịch bận chặn mọi buổi dạy trùng thứ và ca trong cả học kỳ (ràng buộc cứng H3 khi xếp lịch).
- [x] AC.3: Nếu GV khai báo bận sau khi lịch đã công bố, màn hình GV báo buổi bị trùng để GV liên hệ giáo vụ xếp lại; lịch đã công bố không tự đổi.

## Implementation Notes

`model/BusySlot` (không có trường tuần), `solver/Problem.getBusyMask`, `service/PersonalSchedule.findConflicts`.

## Test Cases

`ScheduleServiceTest.solvePublishAndTeacherBusyTimeFlowBack`, `ScheduleServiceTest.personalScheduleShowsConflictWithLaterBusySlot`.

---
*Created: 26/10/2026*  
*Last Updated: 28/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*
