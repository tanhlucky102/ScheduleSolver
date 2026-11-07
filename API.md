# API contract

OpenAPI sống ở /docs và /openapi.json của backend. Mọi API /api/* cần Authorization: Bearer <Supabase access token>. /health không yêu cầu token.

GET /api/me trả profile được backend đọc từ Postgres. GET /api/workspace trả revision, has_publication và dữ liệu được lọc theo vai trò. Workspace là aggregate một học kỳ; không có endpoint liệt kê trực tiếp bảng nội bộ.

POST /api/commands/{action} dùng body:
```json
{"revision": 0, "payload": {}}
```
Revision phải trùng phiên gần nhất đã đọc; 409 yêu cầu làm mới trước khi thử lại. Kiểm tra/ghi dữ liệu, audit và publication cùng transaction.

| action | Vai trò | payload |
|---|---|---|
| catalog | STAFF | departments, teachers (trước nhập plan) |
| config | STAFF | period_minutes, break_minutes, max_periods, rooms (legacy, ignored), slots, soft_weights |
| offerings | STAFF | offerings: danh sách Offering |
| send | STAFF | department |
| return | STAFF | department, note không rỗng |
| teacher | HEAD | department, teacher, assistant, capabilities theo mã môn |
| assign | HEAD | department, session, teacher |
| balance | HEAD | department |
| submit | HEAD | department |
| solve | STAFF | iterations 1–5000, seed |
| placement | STAFF | session, slot là chỉ số trong config.slots, room_id |
| publish | STAFF | rỗng |
| external | HEAD/TEACHER | institution, course, class_name, day, start, end, room tùy chọn |
| external-delete | HEAD/TEACHER | id thuộc chính mình |

Teacher/id lịch ngoài do server lấy từ profile và sinh UUID; client không được chọn. HEAD phải cùng bộ môn và là GV thật. Lịch ngoài dùng phút từ đầu ngày, 06:00–22:00; day 2–8. Khoảng thời gian là [start,end): hai buổi nối tiếp không trùng.

POST /api/import/preview dùng multipart file .xlsx, chỉ STAFF. Trả offerings, errors (row/message), can_import. Preview không ghi DB; chỉ xác nhận khi không có lỗi, không tự bỏ dòng hoặc đoán bộ môn.

GET /api/export/draft hoặc /api/export/published chỉ STAFF, trả .xlsx. Snapshot công bố không phụ thuộc lớp/GV nháp hiện tại.

Mã lỗi: 401 thiếu/hết hạn token; 403 sai vai trò/phạm vi; 404 không tìm thấy; 409 lỗi trạng thái/nghiệp vụ/revision; 413 file quá lớn; 422 sai dữ liệu. Lỗi FastAPI trả trong trường detail; body validation có thể là danh sách lỗi có vị trí trường. 503 nếu Auth không cấu hình hoặc không truy cập được.


## Phòng học (chỉ STAFF ghi)

| action | payload |
|---|---|
| rooms | rooms: danh sách đầy đủ; thêm/sửa/xóa theo revision, không làm sai snapshot/reservation |
| requirements | session, room PROJECTOR/COMPUTER tùy chọn, required_equipment string[], required_room_type hoặc null |
| reservation | id, room_id, day 2–8, start/end phút, reason; hằng tuần; không đè mục đã xác nhận |
| reservation-delete | id; giải phóng tường minh |
| published-room | session, room_id; chỉ xác nhận lịch công bố cũ thiếu phòng; ghi snapshot lịch sử |

Room: id, name, capacity 1–10000, room_type, equipment, availability Slot[], active, allowed_departments, allowed_programs STANDARD/CLC/TT, allowed_courses, note. Danh sách điều kiện trống nghĩa không giới hạn; availability trống nghĩa không thể dùng. note không tự động thành rule.

Config.soft_weights có đủ restricted/single_class/overload/gaps_minutes, nguyên 0–1000. Config.rooms cũ không cấp tài nguyên.
Offering hỗ trợ combined (null giữ hành vi legacy, true/false tường minh), lecture_room/tutorial_room, lecture_count/tutorial_count, required_equipment, required_room_type. Import giữ mẫu 10 cột cũ, chấp nhận thêm các trường optional; thiết bị trong Excel cách nhau bằng dấu phẩy.

solve chỉ thành công nếu 0 hard. HTTP 409 có status và violations:
- ROOM_REVIEW_REQUIRED: lịch công bố cũ chưa xác nhận phòng.
- INFEASIBLE_INPUT: lớp không có cặp phòng/giờ phù hợp riêng lẻ.
- SEARCH_EXHAUSTED: hết lượt chưa tìm được lịch hợp lệ, không khẳng định toàn bài toán vô nghiệm.

Lỗi solve giữ nguyên draft/revision. Nháp thủ công có thể có lỗi hard để chỉnh tiếp, nhưng publish luôn kiểm tra lại. Event/export/published có room_id; room cũ là thiết bị chính yêu cầu.
