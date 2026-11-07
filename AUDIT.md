# Audit toàn dự án — 05/11/2026

Đã kiểm tra domain, API, Auth, storage/ORM, migrations, bootstrap/provisioning, exporter, frontend, tests và dữ liệu. Phạm vi gồm mã nguồn và kiểm chứng cục bộ; đã kiểm tra hosted Supabase Auth/DB với tài khoản demo; chưa kiểm tra tải thực hoặc tối ưu toàn cục.

## Kết quả

| Mảng | Kết quả |
|---|---|
| Kiến trúc | FastAPI/Next.js/Supabase; JSONB workspace theo học kỳ, profile/publication/audit là bảng riêng |
| Kế hoạch | Theo xác nhận người dùng dùng 67 dòng, chuyển thành 290 buổi; giữ cờ gộp, phòng Lec/Tut, số lớp chỉ định và nguồn từng dòng |
| Tương thích | Plan cũ thiếu combined giữ hành vi gộp 4 tiết; plan mới dùng cờ tường minh. TT bổ sung có căn cứ Program.java, không đổi cohort rule CLC cũ |
| Phân công | HEAD đúng bộ môn, năng lực đúng loại; trợ giảng chỉ Tut; phải nộp hợp lệ trước solve/publish; không tự đổi GV |
| Phòng | STAFF quản lý phòng, thiết bị, điều kiện và chiếm dụng; cả solver/evaluate/publish dùng hard constraints; TKB gốc chỉ tham khảo |
| Thuật toán | HC/SA/Tabu tìm cặp giờ/phòng, seed tái lập; hard ưu tiên tuyệt đối, soft có trọng số; lỗi rõ khi hết lượt |
| Công bố | Snapshot có room_id, độc lập nháp; append lịch sử; sửa phòng không được phá lịch công bố; legacy phải xác nhận phòng |
| Dữ liệu | Row lock + revision, rollback state/audit/publication; kiểm tra tham chiếu/ID trong Python, SQL guard thêm cho phòng |
| Phân quyền | Token qua Supabase /user, active role từ DB; browser bị chặn truy cập schema; STAFF không đọc lịch ngoài, GV chỉ lịch riêng |
| UI/UX | Form có nhãn, bảng cuộn, quyền theo vai trò; quản lý phòng/chiếm dụng/yêu cầu lớp, sửa giờ/phòng nháp, mã phòng trong lịch cá nhân/Excel |
| Hosted UI | Chromium đăng nhập thật ba vai trò và gọi API/database thật đạt; xem hosted-results.json |
| Tài khoản thật | Đã tạo 6 account Supabase (1 STAFF, 4 HEAD, 1 TEACHER), login và kiểm tra profile/workspace/RBAC qua Auth thật |
| Kiểm chứng | Backend regression, oracle vét cạn bài nhỏ, migration/API PostgreSQL thực, Chromium form và payload phòng bằng fixture |

Yêu cầu mới của người dùng thay thế quy tắc BA cũ coi số phòng là soft. Những nghiệp vụ GV, trả/nộp bộ môn, lịch ngoài và snapshot được giữ.

## Vấn đề còn lại

| Ưu tiên | Vấn đề có căn cứ | Khắc phục |
|---|---|---|
| P1 trước xếp lịch thật | Chưa có danh sách phòng/sức chứa/thiết bị/khả dụng được Giáo vụ xác nhận | Nhập tại Phòng học; không dùng sĩ số hoặc khoảng trống TKB để suy ra phòng |
| P1 dữ liệu phân công | Catalog nguồn không có GV hợp lệ cho 7 tổ hợp môn/loại: 61FIT3DSY Lec/Tut, 61MME3WDE Lec, 62FIT4EBU Lec/Tut, 66FIT2RES Lec, 66FIT3SS1 Combined | HEAD đối chiếu bộ môn và khai báo năng lực đúng; không tự đổi department/capability trong seed. Chi tiết data/fall2026/readiness_audit.json |
| P1 nếu vận hành nhiều workspace đồng thời | Phòng/chiếm dụng có phạm vi workspace, chưa có registry toàn trường | Khai báo lịch xác nhận bên ngoài vào reservations; cần registry và khóa liên workspace nếu nhiều nơi cùng đặt phòng |
| P1 quy mô lớn | Solver đồng bộ giữ transaction/khóa workspace, full score O(n²) mỗi lượt, ba thread chịu GIL | Benchmark với phòng thật và phân công đã duyệt; cần job worker, cancel/timeout, delta scoring nếu tải yêu cầu |
| P2 | Heuristic hữu hạn có thể chưa tìm thấy lời giải dù tồn tại | Đã trả SEARCH_EXHAUSTED thay vì kết luận vô nghiệm; thêm phương án exact/CP-SAT khi có yêu cầu/benchmark |
| P2 | Chiếm dụng snapshot cũ của các lớp khác có thể ngăn hoán đổi đồng thời | Thiết kế workflow thay thế/giải phóng snapshot có duyệt và transaction; không tự bỏ chiếm dụng |
| P2 | Availability/reservation lặp hằng tuần, chưa có ngày hiệu lực/tuần nghỉ/campus/travel time | Bổ sung dữ liệu nghiệp vụ và mô hình theo tuần/ngày nếu cần |
| P2 | JSONB SQL guard chưa kiểm tra mọi nested window/usage rule như Python | Backend private là đường ghi chính; thêm constraint hoặc chuẩn hóa bảng nếu có writer khác |
| P2 | Chưa có quota số phòng/reservation, rate limit và job admission | Thêm giới hạn theo tải trước khi mở rộng người dùng |
| P2 | UI dùng mã thiết bị, lỗi solver còn tiếng Anh, form phòng dài, chưa có tìm/lọc/undo | Catalog thiết bị, dịch mã lỗi, pagination, thao tác hoàn tác có audit; kiểm thử mobile/accessibility sâu hơn |
| P2 | Plan/catalog khóa sau nhập; chưa có sửa kế hoạch có version hoặc UI quản trị account/học kỳ | Thiết kế sửa có bảo toàn snapshot và quyền operator, không mở sửa phá dữ liệu hiện tại |
| P3 | Excel chưa đối chiếu layout in khoa tuyệt đối | Nghiệm thu hình thức với bản in được duyệt, giữ bảo vệ formula injection |

Không phát hiện đường tự nâng quyền từ client trong các endpoint đã kiểm tra. Không tuyên bố loại hết mọi lỗi: chưa pentest độc lập hoặc load test. Hosted smoke không thay thế nghiệm thu toàn bộ học kỳ với phòng thật. CSV tài khoản nguồn được sao chép theo yêu cầu nhưng không dùng đăng nhập và không nằm trong frontend/public.

Workspace được cung cấp không có .git nên không có diff/commit. Resources nguồn bên ngoài giữ nguyên. Đã áp dụng migration 002 và tạo workspace/tài khoản demo trên Supabase được cấu hình; không có workspace cũ. Thông tin đăng nhập chỉ nằm ở tệp /tmp quyền 0600. Xem verification/RESULTS.md cho lệnh và kết quả kiểm chứng.
