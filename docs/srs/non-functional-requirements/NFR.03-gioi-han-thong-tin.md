# NFR.03: Giới hạn thông tin theo vai trò demo

## Requirement

**ID:** NFR.03  
**Title:** Giới hạn thông tin theo vai trò demo  
**Category:** Security  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** không cung cấp trường chi tiết lịch ngoài không được phép trong bất kỳ màn hình hoặc tệp xuất dành cho giáo vụ, trưởng khoa hay GV khác.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.2 | Thông tin chia sẻ giới hạn |
| Applies To FRs | FR.04.2.1, FR.04.2.2, FR.02.3.1, FR.05.1.1 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** 0 trường cấm bị lộ trong ma trận kiểm tra vai trò và kênh xuất.
- **Minimum Acceptable:** 0 trường cấm bị lộ trong phạm vi giao diện ứng dụng và xuất được hỗ trợ.
- **Measurement Method:** Dùng dữ liệu đánh dấu riêng trong môn/lớp/phòng/địa chỉ/ghi chú và rà mọi đường xem, lọc, chẩn đoán, xuất.

## Acceptance Criteria

- [ ] AC.1: Giáo vụ/trưởng khoa chỉ thấy GV, trường, ngày, khung bận; dữ liệu đánh dấu chi tiết riêng không xuất hiện trong báo cáo hay thông báo lỗi.
- [ ] AC.2: Chuyển ngữ cảnh A → giáo vụ → B không giữ nội dung riêng A; kiểm thử không coi lựa chọn vai trò là chống truy cập tệp trực tiếp.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

