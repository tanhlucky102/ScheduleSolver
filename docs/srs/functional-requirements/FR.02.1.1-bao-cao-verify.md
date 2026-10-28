# FR.02.1.1: Báo cáo Verify

## Requirement

**ID:** FR.02.1.1  
**Title:** Báo cáo Verify  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** đánh giá phương án theo từng tiêu chí Verify và các điều kiện cứng áp dụng, nêu đối tượng, thời gian và mức độ của từng vấn đề.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.02.1 | Căn cứ Verify |
| Customer Problem | CP.02 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Phát hiện trùng GV và Lecture/Tutorial cùng môn cùng khóa khi tuần hoạt động giao nhau; tuần không giao nhau không bị báo trùng.
- [ ] AC.2: Đối chiếu đúng tập buổi kế hoạch để báo thiếu, trùng hoặc ngoài kế hoạch; trùng chéo môn cùng khóa là cảnh báo khi chưa có quan hệ cấm trùng được xác nhận.
- [ ] AC.3: Mọi tiêu chí có trạng thái đạt, vi phạm hoặc chưa đủ dữ liệu, không mặc định đạt khi thiếu căn cứ.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.02.1.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

