# FR.06.2.1: Tạo phiên bản kế hoạch đối soát

## Requirement

**ID:** FR.06.2.1  
**Title:** Tạo phiên bản kế hoạch đối soát  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho trưởng khoa và giáo vụ xác nhận dữ liệu để tạo phiên bản kế hoạch có các buổi, GV đủ điều kiện và lịch thời gian rõ nghĩa.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.06.2 | Kế hoạch có thể sử dụng |
| Customer Problem | CP.06 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Mỗi buổi có ID duy nhất, môn/chương trình/khóa/nhóm, loại Lec/Tut/gộp, sĩ số, thời lượng, tuần và tập GV hợp lệ; không đồng nhất dòng Excel với buổi.
- [ ] AC.2: Danh tính được xác nhận và ngày bắt đầu/bảng ca được cấu hình theo khóa; không hardcode một ngày đầu kỳ.
- [ ] AC.3: Thay đổi kế hoạch tạo phiên bản để đối chiếu; dữ liệu chưa đủ cho một điều kiện kiểm tra phải được báo, không tự đánh dấu đủ.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.06.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

