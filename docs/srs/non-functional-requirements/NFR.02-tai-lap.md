# NFR.02: Tái lập kết quả

## Requirement

**ID:** NFR.02  
**Title:** Tái lập kết quả  
**Category:** Reliability  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** tạo cùng phân công chuẩn hóa, điểm và metric trong ít nhất ba lần chạy chế độ tái lập với cùng input, seed, phiên bản và cấu hình.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.05.1 | Căn cứ thực nghiệm |
| Applies To FRs | FR.05.1.1, FR.05.1.2 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** 100% giống nhau trên ba lần chạy cho mỗi cấu hình nghiệm thu một và nhiều worker.
- **Minimum Acceptable:** Không có lần khác biệt trong cùng cấu hình tái lập; không yêu cầu kết quả giữa 1 và 4 worker giống nhau.
- **Measurement Method:** Đối chiếu biểu diễn chuẩn hóa và điểm trên tối thiểu ba lần chạy cho mỗi cấu hình.

## Acceptance Criteria

- [ ] AC.1: Một cấu hình một worker và một cấu hình nhiều worker mỗi loại chạy lại ba lần cho kết quả đồng nhất trong loại đó.
- [ ] AC.2: Đổi seed hoặc phiên bản được ghi là thay điều kiện; chạy dừng theo đồng hồ không bị gắn nhãn tái lập chỉ nhờ seed.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

