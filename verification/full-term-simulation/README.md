# Kiểm chứng toàn học kỳ — 06/11/2026

Đã chạy đủ 67 dòng kế hoạch / 290 buổi. Kết quả cuối: **290/290 buổi, 0 lỗi cứng**, công bố và xuất Excel trong database thử nghiệm cục bộ.

## Nguồn và giả định

- Kế hoạch: data/fall2026/approved_plan.json và approved_sessions.json, giữ nguyên 67 dòng/290 buổi.
- Số phòng: resources/so_phong.csv có **6 phòng máy chiếu + 11 phòng máy tính**; không dùng Config.rooms mặc định 10/5.
- Giả lập mã MC01–MC06, MT01–MT11; phòng máy chiếu 200 chỗ; phòng máy tính 40/48 chỗ. Có 3 phòng máy tính 48 chỗ để phục vụ nhóm lớn nhất 48 SV.
- Khả dụng: thứ 2–7, 07:00–12:00 và 13:00–22:00; 66 vị trí bắt đầu. Không cho một buổi đi qua nghỉ trưa.
- MC01 bị chiếm thứ 2 07:00–10:00; MT01 bị chiếm thứ 3 13:00–16:00.
- MT11 chỉ dành CLC/TT; cả hai chương trình và reservation đều được kiểm tra trong kết quả.
- 7 tổ hợp môn/loại thiếu năng lực được bổ sung giả lập cho trưởng bộ môn đúng bộ môn. Chi tiết trước/sau trong manifest.json; không khẳng định đây là năng lực thực.
- Phân công dùng nghiệp vụ balance và submit hiện có. QuyenNV giữ năng lực gốc và được phân 11 buổi.
- Tài khoản Auth demo đã có được ánh xạ tới các profile ở database cục bộ; profile TEACHER cục bộ là QuyenNV. Không đổi profile hoặc dữ liệu trên hosted.

## Lỗi tái hiện và sửa

Bản cũ khởi tạo ngẫu nhiên toàn bộ buổi rồi thay một placement mỗi bước. Với cùng đầu vào, seed 42 và 500 lượt/worker: SEARCH_EXHAUSTED, còn 52 lỗi cứng sau 169.035741 giây. Đây là hết ngân sách tìm kiếm, không chứng minh vô nghiệm.

Đã sửa backend/app/domain.py:

1. Khởi tạo có xét xung đột: ưu tiên lớp nhiều ràng buộc, thời lượng dài và miền nhỏ; chọn giờ/phòng ít xung đột, dùng ưu tiên mềm làm tie-break.
2. Kiểm tra placement trực tiếp theo chỉ số và thời lượng, tránh tạo lại toàn bộ legal_slots cho từng dòng khi chấm điểm.
3. Chia cặp so sánh theo ngày; giữ đủ từng loại vi phạm và kiểm tra độc lập với oracle.
4. Sao chép danh sách placement khi thử thay một phần tử; các placement được thay, không bị sửa tại chỗ. Chấm điểm độc lập vẫn quyết định tính hợp lệ trước công bố.

Lần Python trực tiếp sau sửa: 106.905804 giây, 0 lỗi cứng, soft_total=1705. HC/SA/Tabu đạt lần lượt soft 1865/1705/1813, đều hard=0. Cùng seed 42/43/44, 500 lượt mỗi worker. Đây là quan sát một cấu hình/một lần chạy; chưa phải benchmark nhiều seed hoặc chứng minh tối ưu.

Lượt chạy lại từ nút trên giao diện: 152.533 giây tính cả luồng UI/API/Auth trong khi có kiểm tra khác chạy cùng máy; không so trực tiếp thời gian này với Python. Kết quả vẫn 290 buổi, hard=0, soft_total=1705.

## Kiểm chứng mới

- Backend: **45 tests passed**, gồm regression toàn bộ 290 buổi và oracle đếm xung đột từng cặp.
- TypeScript và production build: PASS.
- Chromium: Supabase Auth thật → FastAPI thật → PostgreSQL 17 Docker cục bộ; không mock API.
- STAFF sửa MC01 200 → 220 → 200 chỗ trên UI; đối chiếu dữ liệu thật sau mỗi lần lưu.
- STAFF trả CNPM; HEAD lọc 11 lớp QuyenNV và nộp lại qua API.
- Solve và publish từ UI; snapshot có đủ 290 buổi; export đủ 290 dòng.
- Đối chiếu độc lập: không trùng phòng/GV/Lec–Tut/CLC, đủ sức chứa/thiết bị/loại, đúng khả dụng/điều kiện và không đè reservation.
- STAFF calendar: đủ 290 ID khác nhau, khớp chính xác 290 session đầu vào; bộ lọc QuyenNV có 11.
- HEAD và TEACHER bị HTTP 403 khi gọi sửa phòng; giáo vụ không được trả lịch ngoài.
- Không có page error hoặc lỗi HTTP ngoài các yêu cầu kiểm tra quyền có chủ đích.
- Tuần mở rộng và danh sách QuyenNV có đủ 11 buổi; có ảnh mobile.

## Các tệp nên xem

- browser-results.json: kết quả trình duyệt/API/DB hiện tại.
- manifest.json: nguồn, giả định và 7 năng lực bổ sung.
- input-state.json / state-solved.json / state-published.json: đầu vào, nháp và snapshot cục bộ.
- evaluation.json: chi tiết hard/soft.
- Timetable-full-term.xlsx: toàn bộ 290 buổi đã công bố.
- staff-entire-term.png: ảnh toàn trang chứa đủ 290 buổi.
- staff-day-2.png … staff-day-7.png: ảnh theo ngày.
- staff-entire-term-viewport.png: phần đầu màn toàn học kỳ.
- staff-room-constraints.png: cấu hình phòng giáo vụ được chỉnh.
- head-full-term-assignment.png: HEAD CNPM lọc QuyenNV trong kế hoạch toàn học kỳ.
- teacher-quyennv-calendar.png / teacher-quyennv-list.png: tuần và danh sách QuyenNV.
- baseline/readiness.json và optimized/readiness.json: hai lần chạy Python cùng đầu vào.

## Chạy lại và dùng demo

Từ root repo:

    conda run -n ai20k python verification/prepare_full_term_simulation.py
    conda run -n ai20k python verification/full_term_readiness.py --state verification/full-term-simulation/input-state.json --output verification/full-term-simulation/retry --iterations 500
    conda run -n ai20k python verification/full_term_browser.py --keep-serving

Demo đã khởi động tại http://127.0.0.1:3399 và API http://127.0.0.1:8298. Sử dụng tài khoản demo STAFF/HEAD-CNPM/TEACHER hiện có; tệp credentials không được đưa vào slide hoặc báo cáo. Runtime database chỉ là Docker cục bộ riêng; thông tin khởi động/thu dọn nằm ở /tmp/schedule-fullterm-runtime.json quyền 0600.

Giáo vụ có thể sửa số lượng phòng qua danh mục, sức chứa, thiết bị, khả dụng, trạng thái hoạt động, điều kiện bộ môn/môn/chương trình và lịch chiếm dụng. Lịch đã công bố vẫn được bảo vệ: thay đổi làm lịch sai sẽ bị chặn.

## Giới hạn

Đây là minh chứng toàn quy trình trên dữ liệu bổ sung giả lập, chưa phải nghiệm thu học kỳ thực. Cần xác nhận thuộc tính phòng, năng lực và phân công giả lập trước khi vận hành. Chưa có load test, benchmark Java, benchmark nhiều seed, chứng minh tối ưu hoặc registry phòng liên workspace. Supabase hosted database không bị sửa.
