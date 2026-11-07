# Dữ liệu Fall2026

Nguồn chính được người dùng duyệt: resources/ke_hoach_mo_lop_HK1_2026.xlsx, 67 offering -> 290 buổi.

- approved_plan.xlsx: chọn để preview/nhập trong giao diện.
- approved_plan.json: payload offerings tương đương.
- approved_sessions.json: buổi học sau chia, chưa phân GV/giờ/phòng.
- approved_plan_provenance.json: nguồn từng dòng, cờ gộp, số nhóm chỉ định và căn cứ chương trình.
- approved_plan_report.json: 42 STANDARD, 13 CLC, 12 TT; 4 môn học liền.
- catalog_seed.json: 4 bộ môn, 35 GV, năng lực theo CSV; chọn nhập JSON ở Cấu hình & kế hoạch.
- readiness_audit.json: 7 tổ hợp môn/loại buổi chưa có GV hợp lệ.
- resource_sha256.json: hash mọi file nguồn, gồm file ẩn.

Tạo lại kế hoạch chính: python scripts/prepare_approved_plan.py.
Những file plan_source_rows.csv, workbook_cells.json, plan_review.xlsx, offering_review.json, timetable_reference.json là dữ liệu tham khảo FIT đã trích trước khi người dùng xác nhận dùng 67 dòng. Không dùng chúng thay thế kế hoạch chính hoặc ghép các phiên bản. Không cần phân tích FIT thêm.

Không có phòng thực được khai báo trong seed. Giáo vụ phải xác nhận sức chứa/thiết bị/khả dụng. Không dùng tai_khoan.csv để đăng nhập.
