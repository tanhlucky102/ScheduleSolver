# FR.06.1.1: Nhập kế hoạch và chẩn đoán nguồn

## Requirement

**ID:** FR.06.1.1  
**Title:** Nhập kế hoạch và chẩn đoán nguồn  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** đọc kế hoạch mở lớp và báo thiếu, trùng, mơ hồ hoặc lỗi dữ liệu kèm vị trí nguồn trước khi đưa vào xếp lịch.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.06.1 | Dữ liệu cần đối soát |
| Customer Problem | CP.06 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Tên sheet được trim, cột được ánh xạ theo header; đổi thứ tự cột vẫn cho dữ liệu tương đương và header trùng phải báo mơ hồ.
- [ ] AC.2: Thiếu mã GV hoặc tên viết tắt chưa rõ không được tự tạo danh tính; dòng lỗi vẫn được giữ trong báo cáo.
- [ ] AC.3: Không tự cộng các sheet cập nhật thành kế hoạch mới; giữ mã FIT/MME/66FIT, tuần rời rạc và nguồn giả lập để đối soát.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.06.1.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

