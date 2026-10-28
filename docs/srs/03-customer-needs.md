# Bước 3 — Nhu cầu khách hàng (WHAT)

**Phiên bản:** 0.2 · **Trạng thái:** Đã lập từ các vòng phỏng vấn, có FR/NFR tương ứng ở trạng thái Draft.  
**Đầu vào:** [Customer Problems](01-customer-problems.md), [Software Glance](02-software-glance.md).

Người dùng đã xác nhận: giáo vụ nhận phương án còn thiếu và xử lý; demo có TKB trên ứng dụng, Excel và báo cáo. Việc nhận/xem phương án chưa đầy đủ không tự động công bố nó là lịch hoàn chỉnh. Các nhu cầu dưới đây mô tả kết quả cần nhận, không chọn thuật toán hay cách triển khai.

## Nhu cầu từ CP.01 — Đáp ứng kế hoạch

### CN.01.1 — Phương án thời khóa biểu

Giáo vụ **cần ScheduleSolver tạo phương án TKB cho các chương trình đào tạo** từ kế hoạch mở lớp đã đối soát và các điều kiện đầu vào, với mức đáp ứng tốt nhất tìm được trong ngân sách chạy.

- **Outcome Class:** Construction.
- **Traces to:** CP.01.
- **Điều kiện:** Không hứa lịch đầy đủ với mọi input; không bỏ điều kiện cứng để che phần chưa giải quyết.

### CN.01.2 — Phần chưa đáp ứng

Giáo vụ **cần ScheduleSolver cho biết các buổi còn thiếu, xung đột và trạng thái tìm kiếm** khi nhận một phương án, kể cả lúc dữ liệu giờ bận làm khó việc xếp đủ.

- **Outcome Class:** Information.
- **Traces to:** CP.01.
- **Điều kiện:** Phân biệt input lỗi, mâu thuẫn có căn cứ, hết ngân sách và chưa tìm được lịch hợp lệ.

## Nhu cầu từ CP.02 — Giáo vụ trong vòng quyết định

### CN.02.1 — Căn cứ đánh giá

Giáo vụ **cần ScheduleSolver cho biết mức đáp ứng từng tiêu chí Verify và các vi phạm cụ thể** đối với phiên bản phương án đang xem xét.

- **Outcome Class:** Information.
- **Traces to:** CP.02.
- **Điều kiện:** Nêu đối tượng/thời gian liên quan, phân biệt lỗi cứng và cảnh báo; điểm tổng không thay báo cáo chi tiết.

### CN.02.2 — Kiểm soát việc hoàn thiện lịch

Giáo vụ **cần ScheduleSolver hỗ trợ kiểm soát quá trình chỉnh sửa, giữ cố định và công bố lịch** sau khi nhận phương án, bao gồm phương án còn thiếu để tiếp tục xử lý.

- **Outcome Class:** Control.
- **Traces to:** CP.02.
- **Điều kiện:** Nhận lịch thiếu khác với công bố lịch hoàn chỉnh; bản công bố không tự thay đổi khi sửa nháp hoặc cập nhật giờ bận.

### CN.02.3 — Tài liệu bàn giao

Giáo vụ **cần ScheduleSolver tạo tệp Excel chứa TKB và báo cáo đánh giá** cho cùng phiên bản lịch được xem trong ứng dụng.

- **Outcome Class:** Construction.
- **Traces to:** CP.02.
- **Điều kiện:** Lưới theo mẫu nghiệp vụ `Timetable Spring 2026`; kèm Verify/metric và trạng thái đầy đủ/chưa đầy đủ; không giả định mọi phương án xuất được đều đủ điều kiện công bố.

## Nhu cầu từ CP.03 — Chất lượng lịch

### CN.03.1 — Hiểu chất lượng và đánh đổi

Giảng viên và giáo vụ **cần ScheduleSolver cho biết độ gọn, tải và mức xáo trộn của các phương án** khi so sánh trên cùng tập buổi, điều kiện và bộ metric hiện tại.

- **Outcome Class:** Information.
- **Traces to:** CP.03.
- **Điều kiện:** Hiển thị metric gốc và điểm tổng, cách tính theo tuần hoạt động; không tự đổi trọng số.

### CN.03.2 — Phương án được cải thiện

Giáo vụ **cần ScheduleSolver tạo phương án có chất lượng tốt nhất tìm được** theo objective đã xác định, trong điều kiện đầu vào và ngân sách được chọn.

- **Outcome Class:** Construction.
- **Traces to:** CP.03.
- **Điều kiện:** Ưu tiên hợp lệ trước chất lượng mềm; cố gắng tránh trùng chéo môn khi có thể; không cam kết tối ưu toàn cục hay tự thêm trọng số.

## Nhu cầu từ CP.04 — Lịch gộp và riêng tư

### CN.04.1 — Lịch cá nhân tổng hợp

Giảng viên **cần ScheduleSolver cho biết lịch dạy chi tiết của chính mình ở các trường** trên cùng trục ngày/giờ thực, khi xem lịch cá nhân.

- **Outcome Class:** Information.
- **Traces to:** CP.04.
- **Điều kiện:** Có nguồn trường, lịch đã công bố của khoa và dấu hiệu trùng giờ; dữ liệu giả lập được đánh dấu, lịch GV khác không thuộc quyền xem.

### CN.04.2 — Giới hạn thông tin được chia sẻ

Giảng viên **cần ScheduleSolver kiểm soát việc cung cấp thông tin lịch trường khác cho giáo vụ và trưởng khoa** để chỉ chia sẻ trường, ngày và khung giờ bận.

- **Outcome Class:** Control.
- **Traces to:** CP.04.
- **Điều kiện:** Không chia sẻ môn, lớp, phòng hoặc chi tiết riêng khác qua màn hình, báo cáo hay tệp xuất cho quản lý.

## Nhu cầu từ CP.05 — Tái lập và input mới

### CN.05.1 — Căn cứ thực nghiệm

Chủ dự án và người nghiệm thu **cần ScheduleSolver cho biết đầy đủ input, cấu hình và kết quả của một lần chạy** để đối chiếu và tái lập trong cùng điều kiện xác định.

- **Outcome Class:** Information.
- **Traces to:** CP.05.
- **Điều kiện:** Có nguồn/phiên bản dữ liệu, seed, metric, ngân sách và chế độ đồng thời; không coi seed riêng lẻ là đủ cho mọi chế độ chạy.

### CN.05.2 — Kết quả cho kế hoạch mới

Giáo vụ và người nghiệm thu **cần ScheduleSolver tạo đầu ra theo cùng hợp đồng nghiệp vụ khi thay đầu vào bằng kế hoạch hợp lệ mới** mà không dựa vào đáp án cố định của workbook mẫu.

- **Outcome Class:** Construction.
- **Traces to:** CP.05.
- **Điều kiện:** Lịch và báo cáo phản ánh dữ liệu mới; nếu chưa giải đủ thì báo trạng thái tương ứng, không bịa thêm nhu cầu hay phân công.

## Nhu cầu từ CP.06 — Dữ liệu đúng nghĩa

### CN.06.1 — Biết dữ liệu cần đối soát

Trưởng khoa và giáo vụ **cần ScheduleSolver cho biết dữ liệu thiếu, mơ hồ, trùng và nguồn gốc giả lập** trước khi dùng để đánh giá nhu cầu hoặc xếp lịch.

- **Outcome Class:** Information.
- **Traces to:** CP.06.
- **Điều kiện:** Truy được sheet/dòng/trường hoặc nguồn nhập; không tự suy diễn danh tính và không âm thầm bỏ chương trình đào tạo.

### CN.06.2 — Kế hoạch có thể sử dụng

Trưởng khoa và giáo vụ **cần ScheduleSolver tạo bản kế hoạch đã đối soát** từ nguồn đầu vào và các xác nhận sửa dữ liệu để làm căn cứ thống nhất cho lần xếp lịch.

- **Outcome Class:** Construction.
- **Traces to:** CP.06.
- **Điều kiện:** Giữ tập tuần rời rạc, lịch theo khóa, mã buổi và GV được xác nhận; không coi số dòng Excel là số buổi độc lập.

## Tổng kết và kiểm tra

13 CN: **6 Information, 2 Control, 5 Construction, 0 Entertainment**. Mỗi CN có một lớp kết quả và một CP cha hợp lệ; mọi CP đều có ít nhất một CN. CN.01.1 tập trung đáp ứng nhu cầu, CN.03.2 tập trung cải thiện chất lượng; CN.02.3 là sản phẩm bàn giao còn CN.02.1/CN.03.1 là thông tin để xem xét.

Kết quả Zigzag sau bước 3 và rà toàn chuỗi sau bước 5 được lưu tại [traceability-matrix.md](traceability-matrix.md). Đã có [Software Vision](04-software-vision.md), [20 FR](functional-requirements/_index.md) và [7 NFR](non-functional-requirements/_index.md). Truy vết đặc tả không đồng nghĩa sản phẩm đã được nghiệm thu.
