# FR.01.1.1: Tạo phương án từ kế hoạch

## Requirement

**ID:** FR.01.1.1  
**Title:** Tạo phương án từ kế hoạch  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** tạo phương án phân công GV và ngày/ca cho các buổi trong kế hoạch đã đối soát, theo điều kiện đầu vào và ngân sách chạy.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.01.1 | Phương án TKB |
| Customer Problem | CP.01 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Mỗi phân công tham chiếu buổi có thật và GV trong tập đủ điều kiện; không sinh thêm buổi để làm đầy lịch.
- [ ] AC.2: Buổi bốn tiết được bố trí đủ hai ca liền trong cùng shift; buổi chưa xếp được giữ trong danh sách chưa đáp ứng.
- [ ] AC.3: Khóa giờ/GV và giờ bận được dùng như điều kiện cứng; nếu còn vi phạm thì kết quả không được gắn nhãn hợp lệ.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.01.1.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

