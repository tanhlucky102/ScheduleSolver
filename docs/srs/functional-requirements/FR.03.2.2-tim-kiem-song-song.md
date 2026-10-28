# FR.03.2.2: Tìm kiếm song song và điều khiển chạy

## Requirement

**ID:** FR.03.2.2  
**Title:** Tìm kiếm song song và điều khiển chạy  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho phép giáo vụ cấu hình và chạy tìm kiếm bằng nhiều worker, theo dõi kết quả tốt nhất và yêu cầu dừng.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.03.2 | Phương án cải thiện |
| Customer Problem | CP.03 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Có chế độ một worker và từ hai worker trở lên, ghi được tiến độ của từng worker và kết quả chung; không chỉ tuần tự chạy các thuật toán rồi gọi là song song.
- [ ] AC.2: Kết quả tốt nhất chung không bị thay bằng phương án kém hơn và không bị chỉnh sửa theo trạng thái đang thay đổi của worker.
- [ ] AC.3: Yêu cầu dừng trả kết quả đã ghi nhận, không tự công bố; Local Search, Simulated Annealing và Tabu Search được giữ là các hướng thuật toán đề xuất, không mặc định tất cả đã triển khai.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.03.2.2.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

