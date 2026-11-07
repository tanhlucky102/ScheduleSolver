# Kết quả kiểm chứng — 05/11/2026

| Kiểm tra | Kết quả | Phạm vi |
|---|---|---|
| Python pytest | 43 passed | Domain/API/RBAC, regression, phòng bình thường/thiếu phòng/sức chứa/thiết bị/loại/khả dụng/điều kiện/chiếm dụng/trùng lịch; rollback solve; trọng số không bỏ hard; oracle vét cạn bài nhỏ |
| Kế hoạch đã duyệt | PASS | Preview 67/67 dòng, chuyển 290 buổi, bảo toàn sĩ số, phòng Lec/Tut, 4 cờ gộp, 2 dòng chỉ định số lớp |
| Resource snapshot | PASS | SHA-256 bản sao đối chiếu manifest; nguồn resources bên ngoài không bị sửa |
| PostgreSQL Docker thực | PASS | 001+002, FK/profile, row transaction, stale revision/rollback/concurrent edit, trigger phòng capacity, browser DB isolation, API solve/publish/audit/export |
| Chromium fixture | PASS | 3 vai trò, tạo/sửa phòng, đối chiếu payload equipment/capacity/availability, lịch cá nhân; ảnh ui-staff/head/teacher |
| Next.js production build | PASS | Next 16.4.5, TypeScript/compile/prerender, build.log; thư mục build riêng không dừng dev server của người dùng |
| Migration Supabase hosted | PASS | 002 áp dụng thật; project có schema 001 và chưa có workspace. Sao lưu trạng thái trước tại /tmp/schedule-room-upgrade-backup.json (0600) |
| Tài khoản Auth thật | PASS | Tạo 6 tài khoản và workspace demo có 67 offering/290 session, catalog 4 bộ môn/35 GV. Manifest không có mật khẩu |
| Hosted API Auth/RBAC | PASS | Cả 6 login bằng Supabase password grant, token thật -> /api/me/workspace -> PostgreSQL thật. HEAD đúng bộ môn; TEACHER chỉ lịch riêng; HEAD/TEACHER bị chặn sửa phòng |
| Chromium hosted | PASS | Đăng nhập STAFF/HEAD/TEACHER qua Auth thật, Next.js -> FastAPI -> Supabase; truy cập trang Phòng học và lịch cá nhân theo quyền. Ảnh ui-hosted-staff/head/teacher |
| Lập lịch học kỳ thực | CHƯA CHẠY | Chưa có dữ liệu phòng do Giáo vụ xác nhận; 7 tổ hợp môn/loại buổi thiếu GV hợp lệ cần HEAD khai báo |
| Benchmark Java / chứng minh tối ưu | CHƯA CHẠY | Không khẳng định heuristic tìm được mọi lời giải hoặc chứng minh vô nghiệm |

Lệnh:
    cd backend
    conda run -n ai20k python -m pytest -q
    conda run -n ai20k python -m tests.run_postgres

    # Từ root:
    conda run -n ai20k python verification/browser_smoke.py
    conda run -n ai20k python verification/hosted_smoke.py --browser

Build dùng npm run build với SCHEDULE_NEXT_DIST_DIR=.next-build-check.
Fixture browser dùng .next-smoke để không dừng dev server đang chạy của người dùng.

Tài khoản: data/demo/manifest.json có email/role/workspace; mật khẩu tại /tmp/schedule-demo-credentials.json (0600), không ghi vào source.
Hosted evidence: hosted-migration.json, hosted-results.json. Script smoke không gán phòng giả hay công bố lịch trên workspace thật.

Trong kiểm chứng đã sửa: importer giữ tên học phần trống thay vì mất 2 dòng; test server dùng thư mục build riêng; CORS test origin được cấu hình đúng. Kết quả PASS ghi sau sửa. Không coi Auth/API fixture là hosted E2E.

Yêu cầu sau cùng của người dùng dùng kế hoạch bổ sung 67 dòng; không phân tích FIT thêm. Các artifacts FIT đã trích trước đó chỉ còn tham khảo.
