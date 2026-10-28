# FR.05.2.1: Xử lý input mới theo cùng hợp đồng

## Requirement

**ID:** FR.05.2.1  
**Title:** Xử lý input mới theo cùng hợp đồng  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** xử lý kế hoạch và điều kiện mới theo cùng quy tắc tạo TKB và báo cáo mà không mã hóa sẵn phân công của workbook mẫu.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.05.2 | Kế hoạch mới |
| Customer Problem | CP.05 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Đổi mã môn/chương trình hoặc thêm buổi hợp lệ cập nhật đúng tập nhu cầu và output; không lọc bỏ chỉ vì không thuộc FIT.
- [ ] AC.2: Input mới có mâu thuẫn được báo tương ứng; hết ngân sách không tự kết luận không có lời giải.
- [ ] AC.3: Kiểm chứng trên một input mới có lời giải tham chiếu khả thi và một input cố ý mâu thuẫn; không yêu cầu trùng từng ô với TKB thủ công.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.05.2.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

