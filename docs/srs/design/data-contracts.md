# Hợp đồng dữ liệu và bộ nghiệm thu

**Trạng thái:** Draft về ý nghĩa dữ liệu, không phải schema hay migration. Liên quan FR.04.1.1–FR.04.2.2, FR.06.1.1–FR.06.2.2. Bộ trường lịch ngoài đã được người dùng xác nhận trong vòng phỏng vấn bước 5.

## 1. Kế hoạch là input chính

Nguồn ban đầu là sheet `Kế hoạch mở lớp ` trong workbook tham chiếu; chọn bằng tên đã trim và báo nếu nhiều sheet cùng tên chuẩn hóa. Không lấy lưới TKB có sẵn để thay nhu cầu đầu vào. Không tự gộp các sheet cập nhật.

| Nhóm | Nội dung cần xác định |
|---|---|
| Nguồn | Tệp/phiên bản, sheet, dòng, giá trị gốc và các xác nhận đối soát |
| Buổi/section | ID buổi duy nhất, ID section, mã môn, tên môn hoặc trạng thái thiếu, chương trình, khóa, nhóm/tổ |
| Nhu cầu | Lec/Tut/gộp, thời lượng, sĩ số, tập tuần hoạt động |
| Phân công | Tập GV đủ điều kiện, danh tính được xác nhận, giới hạn Lec/Tut, min/max nếu có, nhãn chính/phụ nếu áp dụng |
| Thời gian | Lịch theo khóa, ngày bắt đầu, nghĩa của số tuần nguồn, bảng ca và múi giờ |
| Tài nguyên | Phòng có thực trong dữ liệu, loại/sức chứa khi đã xác nhận; giờ bận; khóa giờ/GV |
| Đánh giá | Chính sách Verify/cứng/mềm; metric áp dụng; target tải; trọng số và baseline khi xếp lại |

Một dòng kế hoạch có thể cần chuyển thành nhiều buổi hoặc cần đối soát; phép chuyển phải có căn cứ và mã truy vết. Thiếu tên môn không tự động xóa nhu cầu có mã hợp lệ; thiếu danh tính GV không được tạo người giả. Thiếu dữ liệu phải được liệt kê để xác nhận trước khi đánh giá đủ điều kiện tương ứng.

Tuần là tập giá trị, không ép thành khoảng liên tục hoặc chỉ 64 tuần. Ngày bắt đầu khóa không suy từ tên sheet Spring/Fall. Các giả định về phòng hay ngày nghỉ phải có nhãn, không trình bày như nguồn đã xác nhận.

## 2. Lịch trường khác nhập tay

> **Cập nhật 28/10/2026 (DEC.19):** bảng dưới là bản Draft cũ. Bản triển khai chỉ giữ: GV, thứ, từ ca, đến ca, nơi bận (giáo vụ thấy), ghi chú riêng (chỉ GV thấy). Lịch bận cố định cả kỳ, không có ngày hiệu lực, kiểu lặp hay ngày ngoại lệ.

| Trường | Bắt buộc | Quy tắc và phạm vi hiển thị |
|---|---|---|
| GV sở hữu | Có, lấy từ mã GV đang chọn | Danh tính cần thiết cho việc phối hợp; không sửa chủ sở hữu bằng cách nhập tên tự do |
| Trường | Có | GV, giáo vụ và trưởng khoa được xem |
| Môn | Có | Chi tiết riêng, chỉ GV sở hữu |
| Lớp/nhóm | Có | Chi tiết riêng, chỉ GV sở hữu |
| Ngày buổi đơn | Có nếu không lặp | Ngày có thực theo lịch |
| Giờ bắt đầu/kết thúc | Có | Kết thúc phải sau bắt đầu; demo xử lý buổi trong cùng ngày, buổi qua đêm phải tách rõ hoặc báo không hỗ trợ |
| Múi giờ | Phải xác định được | Dùng mặc định dự án hiển thị rõ hoặc chọn riêng; không quy đổi ngầm bằng số ca |
| Cơ sở/địa chỉ | Không bắt buộc có giá trị | Cho đánh dấu chưa biết; chỉ GV sở hữu |
| Phòng | Không bắt buộc có giá trị | Cho đánh dấu chưa biết; chỉ GV sở hữu |
| Kiểu lặp | Có lựa chọn | Một buổi hoặc hàng tuần |
| Ngày bắt đầu/kết thúc hiệu lực | Có nếu lặp | Tính cả hai đầu; đầu không sau cuối |
| Thứ lặp | Có nếu lặp | Cho chọn ngày trong tuần; chỉ sinh ngày thuộc khoảng hiệu lực |
| Ngày nghỉ ngoại lệ | Không | Loại lần xuất hiện, không xóa cả chuỗi |
| Ghi chú | Không | Chỉ GV sở hữu; không làm lý do lỗi lộ ra cho quản lý |
| Nguồn thực/giả lập | Có nhãn | Người dùng/fixture xác định; giả lập có seed và phiên bản kịch bản |
| Chia sẻ khung bận | Có trạng thái | Khi chia sẻ, quản lý được xem trường, ngày và giờ bận; không được xem chi tiết riêng |

Phát hiện khoảng thời gian giao nhau dùng các khoảng nửa mở: kết thúc bằng bắt đầu buổi tiếp theo không phải chồng giờ. Cảnh báo thời gian di chuyển chỉ có căn cứ khi có địa điểm và thời gian di chuyển được xác nhận; chưa bắt buộc xây dựng bộ ước lượng đường đi trong demo.

GV A chỉ sửa lịch A trong ngữ cảnh demo. Mỗi lần đổi vai trò phải giới hạn lại dữ liệu hiển thị/xuất. Có thể chọn danh tính khác để trình diễn nhưng đây không phải cơ chế chứng minh người đang cầm máy là GV đó. Phạm vi riêng tư là các đường sử dụng của ứng dụng, không phải chống đọc tệp gốc bằng công cụ ngoài.

## 3. Dữ liệu bận giả lập

Mỗi fixture có tên kịch bản, phiên bản, seed, tập GV, khoảng ngày, bảng giờ/múi giờ và quy tắc tạo bận. Seed fixture tách khỏi seed solver. Giữ nội dung sinh ra để tái lập, không chỉ lưu seed.

Ba kịch bản tối thiểu: chưa có bận ngoài; bận thông thường có lời giải khả thi đã kiểm chứng; nhiều GV bận thứ Hai để kiểm tra báo thiếu/giải thích. Chỉ gọi kịch bản bất khả thi khi có căn cứ chứng minh như số buổi bắt buộc vượt số chỗ thời gian hợp lệ; không dùng thất bại của heuristic làm bằng chứng.

## 4. Hợp đồng output

Mỗi kết quả có phiên bản kế hoạch/input, run ID, phương án, danh sách chưa xếp, Verify, H/S/C và metric, trạng thái dữ liệu, lý do dừng. Có các trạng thái tìm kiếm phân biệt: input không hợp lệ; mâu thuẫn có chứng cứ; hết ngân sách/dừng chưa có lịch hợp lệ; có lịch hợp lệ. Trạng thái bản nháp/công bố là trục riêng, không tự đổi theo trạng thái tìm kiếm.

**TKB ứng dụng/Excel:** ngày/ca, chương trình/khóa/nhóm, môn/loại buổi, GV, tuần và phòng hoặc trạng thái thiếu; theo bố cục nghiệp vụ `Timetable Spring 2026`. Mỗi buổi thiếu vẫn có trong bảng nhu cầu chưa đáp ứng. **Báo cáo:** từng Verify, cảnh báo, nguồn lỗi, đơn vị metric, trọng số, điểm, cấu hình và nhãn giả lập. Không xuất chi tiết riêng lịch ngoài cho quản lý.

Excel xuất từ snapshot cố định cùng phiên bản với báo cáo; xuất trong lúc nháp tiếp tục đổi không trộn phiên bản. Mẫu trường 84 cột là định dạng bổ sung từ mô tả gốc, không thay mẫu lưới đã xác nhận; giữ danh sách header/tuần từ workbook thực và báo phần không ánh xạ được. Mức bắt buộc nghiệm thu 84 cột là điểm mở, không tự mở rộng cam kết demo.

## 5. Bộ nghiệm thu cần chuẩn bị

| Bộ | Nội dung | Kết quả kỳ vọng |
|---|---|---|
| AT.01 | Kế hoạch hiện tại đã đối soát, bảng ca, GV và chính sách xác nhận | Đúng nhu cầu của các chương trình; đo được độ phủ/Verify |
| AT.02 | Bận giả lập thông thường với lời giải tham chiếu khả thi | Tìm kiếm và đánh giá theo cùng điều kiện; không dùng lịch tham chiếu làm output hardcode |
| AT.03 | Nhiều GV bận thứ Hai hoặc khóa xung đột | Trả best-so-far và phần thiếu/lỗi; không tự bỏ giờ bận |
| AT.04 | Đổi thứ tự header, sheet có khoảng trắng, alias chưa rõ, tuần rời rạc/65–70 | Giữ dữ liệu và báo đúng nguồn lỗi |
| AT.05 | Hai GV có lịch ngoài mang giá trị riêng đánh dấu | Không lộ chi tiết qua ngữ cảnh khác hoặc Excel/báo cáo |
| AT.06 | Chuỗi thứ Hai 05–19/10/2026, nghỉ 12/10 | Có đúng ngày 05 và 19; khung bận khớp |
| AT.07 | Input mới thêm/đổi môn/chương trình, một bộ khả thi và một bộ mâu thuẫn | Output theo cùng hợp đồng; không cần giống ô workbook cũ |
| AT.08 | Ba lần chạy cho mỗi cấu hình tái lập 1 và nhiều worker | Phân công chuẩn hóa/điểm giống nhau trong cùng cấu hình |
| AT.09 | Tiêm lỗi lưu/công bố, dừng giải, đổi input khi giải | Không có công bố dở dang, không mất bản cũ, không trộn input |

Các bộ này là kế hoạch nghiệm thu, chưa được tạo/đo đầy đủ trong lần chỉnh tài liệu. Mỗi bộ cần nguồn dữ liệu, phiên bản, seed nếu có và kết quả oracle để đánh giá thực sự.
