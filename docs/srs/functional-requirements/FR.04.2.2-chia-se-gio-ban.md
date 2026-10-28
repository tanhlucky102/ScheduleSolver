# FR.04.2.2: Phản hồi giờ bận vào xếp lịch

## Requirement

**ID:** FR.04.2.2  
**Title:** Phản hồi giờ bận vào xếp lịch  
**Priority:** Must Have  
**Status:** Draft

### Statement

Hệ thống ScheduleSolver **phải (shall)** đưa các khoảng bận GV đã chia sẻ vào dữ liệu điều kiện cho lần xếp tiếp theo, đồng thời cho GV thu hồi chia sẻ.

## Traceability

| Traces To | ID | Description |
|---|---|---|
| Customer Need | CN.04.2 | Thông tin chia sẻ giới hạn |
| Customer Problem | CP.04 | Xem [Customer Problems](../01-customer-problems.md) |

## Acceptance Criteria

- [ ] AC.1: Buổi ngoài đã chia sẻ chặn đúng khoảng thời gian/ngày xuất hiện; chỉ thông tin trường/ngày/giờ được quản lý xem.
- [ ] AC.2: Thu hồi chia sẻ bỏ điều kiện ở phiên bản input tiếp theo, không xóa lịch riêng và không tự đổi bản công bố.
- [ ] AC.3: Lịch bận thêm hoặc đổi khi đang giải tạo phiên bản dữ liệu mới; kết quả cũ không ghi đè nháp mới mà không đối chiếu.

## Implementation Notes

Chưa triển khai theo đặc tả này. Chi tiết xây dựng thuộc tài liệu thiết kế riêng.

## Test Cases

TC.FR.04.2.2.1–3: ca kiểm thử dự kiến tương ứng từng AC; chưa thực thi.

---
*Created: 26/10/2026*  
*Last Updated: 26/10/2026*  
*Author: Nhóm phân tích ScheduleSolver*

