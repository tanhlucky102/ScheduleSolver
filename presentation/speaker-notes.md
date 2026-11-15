# ScheduleSolver Web — ghi chú trình bày

15 slide chính; có ghi chú kỹ thuật và nguồn.

Kết quả kiểm thử trích từ tài liệu dự án, không chạy lại ứng dụng khi dựng deck.

## 01. ScheduleSolver Web

Thời lượng: 35 giây. Hình thức: Báo cáo dự án • 08/11/2026.

Dự án hỗ trợ phối hợp giáo vụ, trưởng bộ môn và giảng viên. Trọng tâm là quy trình có kiểm soát và lịch đáp ứng ràng buộc. Giả định bài nói tiếng Việt cho hội đồng dự án phần mềm, khoảng 15 phút. Chưa có benchmark hoặc lịch học kỳ được nghiệm thu.

Nguồn: README.md; AUDIT.md; verification/RESULTS.md

## 02. Một lịch hợp lệ cần nhiều hơn việc chọn giờ

Thời lượng: 55 giây. Hình thức: Bài toán.

Câu hỏi thiết kế: làm sao đưa kế hoạch qua phân công đến lịch có giờ và phòng hợp lệ, trong khi mỗi vai trò chỉ tác động đúng phạm vi? Đây là động cơ thiết kế từ yêu cầu dự án, chưa có khảo sát định lượng về tiết kiệm thời gian.

Nguồn: README.md; ROOM_IMPLEMENTATION.md

## 03. Ba vai trò chia sẻ một quy trình rõ trách nhiệm

Thời lượng: 55 giây. Hình thức: Phạm vi sản phẩm.

Giáo vụ nhập và chia lớp, quản lý phòng, gửi bộ môn, xếp lịch và công bố. Trưởng bộ môn cập nhật năng lực và phân công trong phạm vi bộ môn. Giảng viên xem lịch riêng và khai báo lịch ngoài sau công bố. Giảng viên được phân công trước khi chạy solver.

Nguồn: README.md; docs/UI_UX_REDESIGN.md

## 04. Bàn giao theo trạng thái trước khi chạy solver

Thời lượng: 55 giây. Hình thức: Luồng nghiệp vụ.

UNSENT chưa giao; SENT cho phép trưởng bộ môn sửa; SUBMITTED khóa sửa. Giáo vụ trả riêng một bộ môn kèm lý do về SENT. Chỉ khi các bộ môn nộp hợp lệ, có khung giờ và phòng mới chạy solver. Công bố yêu cầu hard bằng 0.

Nguồn: docs/UI_UX_REDESIGN.md; backend/app/domain_rules.py

## 05. Kế hoạch 67 dòng được chuyển thành 290 buổi học

Thời lượng: 55 giây. Hình thức: Dữ liệu đầu vào.

Số liệu mô tả phạm vi dữ liệu đã nhập và kiểm chứng, không phải số buổi đã xếp lịch thành công. Nguồn chính là ke_hoach_mo_lop_HK1_2026.xlsx được duyệt; không trộn dữ liệu FIT tham khảo. 42 STANDARD + 13 CLC + 12 TT = 67 offering. Giữ 4 cờ học liền và 2 dòng chỉ định số lớp.

Nguồn: data/fall2026/README.md; ROOM_IMPLEMENTATION.md; verification/RESULTS.md

## 06. Phòng cụ thể là tài nguyên bắt buộc của mỗi buổi

Thời lượng: 55 giây. Hình thức: Mô hình ràng buộc.

Placement gồm buổi, khung giờ và room_id; giảng viên đã được phân công. Phòng phải hoạt động, đủ chỗ, đúng thiết bị/loại/điều kiện và chứa toàn buổi trong một khung khả dụng. Không suy ra phòng từ TKB tham khảo. Soft có trọng số nguyên 0–1000, mặc định 1; hard luôn ưu tiên.

Nguồn: ROOM_IMPLEMENTATION.md; backend/app/domain_rules.py

## 07. Ba chiến lược tìm kiếm giờ và phòng

Thời lượng: 75 giây. Hình thức: Thuật toán.

Khởi tạo tham lam xếp buổi nhiều ràng buộc, dài và có miền nhỏ trước. Mỗi bước thay giờ/phòng của một buổi và so sánh điểm (H,S), ưu tiên H. HC chỉ nhận điểm tốt hơn. SA không nhận H tăng; khi H bằng nhau có thể nhận S tăng với xác suất phụ thuộc nhiệt độ giảm dần. Tabu giữ 15 bước đảo, chấp nhận bước không bị cấm kể cả khi xấu hơn, trừ khi bước cấm cải thiện best thì được phép. Các ví dụ chỉ giải thích quy tắc, không phải số liệu thực nghiệm. Bộ giải trả lịch khi H=0; chưa chứng minh tối ưu toàn cục. Các worker chạy qua thread Python nên chưa chứng minh tăng tốc CPU.

Nguồn: backend/app/solver.py; backend/app/domain_rules.py

## 08. Related Work & Technical Contributions

Thời lượng: 80 giây. Hình thức: Đối chiếu phương pháp.

UniTime hỗ trợ lập lịch đại học với miền giờ, phòng và các ràng buộc phân bố. OR-Tools cung cấp bộ giải CP-SAT tổng quát; ứng dụng phải mô hình hóa và tích hợp nghiệp vụ. So sánh này là phân tích phạm vi, không phải thử nghiệm hiệu năng. Khoảng trống của dự án là tích hợp quy trình phân công và quy tắc dữ liệu của đơn vị; không khẳng định hệ thống khác không thể đáp ứng. Nhóm triển khai bộ đánh giá, miền placement, khởi tạo tham lam, HC/SA/Tabu và quy trình snapshot/RBAC. Các metaheuristic là phương pháp đã có; FastAPI, Next.js, Supabase, SQLAlchemy và openpyxl là thành phần tái sử dụng.

Nguồn: UniTime: help.unitime.org/manuals/courses-solver.html • OR-Tools: developers.google.com/optimization/cp

## 09. Giáo vụ xem lịch của toàn bộ 290 buổi học

Thời lượng: 55 giây. Hình thức: Minh chứng: STAFF.

Ảnh giao diện thật trên bộ giả lập toàn học kỳ, không phải API fixture. Màn Lịch học kỳ chứa đủ 290 ID buổi, được đối chiếu tự động với kế hoạch; lọc theo khóa, giảng viên và thứ. Ảnh trên slide trích phần đầu để đọc được; ảnh toàn trang và sáu ảnh theo ngày được bàn giao trong thư mục verification/full-term-simulation. Đã công bố vào PostgreSQL cục bộ, chưa công bố trên hosted.

Nguồn: verification/full-term-simulation/staff-entire-term.png; browser-results.json

## 10. Trưởng bộ môn kiểm tra phân công toàn học kỳ

Thời lượng: 55 giây. Hình thức: Minh chứng: HEAD / CNPM.

Ảnh Trưởng bộ môn CNPM trên dữ liệu thật của bộ thử nghiệm 290 buổi. Bộ môn được giáo vụ trả lại qua API thật; TBM xem 11 lớp của giảng viên mẫu bằng bộ lọc rồi nộp lại. Các lớp của bộ môn khác vẫn nằm ngoài quyền xem và sửa. Không gọi đây là lịch toàn bộ khoa của HEAD; minh chứng là nghiệp vụ phân công trong phạm vi bộ môn.

Nguồn: verification/full-term-simulation/head-full-term-assignment.png; browser-results.json

## 11. Giảng viên mẫu có đủ 11 buổi trong lịch cá nhân

Thời lượng: 55 giây. Hình thức: Minh chứng: TEACHER.

Giảng viên dùng profile giảng viên mẫu trong database cục bộ. Tài khoản Auth demo hiện có được ánh xạ tới giảng viên mẫu chỉ trong database thử nghiệm; không sửa profile trên hosted. Lịch cá nhân lấy từ snapshot 290 buổi đã công bố và trả đúng 11 buổi. Có ảnh tuần mở toàn bộ khung giờ, danh sách đủ 11 buổi và mobile. Slide trích vùng thứ 2–6, từ 06:00 tới sau buổi cuối 18:50, chứa đủ 11 buổi; thứ 7/chủ nhật trống được bỏ khỏi crop. Bản tuần đầy đủ ở thư mục bằng chứng.

Nguồn: verification/full-term-simulation/teacher-quyennv-calendar.png; browser-results.json

## 12. Kiểm chứng qua năm tầng

Thời lượng: 75 giây. Hình thức: Kết quả kiểm chứng.

Bảng tóm tắt kết quả đã ghi trong báo cáo dự án, không phải một lần chạy kiểm thử mới khi biên tập slide. Báo cáo refactor ghi 48 backend tests đạt. Kiểm thử phòng gồm 19 bài theo tài liệu trước đó; cần phân biệt đây là nhóm con hoặc đợt kiểm thử khác, không cộng vào tổng 48. Oracle 20 lượt đối chiếu bộ đếm xung đột với cách đếm độc lập. Báo cáo tích hợp PostgreSQL dùng Docker để kiểm tra transaction, revision và rollback. Browser smoke 14 command theo báo cáo refactor dùng Auth/API fixture; thử nghiệm toàn học kỳ 290 buổi dùng Auth/API thật và database cục bộ, phòng giả lập 17 phòng. Con số 106.91 giây là một lượt Python trực tiếp, không phải benchmark chung.

Nguồn: docs/REFACTOR_AUDIT.md; verification/full-term-simulation/README.md; backend/tests/

## 13. Phạm vi bằng chứng và nguồn dữ liệu

Thời lượng: 80 giây. Hình thức: Nguồn dữ liệu • resources.

Đối chiếu trực tiếp resources ngày 08/11/2026: so_phong.csv có 25 phòng duy nhất, gồm 10 máy chiếu, 14 máy tính và 1 kết hợp. Hai phòng 200 chỗ, ba phòng 150 chỗ, sáu phòng 100 chỗ và 14 phòng 45 chỗ. Phòng kết hợp 206A1 có 100 chỗ, chỉ tính là một phòng vật lý. Nguồn có tên, tính chất và sức chứa; không có khung khả dụng hoặc reservation. bo_mon.csv có 4 dòng; giang_vien.csv có 35; quy_uoc_phan_cong.csv có 104 dòng quy ước, không đồng nghĩa 104 năng lực duy nhất. Lịch ngoài có 22 dòng, tất cả gia_dinh=x. Kế hoạch chính là ke_hoach_mo_lop_HK1_2026.xlsx; 67 offering và 290 buổi là kết quả chuyển đổi đã duyệt. Workbook FIT chỉ tham khảo. Kết quả 290/290, hard=0 thuộc bộ thử 17 phòng giả lập và 7 bổ sung năng lực, chưa xác minh lại trên danh mục 25 phòng. Không đưa nội dung tai_khoan.csv lên slide.

Nguồn: resources/*.csv; ke_hoach_mo_lop_HK1_2026.xlsx; presentation/resource-audit.json

## 14. Từ phiên bản hiện tại đến nghiệm thu vận hành

Thời lượng: 65 giây. Hình thức: Tiến độ và giới hạn.

Phiên bản hiện tại tách route, command, model/rules, solver và storage; frontend tổ chức theo feature. Đây là thay đổi cấu trúc mã, không thay hợp đồng API. Commit trước bổ sung tối ưu đánh giá nháp, skeleton loaders và preset lịch ngoài. Báo cáo refactor ghi nhận 48 tests cùng typecheck/build; smoke mới dùng Auth/API fixture, khác với lượt thử toàn học kỳ có Auth/API thật và DB cục bộ. Chưa chạy lại ứng dụng khi biên tập presentation. Hướng tiếp theo là xác nhận dữ liệu, benchmark nhiều seed, sau đó giải quyết solver đồng bộ và kiểm thử tải.

Nguồn: git f432b3e, 50fcd3d; docs/REFACTOR_AUDIT.md; README.md

## 15. Đã chứng minh luồng lập lịch đầy đủ trên bộ giả lập

Thời lượng: 45 giây. Hình thức: Kết luận và thảo luận.

Đóng góp hiện đã có bằng chứng toàn quy trình: giữ kế hoạch 67 dòng, phân 290 buổi, xếp giờ/phòng hard=0 trên 17 phòng giả lập; không phải danh mục 25 phòng hiện tại, công bố cục bộ và ba vai trò thao tác qua Auth/API/DB thật. giảng viên mẫu có 11 buổi riêng. Sửa khởi tạo đã giải quyết thất bại được tái hiện trong cấu hình này, không bảo đảm mọi đầu vào đều giải được. Tiếp theo là thay các giả định bằng dữ liệu phòng và năng lực được duyệt, nghiệm thu và benchmark rộng hơn.

Nguồn: verification/full-term-simulation/browser-results.json; manifest.json; optimized/readiness.json
