# ScheduleSolver — Tóm tắt dự án

## 1. Tổng quan

**ScheduleSolver** là ứng dụng desktop hỗ trợ Khoa Công nghệ Thông tin – Đại học Hà Nội (FIT–HANU) phân công giảng viên, xếp thời khóa biểu và tổng hợp lịch giảng dạy cá nhân từ nhiều trường.

Hệ thống hướng tới thời khóa biểu **đủ buổi, không xung đột và thuận tiện cho giảng viên**, đồng thời cho phép giáo vụ chủ động kiểm tra, chỉnh sửa và công bố.

Tài liệu này xác định định hướng sản phẩm. **Mã nguồn hiện tại là bản thử nghiệm, chưa xác lập luồng nghiệp vụ chính thức và có thể được xây dựng lại từ đầu.**

## 2. Vấn đề cần giải quyết

- Xếp lịch và phân công bằng Excel mất nhiều thời gian, khó cập nhật và dễ bỏ sót xung đột.
- Lịch giảng viên thường rời rạc: nhiều ca trống, ngày chỉ dạy một ca, phải lên trường nhiều ngày.
- Giảng viên dạy nhiều trường phải tự ghép lịch, kiểm tra trùng giờ và thời gian di chuyển.
- Dữ liệu thực tế không đồng nhất: tên viết tắt, thiếu mã giảng viên, nhiều mẫu Excel, tuần học và ngày bắt đầu khác nhau giữa các khóa.

## 3. Tác nhân và trách nhiệm

| Tác nhân | Trách nhiệm chính |
|---|---|
| **Trưởng khoa** | Lập và chốt kế hoạch mở lớp; xác định danh sách giảng viên đủ điều kiện phụ trách từng môn. |
| **Giáo vụ** | Tiếp nhận kế hoạch, cấu hình và chạy xếp lịch, chỉnh sửa, kiểm tra và công bố thời khóa biểu. |
| **Giảng viên** | Khai báo giờ bận và ưu tiên; xem lịch cá nhân; nhập lịch trường khác và chia sẻ khung giờ bận với giáo vụ. |
| **Quản trị** | Quản lý tài khoản và vai trò; có thể gộp trách nhiệm này vào trưởng khoa trong phạm vi ban đầu. |

## 4. Giải pháp và luồng nghiệp vụ

1. **Chuẩn bị kế hoạch:** nhập môn, lớp/tổ, loại Lecture/Tutorial/gộp, thời lượng, tuần học và danh sách giảng viên có thể phụ trách.
2. **Bổ sung điều kiện:** khai báo bảng ca, lịch học theo khóa, phòng, giờ bận và các buổi đã cố định; kiểm tra dữ liệu trước khi xếp.
3. **Đề xuất thời khóa biểu:** tự phân công giảng viên trong danh sách cho phép và chọn ngày/ca; hiển thị các buổi chưa xếp được và nguyên nhân kiểm tra được.
4. **Rà soát và công bố:** giáo vụ chỉnh tay, khóa các phân công cần giữ, kiểm tra đầy đủ và xung đột trước khi công bố một phiên bản độc lập.
5. **Sử dụng và phản hồi:** giảng viên xem lịch đã công bố, tổng hợp lịch nhiều trường và chia sẻ giờ bận cho lần xếp tiếp theo. Thay đổi sau công bố được xử lý qua bản nháp mới.

## 5. Dữ liệu đầu vào và kết quả đầu ra

| Đầu vào | Đầu ra |
|---|---|
| Kế hoạch mở lớp: môn, khóa, lớp/tổ, sĩ số, loại buổi, thời lượng, tuần học. | Thời khóa biểu đề xuất: giảng viên, lớp/tổ, ngày/ca, tuần học và phòng khi có dữ liệu. |
| Danh mục giảng viên, khả năng phụ trách, giờ bận, ưu tiên và lịch cố định. | Danh sách lỗi dữ liệu, xung đột và các buổi chưa xếp được. |
| Bảng ca, ngày bắt đầu theo khóa, danh mục phòng và điều kiện sử dụng. | Báo cáo chất lượng lịch: ca trống, ngày một ca, số ngày đi dạy và tải giảng viên. |
| Dữ liệu Excel; lịch trường khác qua nhập tay, Excel hoặc ICS. | Bản công bố, lịch cá nhân/lịch gộp và tệp xuất Excel/ICS. |
| Cấu hình xếp lịch: thời gian chạy, seed, số luồng và các ưu tiên tối ưu. | Dự án được lưu để tiếp tục chỉnh sửa, xếp lại và đối chiếu phiên bản. |

Workbook `FIT Time table Fall2026 V5.2.xlsx` là dữ liệu vận hành tham chiếu. Phải kiểm tra và chuẩn hóa trước khi sử dụng; không mặc định mọi dòng đã đầy đủ hoặc đại diện một buổi học duy nhất. Xử lý an toàn các mã FIT/MME/66FIT, tuần rời rạc và lịch bắt đầu khác nhau giữa các khóa.

## 6. Nguyên tắc xếp lịch

- **Điều kiện bắt buộc:** đủ các buổi theo kế hoạch; giảng viên đúng danh sách được phép; không trùng giảng viên, giờ bận, phòng hoặc nhóm học có xung đột đã xác định; tuân thủ thời lượng, tuần học và các phân công cố định.
- **Mục tiêu tối ưu:** giảm ca trống, ngày chỉ dạy một ca và số ngày lên trường; hạn chế quá tải, cân bằng phân công và giảm xáo trộn khi xếp lại.
- **Cách giải:** bộ giải Java tự xây dựng, tạo lịch ban đầu rồi cải thiện bằng tìm kiếm cục bộ/metaheuristic; định hướng chạy nhiều chiến lược song song và giữ lời giải tốt nhất.
- **Tính minh bạch:** ưu tiên tính hợp lệ trước chất lượng; không cam kết tối ưu toàn cục. Nếu chưa có lịch hợp lệ, phải báo rõ phần chưa giải quyết và không cho công bố như lịch hoàn chỉnh.

## 7. Phạm vi và tiêu chí thành công

**Ưu tiên bản đầu:** kế hoạch mở lớp → giờ bận → phân công/xếp lịch → chỉnh tay và cố định → kiểm tra → công bố → xem lịch cá nhân; kèm lưu dữ liệu, nhập/xuất Excel và phân quyền theo vai trò.

**Giai đoạn tiếp theo:** tối ưu nâng cao và chạy song song, lịch gộp đa trường, nhập/xuất ICS, cảnh báo di chuyển và so sánh phương án.

**Ngoài phạm vi ban đầu:** đăng ký học phần của sinh viên, lịch thi, lương/thù lao, điều phối phòng toàn trường, đồng bộ trực tiếp hệ thống đào tạo và ứng dụng web/mobile.

Sản phẩm đạt yêu cầu khi:

- Luồng nghiệp vụ chính chạy xuyên suốt; bản công bố đủ buổi và không còn vi phạm cứng.
- Chất lượng lịch được đo và đối chiếu với lịch thủ công trên cùng dữ liệu, cùng điều kiện.
- Mục tiêu thực nghiệm: tìm lịch hợp lệ cho bộ mẫu khoảng 160 lớp/tổ và 30 giảng viên trong 60 giây trên máy được ghi rõ cấu hình; kết quả phải được kiểm chứng bằng đo đạc.
- Giao diện vẫn phản hồi trong khi xếp lịch và xử lý tệp; lưu/công bố bảo đảm nhất quán dữ liệu.

**Nền tảng dự kiến:** Java 21, JavaFX, Maven, H2/JDBC, Apache POI và JUnit. Thiết kế chi tiết, schema, ràng buộc và kế hoạch triển khai được quản lý ở tài liệu riêng để giữ brief ngắn gọn.
