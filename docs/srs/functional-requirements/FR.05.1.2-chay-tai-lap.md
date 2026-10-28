# FR.05.1.2: Chạy tái lập xác định

## Requirement

**ID:** FR.05.1.2  
**Title:** Chạy tái lập xác định  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cung cấp chế độ chạy tái lập cho cùng input chuẩn hóa, phiên bản thuật toán, cấu hình và seed.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.05.1 | Căn cứ thực nghiệm |
| Customer Problem | CP.05 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Lặp lại ít nhất ba lần với cùng điều kiện cho cùng tập phân công chuẩn hóa, điểm và metric, kể cả cấu hình nhiều worker của chế độ tái lập.
- [ ] AC.2: Phá hòa giữa phương án bằng điểm không phụ thuộc thứ tự kết thúc ngẫu nhiên; thông tin ngân sách và chế độ được ghi vào hồ sơ.
- [ ] AC.3: Chạy theo giới hạn thời gian thực được nhận diện riêng, không hứa kết quả giống tuyệt đối chỉ nhờ cùng seed.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.05.1.2.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

