# FR.04.2.1: Vai trò demo và giới hạn thông tin

## Requirement

**ID:** FR.04.2.1  
**Title:** Vai trò demo và giới hạn thông tin  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** giới hạn nội dung lịch theo vai trò và mã GV được chọn trong demo, ở cả màn hình, tìm kiếm và tệp xuất.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.2 | Thông tin chia sẻ giới hạn |
| Customer Problem | CP.04 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: GV A chỉ xem chi tiết lịch riêng A; chuyển sang giáo vụ/trưởng khoa chỉ còn tên trường, ngày và khung bận gắn với danh tính GV cần phối hợp.
- [ ] AC.2: Môn, lớp, phòng, địa chỉ và ghi chú lịch ngoài không xuất hiện trong báo cáo hoặc chẩn đoán dành cho quản lý.
- [x] AC.3 (cập nhật 28/10/2026, DEC.24): Người dùng đăng nhập bằng tài khoản theo vai trò; tài khoản giảng viên chỉ xem lịch và lịch bận của chính mình; đăng xuất thì màn hình của vai trò trước bị ẩn.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.04.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

