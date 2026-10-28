# FR.01.2.1: Kết quả và phần chưa giải

## Requirement

**ID:** FR.01.2.1  
**Title:** Kết quả và phần chưa giải  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** trả phương án tốt nhất đã ghi nhận cùng các buổi chưa xếp, vi phạm và lý do kết thúc khi hoàn tất hoặc dừng tìm kiếm.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.01.2 | Phần chưa đáp ứng |
| Customer Problem | CP.01 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Hết ngân sách vẫn nhận được phương án đã có, số buổi thiếu và danh sách mã buổi tương ứng.
- [ ] AC.2: Phân biệt dữ liệu không hợp lệ, mâu thuẫn có chứng cứ, chưa tìm thấy lịch hợp lệ và đã có lịch hợp lệ; không suy ra bất khả thi chỉ vì hết giờ.
- [ ] AC.3: Giáo vụ có thể nhận phương án thiếu để chỉnh sửa mà không tự công bố.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.01.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

