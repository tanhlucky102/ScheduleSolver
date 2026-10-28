# NFR.04: Toàn vẹn lưu và công bố

## Requirement

**ID:** NFR.04  
**Title:** Toàn vẹn lưu và công bố  
**Category:** Reliability  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** giữ dữ liệu hợp lệ trước đó hoặc bản mới hoàn chỉnh khi lưu hoặc công bố gặp lỗi, không để bản công bố dở dang.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.02.2 | Kiểm soát hoàn thiện lịch |
| Applies To FRs | FR.02.2.2, FR.06.2.2 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** 0 trạng thái công bố một phần trong các ca tiêm lỗi tại mỗi bước ghi.
- **Minimum Acceptable:** Bản hợp lệ trước đó đọc lại được; không thay snapshot công bố khi chỉ sửa nháp.
- **Measurement Method:** Tiêm lỗi I/O và lưu trữ, khởi động lại, đối chiếu dữ liệu nghiệp vụ.

## Acceptance Criteria

- [ ] AC.1: Gián đoạn giữa lần ghi công bố không làm GV nhận một phần bản mới.
- [ ] AC.2: Lưu/mở giữ nguyên tập tuần, ngoại lệ, khóa và phiên bản; lỗi giữa quá trình ghi vẫn mở được bản hợp lệ trước đó.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

