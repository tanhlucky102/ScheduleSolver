# FR.03.2.1: Xếp hạng phương án theo objective

## Requirement

**ID:** FR.03.2.1  
**Title:** Xếp hạng phương án theo objective  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** xếp hạng phương án theo mức vi phạm cứng trước, tổng phạt mềm theo metric và trọng số hiện có sau, với quy tắc phá hòa công khai.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.03.2 | Phương án cải thiện |
| Customer Problem | CP.03 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Lịch không có lỗi cứng luôn tốt hơn lịch có lỗi cứng dù điểm mềm cao hơn; buổi thiếu được tính vào phần cứng.
- [ ] AC.2: Giữ S1=10, S2=15, S3=5, S4=20, S10=6 và các trọng số còn lại của nguồn mô tả; không ngầm tạo trọng số trùng chéo mới.
- [ ] AC.3: Khi phần cứng và điểm mềm bằng nhau, ưu tiên ít trùng chéo môn hơn; điểm và báo cáo phải giải thích được quyết định.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.03.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

