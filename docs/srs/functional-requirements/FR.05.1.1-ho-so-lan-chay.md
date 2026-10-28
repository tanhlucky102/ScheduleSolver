# FR.05.1.1: Lưu hồ sơ lần chạy

## Requirement

**ID:** FR.05.1.1  
**Title:** Lưu hồ sơ lần chạy  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** lưu hồ sơ đầu vào, cấu hình và đầu ra đủ để đối chiếu kết quả của từng lần chạy.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.05.1 | Căn cứ thực nghiệm |
| Customer Problem | CP.05 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Hồ sơ có định danh/phiên bản dữ liệu, nguồn giả lập, seed dữ liệu và solver, phiên bản thuật toán, số worker, chính sách, trọng số, ngân sách và lý do dừng.
- [ ] AC.2: Giữ kết quả cuối, điểm/metric, độ phủ, thời gian và dữ liệu tiến độ; không chỉ lưu ảnh màn hình.
- [ ] AC.3: Báo cáo cho giáo vụ không chứa chi tiết lịch ngoài không được phép; dữ liệu phục vụ chạy lại được giới hạn theo quyền ngữ cảnh.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.05.1.1.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

