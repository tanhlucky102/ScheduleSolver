# ScheduleSolver Web

Ứng dụng độc lập: FastAPI/Python + Next.js/TypeScript + Supabase Auth/PostgreSQL. Source gốc không bị sửa. SoT là tài liệu BA bên ngoài repo; xem MIGRATION_PLAN.md và AUDIT.md.

Kiến trúc module hiện tại, trách nhiệm từng phần và báo cáo kiểm chứng: [docs/REFACTOR_AUDIT.md](docs/REFACTOR_AUDIT.md).

## Chạy với Supabase

Yêu cầu Python 3.10+, Node 20.9+ và một project Supabase.

1. Với database mới, chạy supabase/migrations/001_schedule_web.sql rồi supabase/migrations/002_room_constraints.sql. Database đã có 001 chỉ cần chạy 002. Migration giữ schema schedule_web riêng, không sửa bảng ứng dụng khác. Kiểm tra trên bản sao khi nâng cấp dữ liệu đang vận hành.
2. Tạo tài khoản bằng Supabase Dashboard → Authentication. Không có mật khẩu/tài khoản mặc định và không mở đăng ký tự cấp vai trò.
3. Trong backend:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
   Điền DATABASE_URL (connection string PostgreSQL/Supabase, SSL), SUPABASE_URL và SUPABASE_PUBLISHABLE_KEY. Nếu dùng khóa anon cũ thì điền vào biến publishable. DATABASE_URL chỉ nằm ở backend.
4. Cấp môi trường và tạo workspace:
   ```bash
   set -a
   source .env
   set +a
   python bootstrap.py --staff-user UUID_AUTH_GIAO_VU --name HK1-2026
   uvicorn app.main:app --env-file .env --port 8000
   ```
   Bootstrap in ra workspace UUID. UUID giáo vụ phải tồn tại trong auth.users; không gọi lệnh bootstrap lặp lại cho cùng tài khoản.
5. Trong terminal khác:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   npm ci
   npm run dev
   ```
   Điền cùng URL/key Supabase và API URL vào .env.local trước khi chạy/build. Mở http://localhost:3000. Swagger: http://localhost:8000/docs.
6. Giáo vụ đăng nhập, nhập danh mục bộ môn/GV, cấu hình khung giờ và nhập kế hoạch. Các mã GV/bộ môn phải ổn định.
7. Cấp profile cho tài khoản GV/TBM đã tạo trong Dashboard bằng SQL với UUID thật:
   ```sql
   insert into schedule_web.profiles(id,workspace_id,role,department,teacher)
   values ('UUID_AUTH','UUID_WORKSPACE','HEAD','MA_BO_MON','MA_GV');
   -- Giảng viên thường: role TEACHER, department có thể NULL, teacher phải đúng mã GV.
   ```
   TBM phải tham chiếu một GV thật cùng bộ môn. Backend kiểm tra điều này mỗi lần truy cập; chỉ operator database được cấp/thu hồi quyền. Một tài khoản gắn một workspace, một GV không gắn hai tài khoản. Chuyển học kỳ bằng workspace mới và điều chỉnh profile qua operator.
8. Giáo vụ gửi bộ môn → TBM cập nhật năng lực theo mã môn (LEC/TUT; buổi gộp cần cả hai), phân công hoặc chia đều → nộp. Giáo vụ có thể trả riêng bộ môn kèm lời nhắn → TBM nộp lại. Khi mọi bộ môn nộp hợp lệ, chạy solver, sửa nháp, kiểm tra và công bố.
9. GV/TBM xem lịch của mình và khai báo lịch ngoài theo giờ thực sau công bố. Trùng lịch khoa/lịch ngoài đã có bị chặn. Lịch khoa công bố mới luôn được ưu tiên; giao diện đánh dấu lịch ngoài cần sửa. Giáo vụ không được đọc lịch ngoài.

Supabase Data API không cần expose schema schedule_web. Browser chỉ gọi Supabase Auth và FastAPI. Backend truy cập schema riêng bằng connection string bí mật. Có thể dùng DB owner khi thử nghiệm; khi vận hành, cấp login riêng với USAGE schema, SELECT profiles/workspaces, UPDATE workspaces, INSERT publications/audit_log, USAGE sequence audit_log_id_seq và BYPASSRLS. Không cấp quyền UPDATE profile cho browser. Không dùng metadata tự chỉnh của user để quyết định vai trò.

## Nhập và xuất Excel

Mẫu nhập hiện tại: frontend/public/plan-template.xlsx, điền rồi lưu với duy nhất một sheet. Mỗi dòng là một môn/khóa/chương trình/bộ môn:
id, course, name, cohort, department, students, lecture_periods, tutorial_periods, room, program.
room là PROJECTOR hoặc COMPUTER; program là STANDARD, CLC hoặc TT. Các cột optional combined, lecture_room/tutorial_room, lecture_count/tutorial_count giữ thông tin kế hoạch 67 dòng. Mọi dòng lỗi hiển thị số dòng. Preview không ghi dữ liệu; xác nhận nhập mới chia lớp.

Không tự suy đoán Lec/Tut/bộ môn từ sĩ số/cỡ phòng trong workbook gốc. Workbook khoa hiện có nhiều sheet và thiếu bộ môn, cần được người vận hành đối chiếu/chuyển về mẫu này; importer cũ có heuristic không được coi là yêu cầu bắt buộc. Chưa có importer trực tiếp .ssp hoặc workbook khoa nhiều sheet.

Xuất Excel là thao tác riêng của giáo vụ cho nháp/công bố, gồm danh sách, lưới theo ngày/loại và đánh giá. Snapshot công bố giữ nguyên GV/giờ khi nháp thay đổi. Layout lấy tham khảo từ ExcelExporter/TimetableTemplate; chưa xác nhận giống hoàn toàn bản in mẫu khoa, nên không tuyên bố tương thích hình thức 100%.

## Kiểm chứng

```bash
cd backend
python -m pytest -q
python -m tests.run_postgres  # cần Docker; tự tạo/xóa Postgres cục bộ, không chạm DB từ xa
cd ../frontend
npm run typecheck
npm run build
```

Browser smoke có Auth/API fixture, cần Python Playwright và Chromium:
`python verification/browser_smoke.py` từ root repo. Không chạy cùng một frontend dev server trên port 3199.

Xem verification/RESULTS.md để biết kết quả thực tế. Đã dùng cấu hình backend/.env để nâng cấp migration 002 và tạo 6 tài khoản demo thật. Xem verification/RESULTS.md, data/demo/manifest.json và tệp đăng nhập /tmp/schedule-demo-credentials.json (0600).

## Giới hạn triển khai hiện tại

- Solver chạy HC/SA/Tabu trong worker process riêng, nhận/gửi JSON qua TCP loopback port 9009 (khung 4-byte length prefix). Tiến độ và hiện diện đi qua WebSocket `/ws`; WebSocket dùng access token xác thực, và chỉ các profile cùng workspace nhận sự kiện. Tiến độ có thể xem theo từng thuật toán.
- Solver đọc snapshot trước khi chạy, không giữ khóa DB trong thời gian tìm kiếm; chỉ ghi bản nháp với revision điều kiện sau khi hoàn tất. Nếu dữ liệu thay đổi giữa chừng, kết quả bị từ chối để tránh ghi đè. Worker được khởi chạy tự động khi có yêu cầu solve. Chưa có hàng đợi bền vững, hủy job hoặc kiểm thử tải; tiến độ/hiện diện trong bộ nhớ của một backend process, nên muốn chạy nhiều backend instance cần bổ sung message broker và sticky routing hoặc adapter phù hợp.
- Các bộ giải vẫn dùng ba thread trong process worker, seed tái lập và chọn điểm (hard, soft) theo thứ tự ưu tiên. Python GIL giới hạn tăng tốc CPU; chưa port delta scoring, chưa benchmark tương đương Java trên dữ liệu 290 lớp.
- Các thành phần phạt mềm dùng tổng đơn vị minh bạch trong báo cáo; SoT không cho trọng số nên chưa tuyên bố tương đương điểm Java.
- Đã có phân phòng cụ thể và hard constraints, xem ROOM_IMPLEMENTATION.md.
- Catalog/plan nhập ban đầu và khóa để tránh thay dữ liệu phá snapshot. Chưa có giao diện sửa kế hoạch và quản trị tài khoản/học kỳ.
- Khung giờ nhập các vị trí bắt đầu hợp lệ; duration tính phút/tiết và nghỉ giữa tiết. Chưa mô hình hóa nghỉ trưa bên trong một lớp.
- Supabase là thành phần bắt buộc để dùng dữ liệu thật; không có đường đăng nhập giả hoặc chế độ bypass RBAC.


Mở rộng 05/11/2026: xem [ROOM_IMPLEMENTATION.md](ROOM_IMPLEMENTATION.md) và [AUDIT.md](AUDIT.md).
Dùng kế hoạch 67 dòng đã duyệt tại data/fall2026/approved_plan.xlsx và catalog_seed.json; xem [dữ liệu](data/fall2026/README.md).
Tài khoản mẫu đã được tạo; backend/provision_demo.py --approved-plan --apply có thể tạo bộ demo khác với workspace riêng, không nhập mật khẩu CSV.
Phòng do Giáo vụ khai báo là nguồn chính thức; không có dữ liệu phòng giả được đưa vào seed.


## Kiểm chứng toàn học kỳ với phòng giả lập — 06/11/2026

Đã chạy 290/290 buổi, hard = 0 với đúng 6 phòng máy chiếu + 11 phòng máy tính từ resources/so_phong.csv. Thuộc tính phòng, khung giờ và 7 năng lực thiếu được giả lập tường minh; không sửa dữ liệu hosted. Xem [báo cáo và ảnh ba vai trò](verification/full-term-simulation/README.md). Đã thêm màn Lịch học kỳ cho STAFF và chế độ mở toàn bộ khung giờ lịch cá nhân.
