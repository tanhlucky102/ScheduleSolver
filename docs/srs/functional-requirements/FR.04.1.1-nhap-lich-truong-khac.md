# FR.04.1.1: Nhập tay lịch bận ở nơi khác

## Requirement

**ID:** FR.04.1.1  
**Title:** Nhập tay lịch bận ở nơi khác  
**Priority:** Must Have  
**Status:** Implemented (28/10/2026)

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho phép GV thêm và xóa lịch bận của chính mình ở trường khác hoặc việc khác, gồm: thứ, ca bắt đầu, ca kết thúc, nơi bận và ghi chú riêng.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.1 | Lịch cá nhân tổng hợp |
| Customer Problem | CP.04 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [x] AC.1: Bắt buộc GV, thứ (2–7), ca bắt đầu ≤ ca kết thúc và nơi bận; từ chối nếu thiếu hoặc sai.
- [x] AC.2: Ghi chú riêng (môn, lớp ở trường khác...) chỉ hiện ở màn hình của chính GV đó; giáo vụ chỉ thấy GV, thứ, ca và nơi bận.
- [x] AC.3: GV đang chọn chỉ thêm/xóa lịch bận của mình; nhập tay là đủ cho demo, không cần ICS.

## Implementation Notes

`model/BusySlot`, `ui/TeacherPanel` (tab "Lịch bận cố định"), `ui/StaffPanel` (tab "Lịch bận giảng viên chia sẻ" không có cột ghi chú). Lưu trong file dự án và CSV `lich_ban.csv`.

## Test Cases

`FileIoTest.teachersRulesAndBusySlotsRoundTripThroughCsv`, `FileIoTest.badCsvLineReportsLineNumber`, `ScoreCalculatorTest.busySlotOfTeacherIsHard`.

---
*Created: 26/10/2026*  
*Last Updated: 28/10/2026 — đổi theo quyết định DEC.19 (lịch bận cố định cả kỳ)*  
*Author: Nhóm phân tích ScheduleSolver*
