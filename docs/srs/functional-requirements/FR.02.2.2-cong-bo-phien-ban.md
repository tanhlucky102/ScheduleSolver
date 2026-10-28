# FR.02.2.2: Công bố phiên bản độc lập

## Requirement

**ID:** FR.02.2.2  
**Title:** Công bố phiên bản độc lập  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho phép giáo vụ công bố một phiên bản đầy đủ không còn lỗi cứng theo dữ liệu và chính sách đã xác nhận.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.02.2 | Kiểm soát hoàn thiện lịch |
| Customer Problem | CP.02 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Lịch thiếu buổi hoặc còn lỗi cứng không được công bố như lịch hoàn chỉnh; vẫn được nhận, sửa và xuất nháp có nhãn.
- [ ] AC.2: Sửa nháp hoặc thêm giờ bận sau công bố không âm thầm sửa bản GV đang xem; có cảnh báo nếu giờ bận mới trùng bản công bố.
- [ ] AC.3: Lỗi khi ghi bản công bố không để lại phiên bản công bố dở dang; cảnh báo trùng chéo mềm vẫn được trình để giáo vụ quyết định.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.02.2.2.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

