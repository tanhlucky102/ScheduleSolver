# NFR.07: Thực nghiệm hiệu năng và chất lượng

## Requirement

**ID:** NFR.07  
**Title:** Thực nghiệm hiệu năng và chất lượng  
**Category:** Performance  
**Priority:** Should Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** báo hiệu năng và chất lượng qua ít nhất mười seed cho mỗi cấu hình thực nghiệm trên kế hoạch đã đối soát, với mục tiêu tìm lịch hợp lệ trong 60 giây trên trường hợp đã có căn cứ khả thi.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.05.1 | Căn cứ thực nghiệm |
| Applies To FRs | FR.03.2.2, FR.03.1.1, FR.05.1.1 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** Mục tiêu 60 giây; so sánh 1/2/4 worker nếu phần cứng cho phép, tối thiểu mười seed mỗi cấu hình.
- **Minimum Acceptable:** Đủ báo cáo tỷ lệ thành công, thời gian, độ phủ và metric; chưa chốt ngưỡng tỷ lệ đạt, không biến 60 giây thành bảo đảm mọi input.
- **Measurement Method:** Ghi CPU/nhân/RAM/JDK, dữ liệu/seed, wall-clock, công tìm kiếm và objective; báo trung bình, độ lệch chuẩn cùng kết quả từng seed.

## Acceptance Criteria

- [ ] AC.1: Quy mô thực là số buổi/GV đã đối soát; kịch bản lịch bận giả lập có seed và nhãn, không lấy 160/30 làm quy mô mặc định.
- [ ] AC.2: Báo cả lần chưa giải đủ; baseline chỉ so trên cùng điều kiện, không khẳng định speedup tuyến tính hoặc tối ưu toàn cục.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

