# FR.04.1.3: Xem lịch cá nhân gộp

## Requirement

**ID:** FR.04.1.3  
**Title:** Xem lịch cá nhân gộp  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** hiển thị lịch khoa đã công bố và lịch trường khác của GV đang chọn trên cùng trục ngày giờ thực, kèm phát hiện chồng giờ.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.1 | Lịch cá nhân tổng hợp |
| Customer Problem | CP.04 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Buổi có trường, môn, lớp, ngày/giờ và phòng/cơ sở hoặc dấu chưa biết; nguồn giả lập hiển thị rõ.
- [ ] AC.2: Hai buổi 07:10–09:15 và 08:00–10:00 cùng ngày bị báo chồng giờ; hai buổi có điểm kết thúc/bắt đầu bằng nhau không chồng giờ.
- [ ] AC.3: Không dùng số ca giữa hai trường để so trùng; ngày theo khóa và múi giờ được sử dụng để xác định thời điểm.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.04.1.3.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

