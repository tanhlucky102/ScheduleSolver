# Cải tiến UI/UX ScheduleSolver

Ngày thực hiện: 05–06/11/2026. Phạm vi: frontend Next.js, kiểm thử trình duyệt và tài liệu. Không sửa backend, API contract, database hay phân quyền.

## Nghiên cứu và quyết định thiết kế

Tham khảo tài liệu sản phẩm chính thức, không sao chép giao diện:

| Nguồn | Mẫu tương tác tham khảo | Áp dụng trong dự án |
| --- | --- | --- |
| [Canvas – Calendar](https://community.instructure.com/en/kb/articles/662787-unknown) | Lịch tập trung, màu nhất quán theo nguồn, chế độ xem tuần/agenda | Lịch tuần có trục giờ, danh sách buổi, lọc lịch khoa/lịch ngoài |
| [Blackboard – Calendar](https://help.anthology.com/blackboard/instructor/en/getting-started/calendar.html) | Tập hợp lịch khóa học và sự kiện trong một nơi | Hai nguồn lịch cùng màn hình, chú giải và nhãn nguồn; cảnh báo lịch ngoài cần đổi |
| [UniTime – Instructor Scheduling](https://help.unitime.org/manuals/instructor-scheduling) | Điều kiện năng lực, khối lượng và kiểm tra xung đột trong phân công | Lọc GV hợp lệ, tải tiết/tuần cạnh bảng, trạng thái lớp và báo cáo ràng buộc |

UniTime có quy trình phân công khác dự án này. Chỉ tham khảo cách trình bày năng lực, khối lượng và ràng buộc; giữ trình tự Giáo vụ lập kế hoạch → TBM phân công → Giáo vụ xếp lịch → GV xem lịch. Dự án chưa có giờ ở bước phân công nên không đưa ra kết luận “không trùng giờ” tại bước đó.

Điều hướng theo vai trò giữ cố định; tên màn hình thay cho chỉ tên vai trò. Bảng nghiệp vụ dùng tìm kiếm, lọc và thông tin tại dòng. Dashboard chọn dữ liệu liên quan vai trò và tác vụ tiếp theo, không hiển thị số liệu giả. Màu xanh dương dành cho hành động, xanh lá cho hoàn tất, vàng cho cần xử lý và đỏ cho lỗi. Trạng thái luôn có chữ, không chỉ màu. Typography dùng font hệ thống hỗ trợ tiếng Việt, không phụ thuộc tải font từ bên ngoài.

## Audit ban đầu

Đã đọc page.tsx, editors.tsx, rooms.tsx, style.css, backend/app/main.py, domain.py, README và kiểm thử có sẵn. Baseline được render bằng Chromium với Auth/API fixture và được judge độc lập xem trước thay đổi.

| Heuristic | Phát hiện có vị trí | Mức độ | Xử lý |
| --- | --- | --- | --- |
| Visibility of status | Toast “Đã lưu.” chung chung; trạng thái nộp không gắn thao tác | Minor | Thông báo theo hành động, trạng thái đang xử lý, khóa thao tác khi gửi |
| Match real world | Lịch cá nhân thiếu trục giờ; mã LEC/TUT trong bảng | Major | Trục 06:00–24:00, tên loại buổi tiếng Việt |
| User control | Hành động xóa cần tránh nhầm; lỗi khó quay lại tác vụ | Risk qua code | Xác nhận xóa phòng/buổi ngoài; thông báo đóng được và retry |
| Consistency | H1 luôn là vai trò dù đang ở màn khác | Minor | H1, mô tả, breadcrumb, nhãn vai trò tách rõ |
| Error prevention | Nút nộp/cập nhật vẫn hiện khả dụng khi bộ môn chưa SENT | Major qua code | Khóa theo trạng thái SENT, kiểm tra tất cả lớp có GV hợp lệ |
| Recognition | Bảng thiếu tên GV, trạng thái, tải; phòng dùng nhiều mã | Major | Tên GV, lọc ứng viên, số tiết và trạng thái tại dòng; giữ mã thiết bị có chú giải |
| Efficiency | Lịch cao, nhiều form phòng nối tiếp; thiếu tìm kiếm | Major | Lịch cuộn riêng/danh sách mobile; tìm phòng/lớp; đóng form phòng; lịch chiếm dụng thu gọn |
| Minimalism | Tổng quan giống nhau cho cả ba vai trò; thông tin kỹ thuật xuất hiện trong hướng dẫn nhập | Major | KPI theo vai trò, CTA tiếp theo, rút hướng dẫn nhập về thao tác |
| Error recovery | Ban đầu chưa có trace lỗi | Chưa đánh giá từ ảnh baseline | Kiểm tra lỗi API 409 và retry trong trace mới |
| Help | Có hướng dẫn nhưng dài | Minor | Chỉ dẫn ngắn tại tác vụ; lý do khóa nộp và điều kiện công bố |

Judge phát hiện thêm ở lần render đầu sau sửa: cột chọn GV khuất trên mobile, CTA staff chưa dẫn tới bước gửi và KPI mobile quá dài. Đã sửa: mỗi dòng bảng thành bố cục card trên mobile, hiển thị select toàn chiều rộng, KPI 3 ô compact, CTA gửi focus tới tiến độ bộ môn.

## Trải nghiệm theo vai trò

| Vai trò | Màn hình / việc chính | Giới hạn giữ nguyên |
| --- | --- | --- |
| Giáo vụ | Dashboard tiến độ; nhập danh mục/kế hoạch; phòng và ràng buộc; gửi bộ môn; trả lại có lý do theo bộ môn; xem phân công; chạy xếp lịch, kiểm tra, hiệu chỉnh và công bố | Không phân công thay TBM; không đọc lịch ngoài |
| Trưởng bộ môn | Tổng quan bộ môn; tìm lớp, lọc trạng thái; xem danh sách GV/tải; cập nhật năng lực; chọn người đủ điều kiện; chia đều lớp trống; nộp/nộp lại; lịch cá nhân | Chỉ chỉnh khi SENT; SUBMITTED khóa chỉnh; không tự phê duyệt, xếp lịch hay quản lý phòng |
| Giảng viên | KPI lớp công bố/tổng tiết; lịch tuần hoặc danh sách; nguồn lịch; khai báo/xóa lịch ngoài; cảnh báo khi lịch khoa mới trùng lịch ngoài | Chỉ đọc lớp và lịch được API cấp; không đọc kế hoạch chưa công bố |

Luồng trạng thái:
1. Giáo vụ nhập kế hoạch và chia lớp; UNSENT xuất hiện nút gửi theo từng bộ môn.
2. SENT cho TBM sửa năng lực và phân công. GV được lọc theo bộ môn, loại buổi và năng lực; lớp thiếu hoặc sai phân công có nhãn cần xử lý.
3. Chỉ cho nộp khi tất cả lớp hợp lệ. SUBMITTED hiển thị khóa chỉnh. Giáo vụ trả riêng bộ môn kèm lý do để quay về SENT.
4. Giáo vụ chỉ chạy xếp lịch khi các bộ môn đã nộp và đã có phòng/khung giờ. Hiển thị lỗi bắt buộc, ưu tiên mềm và chỉnh lớp/phòng. Công bố vẫn cần đánh giá hard = 0 và có bản nháp.
5. GV thấy snapshot công bố. Lịch ngoài chỉ thêm được sau khi có công bố; sai thứ tự giờ bị chặn. Lịch mới trùng buổi ngoài được đánh dấu, có thể xóa và khai báo lại.

## Thành phần đã cập nhật

- frontend/app/workspace-ui.tsx: Icon, EmptyState, Metrics, Workflow, DepartmentProgress, AssignmentPanel, PersonalCalendar dùng lại dữ liệu/API hiện có.
- frontend/app/page.tsx: shell theo vai trò, dashboard, tích hợp các thành phần, trạng thái loading/error/success, điều kiện CTA, thông báo theo hành động, preview file mới xóa kết quả cũ.
- frontend/app/style.css: token màu, layout, sidebar, bảng, form, lịch, mobile, focus, reduced motion.
- frontend/app/rooms.tsx: tìm phòng, chỉ mở form khi cần, đóng form, xác nhận xóa, thu gọn form lịch chiếm dụng.
- verification/browser_smoke.py: cập nhật locator để phân biệt lịch tuần và agenda.
- verification/ui_workflow_smoke.py: kiểm thử luồng bàn giao ba vai trò có state fixture và kiểm tra payload/revision.

Accessibility đã triển khai: lang vi, skip link, nav aria-current, tên select cho từng lớp/khung giờ/phòng, caption bảng phân công, focus rõ, trạng thái role=status/alert, labels form, không chỉ dùng màu, tôn trọng reduced motion. Đây không phải chứng nhận WCAG hoặc kiểm thử đầy đủ với screen reader.

## Kiểm chứng

Chạy từ root:
```bash
conda run -n ai20k python verification/browser_smoke.py
conda run -n ai20k python verification/ui_workflow_smoke.py
cd frontend
conda run -n ai20k npm run typecheck
conda run -n ai20k npm run build
cd ../backend
conda run -n ai20k python -m pytest -q
```

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript tsc --noEmit | PASS |
| Next.js production build | PASS |
| Backend regression | 43 passed |
| Browser smoke có sẵn: login, role navigation, catalog, tạo/sửa phòng và payload | PASS |
| Browser workflow mới: 3 vai trò, 11 lệnh, bàn giao/trả lại/nộp lại, error/retry, công bố và lịch cá nhân | PASS, 0 page errors |
| Responsive trong workflow mới | PASS, 1440px và 390px; không tràn ngang document trên các màn đã chụp |
| Keyboard | PASS skip link; chưa đánh giá toàn bộ thao tác không dùng chuột |
| Hosted Supabase | Chưa chạy tới login: thiếu tệp credentials demo |

Judge độc lập đã kiểm tra ảnh render sau vòng sửa cuối: không thấy blocker hoặc overflow toàn trang; xác nhận CTA gửi kế hoạch và phân công mobile đã được sửa. Minor còn lại là độ dài nội dung hướng dẫn/metrics trên điện thoại.

Ảnh minh chứng:
- [Dashboard Giáo vụ](../verification/redesign/staff-overview.png)
- [Phân công Trưởng bộ môn](../verification/redesign/head-assignment.png)
- [Phân công mobile](../verification/redesign/head-assignment-mobile.png)
- [Lịch Giảng viên](../verification/redesign/teacher-calendar.png)
- [Lịch mobile](../verification/redesign/teacher-calendar-mobile.png)
- [Lỗi xếp lịch có hướng xử lý](../verification/redesign/staff-error.png)
- [Lịch ngoài cần điều chỉnh](../verification/redesign/teacher-conflict.png)
- [Kết quả workflow dạng JSON](../verification/redesign/results.json)

Kết quả chi tiết và ảnh sau thay đổi: [verification/redesign](../verification/redesign/). Kịch bản browser mới mô phỏng Auth và API; không phải E2E Supabase thật. Backend regression chạy logic thực bằng bộ kiểm thử hiện có. Không có dữ liệu thật bị sửa.

## Giới hạn còn lại

- API TEACHER chỉ trả published/external. GV chưa có danh sách phân công trước công bố; muốn hỗ trợ cần mở rộng dữ liệu trả về có kiểm soát ở backend, ngoài thay đổi frontend lần này.
- HEAD không nhận draft hoặc lịch toàn bộ bộ môn. Không tự tạo khả năng kiểm tra trùng giờ của tất cả GV tại màn phân công; kiểm tra giờ/phòng vẫn do solver và evaluation hiện có.
- Thanh khối lượng là so sánh tương đối, không phải cảnh báo vượt định mức: API chưa có định mức theo GV.
- Form điều kiện phòng vẫn nhận một số mã cách nhau bởi dấu phẩy. Chưa chuyển toàn bộ sang catalog picker.
- Không bổ sung lịch theo ngày cụ thể hoặc nút “hôm nay”: dữ liệu hiện tại là lịch lặp theo thứ trong học kỳ.
- Kiểm thử hosted đã thử nhưng không chạy tới đăng nhập vì thiếu /tmp/schedule-demo-credentials.json. Chưa xác minh lại với Supabase và tài khoản thật.
- Chưa kiểm thử Safari/Firefox, screen reader, zoom 200%, tự động quét WCAG hoặc tải lớn. Bộ browser hiện kiểm tra Chromium desktop 1440px và mobile 390px.

## Chạy ứng dụng sau bàn giao

Frontend production đã khởi động tại http://localhost:3000 và kiểm tra HTTP 200, HTML có giao diện mới. API cục bộ chạy tại http://localhost:8000 theo backend/.env sẵn có; /health trả HTTP 200. Các dịch vụ này không thay thế việc xác minh đăng nhập với tài khoản Supabase thật. Nếu khởi động lại: chạy npm run build rồi npm run start trong frontend; chạy python -m uvicorn app.main:app --env-file .env --port 8000 trong backend.
