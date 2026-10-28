# NFR.06: An toàn kết quả song song

## Requirement

**ID:** NFR.06  
**Title:** An toàn kết quả song song  
**Category:** Reliability  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** giữ kết quả tốt nhất nhất quán và không bị sửa ngược bởi worker khi ít nhất hai worker tìm kiếm đồng thời.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.03.2 | Phương án cải thiện |
| Applies To FRs | FR.03.2.2, FR.05.1.2 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** 0 kết quả bị trộn phiên bản hoặc ghi đè bởi phương án kém hơn trong tối thiểu 1.000 lần đề nghị kết quả cạnh tranh.
- **Minimum Acceptable:** 0 snapshot bị biến đổi sau công bố cho bộ điều phối.
- **Measurement Method:** Stress test nhiều worker, đối chiếu điểm tính lại và lịch sử cải thiện; ghi nhận khoảng hoạt động chồng nhau.

## Acceptance Criteria

- [ ] AC.1: Tối thiểu hai worker thực sự hoạt động trong khoảng thời gian giao nhau; không dùng thực thi tuần tự để thay bằng chứng concurrency.
- [ ] AC.2: Qua ít nhất 1.000 đề nghị cạnh tranh, best không xấu đi theo objective và điểm của snapshot luôn khớp tính lại.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

