# Codebase audit — 2026-11-08

> Báo cáo lịch sử trước khi tách module. Xem [REFACTOR_AUDIT.md](REFACTOR_AUDIT.md) để biết kiến trúc và kết quả kiểm chứng hiện tại.

## Kiến trúc và luồng chính

- `frontend/app` là giao diện Next.js; trình duyệt dùng Supabase Auth và gọi FastAPI.
- `backend/app/main.py` nhận API command, kiểm tra vai trò và điều phối workflow. `auth.py` xác thực token và profile; `domain.py` chứa mô hình, ràng buộc và solver; `storage.py` quản lý transaction trên workspace PostgreSQL; `exporter.py` tạo Excel.
- `supabase/migrations` định nghĩa schema; `data/fall2026` và `resources` chứa dữ liệu nguồn và kế hoạch đã duyệt. Đây là dữ liệu nghiệp vụ, không thuộc phạm vi dọn bỏ.
- Workflow: nhập catalog/kế hoạch → gửi bộ môn → phân công/nộp → giải lịch → sửa nháp → công bố → giáo viên xem lịch và khai báo lịch ngoài.

## Thay đổi đã thực hiện

- `backend/app/storage.py`: bỏ bốn import ORM không dùng; thống nhất chuyển workspace ID thành UUID trước truy vấn.
- `backend/app/main.py`: bỏ hai import không dùng. File này đã có thay đổi chưa commit trước đợt audit; các thay đổi đó được giữ nguyên.
- Không xóa dependency, migration, asset hoặc dữ liệu: chưa có bằng chứng đủ chắc chắn rằng chúng không còn được dùng bởi vận hành, script hoặc tài liệu.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| Backend `python -m pytest -q` | 48 passed, 2 cảnh báo từ dependency |
| Backend `python -m pyflakes app bootstrap.py provision_demo.py` | Pass sau refactor |
| PostgreSQL `./.venv/bin/python -m tests.run_postgres` | Pass: migration, transaction, rollback, concurrency, role isolation, API, solve, publish, audit, export |
| Frontend `npm run typecheck` | Pass |
| Frontend `npm run build` | Pass |
| `git diff --check` | Pass |

Frontend không có lệnh `lint` trong `package.json`; typecheck và build không thay thế kiểm tra quy tắc style. Không chạy browser smoke hoặc kiểm thử trên Supabase hosted trong đợt này.

## Vấn đề còn tồn tại

1. `backend/app/main.py` gộp API routes, kiểm tra quyền và xử lý nhiều command trong một module lớn. `frontend/app/page.tsx`, `editors.tsx`, `rooms.tsx`, `term-calendar.tsx` cũng lớn. Tách module cần đi kèm regression ở từng workflow để bảo toàn contract.
2. Solver đồng bộ trong transaction giữ khóa workspace trong suốt quá trình chạy; độ trễ và tranh chấp ghi có thể tăng với dữ liệu lớn. Chưa có benchmark tải ở đây.
3. Tầng lưu trữ dùng một JSONB aggregate cho workspace. Cách này giúp transaction nhất quán nhưng làm mọi cập nhật ghi lại toàn bộ body; cần đo trên dữ liệu vận hành trước khi thay đổi mô hình lưu trữ.
4. Working tree có các thay đổi giao diện và cache đánh giá chưa commit từ trước. Đợt audit không quy chúng thành thay đổi của mình; cần review riêng hành vi cache theo revision và bộ nhớ khi triển khai nhiều worker.
5. `frontend/public/plan-template.csv` không thấy được tham chiếu trực tiếp trong mã, nhưng có thể là mẫu tải thủ công. Giữ lại theo nguyên tắc chỉ xóa khi xác minh chắc chắn.
