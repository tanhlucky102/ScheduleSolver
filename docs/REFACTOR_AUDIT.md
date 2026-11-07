# Báo cáo audit và refactor kiến trúc

## Phạm vi và ràng buộc

Refactor giữ nguyên endpoint, payload, response, quyền theo vai trò, transaction/revision, cấu trúc dữ liệu lưu trong Postgres và hành vi màn hình. Không thêm layer repository cho từng bảng vì dữ liệu hiện được ghi như một aggregate `Workspace` trong một transaction có khóa dòng.

## Cấu trúc trước

```text
backend/app/
  main.py              API, schema, phân quyền, command, nhập Excel, xuất Excel
  domain.py            model, validation, quy tắc phòng, solver, công bố
  storage.py           transaction và truy cập Postgres
  auth.py              xác thực Supabase và profile
frontend/app/
  page.tsx             phiên đăng nhập, API, state, các tab và biểu mẫu
  editors.tsx          danh mục, cấu hình, năng lực
  rooms.tsx            phòng, chiếm dụng, yêu cầu phòng
  term-calendar.tsx    mô hình hiển thị và toàn bộ lịch học kỳ
  workspace-ui.tsx     UI tổng quan, phân công, lịch cá nhân
```

Các điểm coupling chính: `main.py` chứa toàn bộ command và route; `domain.py` trộn model với thuật toán tìm kiếm; page vừa gọi API vừa quản lý auth và render nhiều nghiệp vụ. Logic nạp năng lực từ seed xuất hiện ba lần. Các kiểu dữ liệu frontend nằm rải trong component.

## Cấu trúc sau và trách nhiệm

```text
backend/app/
  main.py                 FastAPI routes, exception mapping, transaction/audit
  schemas.py              schema request và payload command
  auth.py                 Supabase token và profile từ Postgres
  policies.py             kiểm tra phạm vi vai trò độc lập FastAPI
  commands.py             dispatch command, kiểm tra quyền chung
  *_commands.py           danh mục, phòng, kế hoạch, phân công, xếp lịch
  domain_models.py        model aggregate và validation tham chiếu
  domain_rules.py         quy tắc phân công, phòng và đánh giá lịch
  solver.py               thuật toán tìm phương án lịch
  publication.py          công bố và lịch ngoài
  plan_import.py          parse và preview workbook
  import_preview.py       route upload, giới hạn dung lượng, lỗi HTTP
  seed_catalog.py         adapter đọc năng lực từ dữ liệu seed
  storage.py              repository aggregate Postgres/SQLAlchemy
  domain.py               export tương thích cho code/test cũ
frontend/
  app/page.tsx            shell, điều hướng và ghép các feature
  features/catalog/      danh mục, kiểu dữ liệu, import CSV/JSON
  features/rooms/        quản lý phòng, đặt phòng, yêu cầu phòng, parse CSV
  features/assignments/  phân công, điều kiện giảng viên, năng lực
  features/scheduling/   cấu hình, lịch nháp, lịch cá nhân, lịch học kỳ
  features/workspace/    auth/workspace hook, API client, login, tổng quan, types
  features/shared/       UI dùng chung và định dạng giờ
verification/
  refactor_browser_smoke.py  Chromium smoke với Auth/API giả lập
```

Hướng phụ thuộc backend: route → command/application → domain models/rules/solver; route → storage. Command không import FastAPI hoặc SQLAlchemy. `storage.py` là điểm truy cập Postgres duy nhất cho aggregate. `domain.py` chỉ là facade tương thích; module mới import trực tiếp thành phần cần dùng. Frontend: page → feature → shared; API calls ở `features/workspace/api-client.ts` và trạng thái phiên ở `use-workspace-session.ts`.

## Kiểm chứng

- Backend: `backend/.venv/bin/python -m pytest -q` — 48 passed.
- Backend: `PYTHONPATH=. .venv/bin/python tests/run_postgres.py` từ thư mục backend — PASS với Docker Postgres tạm thời: migration, transaction, rollback, revision, quyền vai trò, API giải lịch/công bố/audit/export.
- Backend: `python -m compileall -q app` và `python -m pyflakes app bootstrap.py provision_demo.py` — đạt.
- Frontend: `npm run typecheck` và `npm run build` — đạt (Next.js 16.4.5).
- Frontend: `npx --no-install tsc --noEmit --noUnusedLocals --noUnusedParameters` — đạt.
- Chromium: `conda run -n ai20k python verification/refactor_browser_smoke.py` — đạt với Auth/API giả lập: điều hướng ba vai trò, form phòng, các màn hình lịch, giữ state khi đổi tab, không có lỗi JavaScript trên trang.
- Chromium: `SMOKE_ARTIFACT_DIR=/tmp/actor-workflow-smoke conda run -n ai20k python verification/ui_workflow_smoke.py` — đạt 14 command qua STAFF/HEAD/TEACHER: gửi, phân công, nộp/trả lại, solver lỗi/retry, công bố, lịch ngoài, lưu bộ môn/phòng/đặt phòng; màn hình desktop/mobile, không có lỗi JavaScript. Auth/API dùng fixture để tránh thay đổi dữ liệu hosted.
- So sánh route/method trước–sau — đủ 6 route, không đổi HTTP method/path.
- Quét import tương đối bằng AST/regex — không thấy vòng phụ thuộc ở backend hoặc frontend.
- `git diff --check` — đạt.

Các thư mục `supabase/migrations`, `resources`, `data`, `scripts`, `presentation` và các artifact kiểm chứng cũ đã được kiểm kê. Migration và dữ liệu mẫu không đổi; script trích xuất và tài liệu trình chiếu không thuộc luồng runtime của API/UI.

## Vấn đề còn lại

- Frontend chưa có ESLint script/dependency. Đã có smoke test Chromium với Auth/API giả lập nhưng chưa có browser E2E trên Supabase hosted trong đợt này.
- Tài khoản demo và mật khẩu mẫu đã nằm trực tiếp trong màn hình đăng nhập từ trước. Nên chuyển sang cấu hình demo hoặc bỏ khi vận hành thật; thay đổi này cần quyết định sản phẩm vì sẽ đổi luồng đăng nhập nhanh.
- Một số component chuyên biệt vẫn dài (`room-manager.tsx`, `term-calendar.tsx`, `catalog-editor.tsx`). Chúng đã có ranh giới feature; chỉ nên tách tiếp khi biểu mẫu hoặc chế độ xem có vòng đời thay đổi độc lập.
- Bộ parse CSV hiện tại xử lý theo dấu phẩy đơn giản, chưa hỗ trợ ô CSV có dấu phẩy trong dấu ngoặc kép. Giữ nguyên hành vi để không thay đổi import contract trong đợt này.
