# FR.02.2.1: Chỉnh sửa và giữ cố định

## Requirement

**ID:** FR.02.2.1  
**Title:** Chỉnh sửa và giữ cố định  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho phép giáo vụ sửa phân công, thêm hoặc bỏ phân công nháp và khóa riêng GV hoặc thời gian trước khi xếp lại.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.02.2 | Kiểm soát hoàn thiện lịch |
| Customer Problem | CP.02 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Đổi giờ hoặc GV làm phát sinh xung đột được báo cùng các buổi liên quan.
- [ ] AC.2: Xếp lại không đổi thuộc tính đã khóa; nếu khóa mâu thuẫn thì báo lỗi, không tự mở khóa.
- [ ] AC.3: Xóa phân công không xóa nhu cầu gốc; buổi đó xuất hiện trong danh sách chưa xếp.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.02.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

