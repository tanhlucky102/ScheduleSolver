# Bước 0 — Bối cảnh nghiệp vụ ScheduleSolver

**Phiên bản:** 0.5 · **Ngày:** 26/10/2026 · **Trạng thái:** Đã ghi nhận quyết định của người dùng; các đề xuất chưa xác nhận được đánh dấu riêng.

## 1. Nhận diện dự án

| Thuộc tính | Nội dung |
|---|---|
| Tên | ScheduleSolver |
| Miền | Phân công và xếp thời khóa biểu đại học tại FIT–HANU, tổng hợp lịch cá nhân nhiều trường |
| Mục đích | Tạo TKB đủ nhu cầu đào tạo, có thể kiểm tra và đo chất lượng, đồng thời bảo vệ chi tiết lịch riêng của GV |
| Mô hình vận hành | Demo chuyển vai trò trên một máy; chưa yêu cầu triển khai nhiều máy |
| Ngày khởi động | Chưa có thông tin xác nhận; ngày tài liệu không phải ngày bắt đầu dự án |
| Hiện trạng mã | Bản thử nghiệm, có thể xây dựng lại; không phải đặc tả nghiệp vụ chính thức |

## 2. Căn cứ và các quyết định đã xác nhận

Nguồn: [PROJECT_BREIF.md](../../PROJECT_BREIF.md), trao đổi trực tiếp với chủ dự án, [khảo sát workbook](../WORKBOOK_FINDINGS.md). Số liệu khảo sát là bằng chứng về dữ liệu, không phải xác nhận của người dùng về mọi quy tắc nghiệp vụ.

| Mã | Quyết định từ người dùng |
|---|---|
| DEC.01 | Kế hoạch mở lớp là đầu vào thứ nhất và cần thiết cho việc xếp lịch. |
| DEC.02 | Đích nghiệp vụ là tạo TKB cho các chương trình đào tạo khác nhau được biểu diễn trong bảng `Timetable Spring 2026`. Không yêu cầu sao chép nguyên các phân công của lịch thủ công. |
| DEC.03 | `Verify` cung cấp tiêu chí để giáo vụ xem xét lịch, không phải tập phương án đầu ra hoặc toàn bộ objective tối ưu. |
| DEC.04 | Lịch gộp đa trường và solver song song đều bắt buộc trong demo; có yêu cầu concurrency. |
| DEC.05 | Chỉ GV sở hữu được xem chi tiết lịch gộp. Giáo vụ và trưởng khoa được biết trường, ngày và khung giờ bận; không được xem môn, lớp, phòng hoặc chi tiết riêng khác. |
| DEC.06 | Demo chuyển vai trò trên một máy; chuyển vai trò không tự động có nghĩa đã có xác thực tài khoản. |
| DEC.07 | Chưa có lịch bận thực tế của GV; cho phép dùng dữ liệu giả định có công bố nguồn gốc. |
| DEC.08 | Phạm vi đánh giá dựa trên kế hoạch mở lớp hiện có; quy mô lấy từ dữ liệu đã chuẩn hóa, không cố định 160 lớp/tổ hoặc 30 GV. |
| DEC.09 | Cần xử lý được input mới và tái lập kết quả; không chỉ tạo một TKB cố định cho bộ mẫu. |
| DEC.10 | Thuật toán được đề xuất: Local Search, Simulated Annealing và Tabu Search; cần objective và metric đo độ tối ưu. Chưa xác nhận phải triển khai cả ba như ba bộ giải độc lập. |
| DEC.11 | Mục tiêu trả phương án tốt nhất tìm được theo điểm; mức đáp ứng phụ thuộc điều kiện đầu vào, giáo vụ luôn xem xét và quyết định cuối. Không bảo đảm tối ưu toàn cục. |
| DEC.12 | Giữ các metric hiện tại; không tự điều chỉnh trọng số. Tránh trùng chéo môn khi có thể là mục tiêu mềm, không mặc định cấm tuyệt đối. |
| DEC.13 | Giáo vụ chủ động nhận lịch còn thiếu và xử lý; nhận phương án không có nghĩa tự công bố như lịch hoàn chỉnh. |
| DEC.14 | Demo cần cả TKB trong ứng dụng và đầu ra Excel TKB/báo cáo Verify, metric. |
| DEC.15 | ~~Demo chọn vai trò và mã GV, không yêu cầu đăng nhập.~~ Thay bằng DEC.24. |
| DEC.16 | Lịch trường khác nhập tay là đủ cho demo nhưng phải có đủ thông tin nghiệp vụ; ICS và nhập/xuất lịch trường khác qua Excel không bắt buộc. Excel kế hoạch/TKB/báo cáo vẫn bắt buộc theo DEC.14. |
| DEC.17 | Đặc tả toàn bộ 13 CN, mỗi FR có ít nhất hai tiêu chí nghiệm thu; chỉ chỉnh tài liệu, không đổi code/schema trong bước này. |
| DEC.18 | ~~Lịch ngoài bắt buộc GV, trường, môn, lớp, ngày và giờ bắt đầu/kết thúc; demo có buổi đơn và lặp tuần với khoảng hiệu lực, ngày nghỉ ngoại lệ.~~ Thay bằng DEC.19. |
| DEC.19 | (28/10/2026) GV **không chọn tuần bận**: lịch bận là cố định cho cả học kỳ, gồm thứ, ca bắt đầu–kết thúc, nơi bận (giáo vụ thấy) và ghi chú riêng (chỉ GV thấy). TKB của khoa là lịch tuần cố định cho cả kỳ. |
| DEC.20 | (28/10/2026) Giao diện dùng **Java Swing** theo bài giảng Day 05, thay JavaFX. |
| DEC.21 | (28/10/2026) Lưu dữ liệu bằng file: CSV (danh sách GV, quy ước phân công, lịch bận) và Object Serialization (file dự án `.ssp`). Không dùng H2/JDBC vì ứng dụng chưa cần CSDL nhiều người dùng. |
| DEC.22 | (28/10/2026) **Quy ước phân công theo chương trình**: Đại trà/MME chọn GV Lec và GV Tut riêng; CLC/TT mỗi lớp học Lec+Tut liền nhau do 1 GV; môn 4 tiết là khối 2 ca. Bảng quy ước (môn, GV, dạy Lec, dạy Tut) do trưởng khoa duyệt; xem `docs/QUY_UOC_PHAN_CONG.md`. |
| DEC.23 | (28/10/2026) Giải thuật dùng đúng 3 hướng thầy đề xuất: Local Search (leo đồi), Simulated Annealing, Tabu Search, chạy song song nhiều luồng (thread pool). Ràng buộc cứng theo 4 tiêu chí sheet `Verify`; metric và trọng số ở `docs/GIAI_THUAT_VA_METRICS.md`. |
| DEC.24 | (28/10/2026) Có **màn hình đăng nhập cho 3 actor** (Trưởng khoa, Giáo vụ, Giảng viên). Tài khoản lưu trong `resources/tai_khoan.csv`, mật khẩu băm SHA-256; mỗi giảng viên một tài khoản gắn với mã GV và chỉ xem được lịch của mình. Mọi danh sách trên giao diện sắp xếp A–Z. |

## 3. Nguyên tắc nghiệp vụ

| Mã | Nguyên tắc | Phân loại | Căn cứ và cách kiểm tra |
|---|---|---|---|
| BP.01 | TKB phải đáp ứng nhu cầu từ kế hoạch và giải thích được các buổi chưa xếp hoặc xung đột. | Bắt buộc / Mandatory | DEC.01–DEC.03; đối chiếu độ phủ và báo cáo Verify. |
| BP.02 | Chi tiết lịch trường khác chỉ thuộc quyền xem của GV sở hữu; người quản lý chỉ thấy trường/ngày/khung bận. | Bắt buộc / Mandatory | DEC.05; đối chiếu nội dung xem/xuất theo từng vai trò. |
| BP.03 | Kết quả phải tạo được từ dữ liệu đầu vào và cấu hình đã lưu; không phụ thuộc một lịch đáp án được mã hóa sẵn. | Bắt buộc / Mandatory | DEC.09; chạy lại và dùng bộ input mới. |
| BP.04 | Dữ liệu giả định phải phân biệt được với dữ liệu thực, không dùng để khẳng định lịch vận hành thực tế đã đúng. | Bắt buộc / Mandatory | DEC.07; kiểm tra nhãn nguồn, seed và kịch bản dữ liệu. |
| BP.05 | Giáo vụ có căn cứ đánh giá độ hợp lệ và chất lượng trước khi công bố. | Định hướng / Guiding | DEC.03, DEC.10; báo cáo vi phạm và metric giải thích được. |
| BP.06 | Lịch GV gọn hơn lịch thủ công trên cùng nhu cầu và điều kiện. | Mong muốn / Aspirational | Brief; cần chốt mức cải thiện và phép đo, chưa có số liệu đạt được. |

## 4. Các bên liên quan

| Vai trò | Quan tâm | Mức ảnh hưởng |
|---|---|---|
| Chủ dự án/người nghiệm thu | Đúng bài toán, concurrency, tái lập và bằng chứng đánh giá | Quyết định phạm vi và nghiệm thu |
| Trưởng khoa | Nhu cầu đào tạo, GV đủ điều kiện, tải phân công | Xác nhận nghiệp vụ kế hoạch và chính sách |
| Giáo vụ | TKB các chương trình, Verify, chỉnh sửa và công bố | Xác nhận lịch và tính thực dụng |
| Giảng viên | Lịch cá nhân, giờ bận nhiều trường, quyền riêng tư | Cung cấp dữ liệu và phản hồi |
| Nhóm phát triển | Tính khả thi, thuật toán và thực nghiệm | Đề xuất kỹ thuật, không tự chốt quy tắc nghiệp vụ |
| Sinh viên | Lịch học đáp ứng chương trình | Hưởng lợi gián tiếp; chưa có vai trò sử dụng |

Demo không có quản trị tài khoản/đăng nhập; có thể mở rộng sau. Không có tên cá nhân, cơ quan quản lý hay nghĩa vụ pháp lý bổ sung được xác nhận.

## 5. Tình hình hiện tại

**Quy trình tham chiếu:** lập kế hoạch mở lớp → giáo vụ phân công/xếp bằng Excel → xem xét bằng Verify → chia sẻ TKB. GV có nhu cầu tổng hợp lịch nhiều trường.

**Khó khăn:** dữ liệu không đồng nhất; kiểm tra thủ công dễ bỏ sót; lịch GV rời rạc; chưa có dữ liệu giờ bận thực; khó chứng minh phương án tốt hơn và tái lập trên input mới. Chưa đo thời gian lao động, số lỗi hoặc chi phí hiện tại; không gán số liệu giả cho các khó khăn này.

**Công cụ và dữ liệu:** workbook `FIT Time table Fall2026 V5.2.xlsx` có kế hoạch, lưới TKB, Verify và các sheet chương trình/cập nhật. Khảo sát ghi nhận 290 dòng kế hoạch có mã môn, nhưng không tương đương 290 buổi độc lập. Lưới TKB cũ có các ô thiếu thông tin; không dùng nguyên trạng làm lời giải chuẩn tuyệt đối.

**Điểm cần giữ:** kế hoạch làm căn cứ nhu cầu; dạng lưới TKB quen thuộc; tiêu chí Verify hỗ trợ giáo vụ; nguồn dữ liệu Excel có thể đối chiếu theo vị trí.

## 6. Ranh giới

**Trong demo bắt buộc:** kế hoạch và chuẩn hóa dữ liệu; GV đủ điều kiện; giờ bận giả lập/nhập thực; phân công/xếp lịch cho các chương trình; lịch nháp và sửa/khóa; Verify; công bố và lịch cá nhân; lịch gộp với giới hạn thông tin; solver song song; objective, metric và thực nghiệm tái lập; lưu và trao đổi dữ liệu phù hợp mẫu nghiệp vụ.

**Ngoài phạm vi:** đăng nhập tài khoản, nhập/xuất lịch trường khác qua ICS/Excel, đăng ký học phần từng SV, lịch thi, thù lao, điều phối phòng toàn trường, web/mobile, triển khai nhiều máy, đồng bộ trực tiếp hệ thống đào tạo.

**Hệ thống kề cận:** Excel kế hoạch/TKB/báo cáo; lịch trường khác do GV nhập tay. ICS là hướng mở rộng, không phải điều kiện đạt demo. Không mặc định có API hoặc quyền truy cập lịch trường khác.

## 7. Ràng buộc và ảnh hưởng

| Loại | Ràng buộc | Ảnh hưởng |
|---|---|---|
| Kỹ thuật | Java 21, Maven, Swing, file CSV + Serialization, POI; solver tự viết, không dùng solver hộp đen (DEC.20, DEC.21) | Giới hạn lựa chọn triển khai; không biến công nghệ thành vấn đề khách hàng |
| Học phần | Có concurrency và solver song song | Cần minh chứng hoạt động nhiều worker, chia sẻ kết quả an toàn và thực nghiệm so sánh |
| Dữ liệu | Lịch bận chưa có; tên GV và dữ liệu workbook cần đối soát | Fixture giả lập phải xác định được seed, phiên bản và nguồn |
| Lịch thời gian | Các khóa có thể khác ngày bắt đầu, tuần rời rạc; bảng giờ có điểm cần xác minh | Không hardcode học kỳ; tách kiểm tra ca và kiểm tra giờ thực |
| Quản trị thay đổi | Schema, dependency, interface lõi và trọng số mặc định cần phê duyệt trước khi đổi | Đặc tả objective không đồng nghĩa phê duyệt đổi trọng số |
| Vận hành | Một máy, nhiều vai trò demo | Không giả định có cơ chế cộng tác mạng; vẫn giới hạn dữ liệu theo vai trò |
| Nguồn lực | Chưa xác nhận hạn nộp, quy mô nhóm và ngân sách | Không cam kết tiến độ hay chi phí |

## 8. Tiêu chí thành công và trạng thái

| Mã | Kết quả | Phép đo / đích |
|---|---|---|
| SC.01 | TKB đáp ứng kế hoạch được chọn | Đủ 100% buổi đã chuẩn hóa hoặc báo phần chưa giải; chỉ công bố khi hết vi phạm cứng đã thống nhất. |
| SC.02 | Giáo vụ đánh giá được lịch | Báo cáo từng tiêu chí Verify, nguồn vi phạm và metric; cố gắng tránh trùng chéo môn nhưng không coi cùng khóa là đủ căn cứ để cấm trùng tuyệt đối. |
| SC.03 | Tái lập kết quả | Cùng input chuẩn hóa, cấu hình, seed và chế độ tái lập cho cùng phân công chuẩn hóa và điểm; cần chốt giao thức đồng thời ở bước thiết kế. |
| SC.04 | Tổng quát hóa input | Với input mới hợp lệ/khả thi đã kiểm chứng: tạo output đúng hợp đồng và quy tắc; với input lỗi/chưa giải được: báo đúng trạng thái. Không hứa giải mọi bài toán bất khả thi. |
| SC.05 | Đánh giá chất lượng | Giữ metric hiện tại, đo baseline cùng điều kiện; trả best-so-far và giải thích đánh đổi. Chưa đặt ngưỡng cải thiện bắt buộc, không đồng nhất giảm objective với tối ưu toàn cục. |
| SC.06 | Bảo vệ lịch gộp | GV chỉ xem chi tiết của mình; quản lý chỉ nhận trường, ngày, khung bận, kể cả ở chức năng xuất/báo cáo. |
| SC.07 | Chứng minh concurrency | Nhiều worker cùng tìm kiếm, có best snapshot an toàn; so sánh 1 và nhiều worker trên cùng đầu vào/ngân sách; không mặc định tăng tốc tuyến tính. |
| SC.08 | Hiệu năng | Giữ 60 giây làm mục tiêu thực nghiệm đề xuất trên kế hoạch đã đối soát; ghi số buổi/GV thực, máy và tỷ lệ tìm thấy lịch hợp lệ. Ngưỡng nghiệm thu cuối cần xác nhận. |

## 9. Chuyển giao

Bối cảnh được ghi lại từ các câu trả lời trực tiếp; chưa coi toàn bộ các quy ước thiết kế và ngưỡng đề xuất là đã duyệt. Đã lập CP, SG, CN, SV và bộ FR/NFR theo skill Problem-Based SRS (Gorski & Stadzisz). Xem [truy vết](traceability-matrix.md) cho độ phủ và điểm mở; bộ tài liệu là Draft, chưa phải chứng nhận mã thử nghiệm đáp ứng yêu cầu.
