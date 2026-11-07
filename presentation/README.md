# ScheduleSolver Web — bản trình bày cập nhật 06/11/2026

16 slide chính 16:9, khoảng 15 phút; không có phụ lục A.

- ScheduleSolver_Project_VI.pptx: bản chỉnh sửa được và speaker notes.
- ScheduleSolver_Project_VI.pdf: bản trình chiếu đã render.
- speaker-notes.md và outline.json: lời dẫn, thời lượng, nguồn từng slide.
- preview/ và contact-sheet.png: render để kiểm tra trực quan.
- qa-report.json: kiểm tra deck; build_deck.py: mã tái tạo.

Đã dùng skill research-slides từ /home/masao-1112/Documents/tools-kit/research-skills/research-slides/SKILL.md cùng deck-production/results references.

Minh chứng giao diện mới có đủ STAFF, HEAD CNPM và TEACHER QuyenNV, lấy từ luồng Supabase Auth thật → API thật → PostgreSQL cục bộ. Toàn học kỳ 290 buổi, 0 lỗi cứng; QuyenNV 11 buổi. Đúng số lượng 6 phòng máy chiếu + 11 phòng máy tính từ resources/so_phong.csv; các thuộc tính phòng và năng lực thiếu là giả lập có provenance. Không thay dữ liệu hosted. Xem verification/full-term-simulation/README.md.

Bảng thời gian là hai lần Python trực tiếp cùng dữ liệu/seed/ngân sách, không phải benchmark tổng quát; lượt UI/API được ghi riêng. Đã chạy lại 45 backend tests, TypeScript, production build và Chromium ba actor. Chưa nghiệm thu dữ liệu học kỳ thực hoặc chứng minh tối ưu.

Deck được render bằng LibreOffice; chưa kiểm tra trên Microsoft PowerPoint gốc.
