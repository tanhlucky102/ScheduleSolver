# NFR.05: Phản hồi khi chạy tác vụ dài

## Requirement

**ID:** NFR.05  
**Title:** Phản hồi khi chạy tác vụ dài  
**Category:** Usability  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** giữ giao diện tương tác được trong khi giải hoặc xử lý tệp, với mục tiêu phản hồi lệnh giao diện trong một giây và xác nhận yêu cầu dừng trong hai giây trên máy nghiệm thu.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.02.2 | Kiểm soát hoàn thiện lịch |
| Applies To FRs | FR.03.2.2, FR.02.3.1, FR.06.1.1 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** Phản hồi giao diện ≤1 giây; ghi nhận yêu cầu dừng ≤2 giây. Đây là ngưỡng đề xuất ở trạng thái Draft, chưa phải số đo đã đạt.
- **Minimum Acceptable:** Không treo giao diện; các ngưỡng định lượng cần được người nghiệm thu chốt trước khi làm baseline.
- **Measurement Method:** Đo thao tác cuộn/chuyển vùng nhìn/bấm dừng trong lúc tác vụ dài chạy trên kế hoạch đã đối soát.

## Acceptance Criteria

- [ ] AC.1: Khi giải, nhập hoặc xuất, thao tác cuộn và xem tiến độ vẫn được xử lý; các mẫu đo có thời gian và cấu hình máy.
- [ ] AC.2: Bấm dừng được ghi nhận riêng với thời điểm worker dừng xong; kết quả tốt nhất đã có không mất.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

