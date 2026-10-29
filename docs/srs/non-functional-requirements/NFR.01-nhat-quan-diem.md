# NFR.01: Đúng và nhất quán đánh giá

## Requirement

**ID:** NFR.01  
**Title:** Đúng và nhất quán đánh giá  
**Category:** Reliability  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** cho kết quả Verify, điểm và metric nhất quán giữa phương án hiển thị, bản lưu và báo cáo của cùng phiên bản.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.03.1 | Chất lượng và đánh đổi |
| Applies To FRs | FR.02.1.1, FR.03.1.1, FR.03.2.1 | Các hành vi chịu điều kiện chất lượng này |

## Measurement Criteria

- **Target:** Không có sai khác trên bộ nghiệm thu; nếu dùng điểm tăng dần, tối thiểu 10.000 thay đổi hợp lệ được đối chiếu độc lập.
- **Minimum Acceptable:** 0 sai khác chưa giải thích được trước nghiệm thu.
- **Measurement Method:** So sánh kiểm tra toàn phần độc lập; kiểm tra thay đổi/hoàn tác và lưu/xuất.

## Acceptance Criteria

- [ ] AC.1: Nếu triển khai scoring tăng dần, ít nhất 10.000 move ngẫu nhiên và undo không làm sai điểm so với tính toàn phần.
- [ ] AC.2: Nhập/xuất hoặc mở lại cùng lịch không đổi độ phủ, điểm hoặc metric; các tuần rời rạc và nhiều buổi cùng ca được kiểm tra.

## Implementation Notes

Chưa đo trên phần mềm theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*

