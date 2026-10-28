# Báo cáo kiểm tra bộ đặc tả

**Ngày:** 26/10/2026 · **Phạm vi:** tài liệu, không phải nghiệm thu phần mềm.

## Kết quả cấu trúc

Đã chạy kiểm tra tự động trên các tệp thực tế, kết quả **PASS**:

- 6 CP, 13 CN, 20 FR, 7 NFR.
- 13/13 CN có FR; mọi FR có ID đúng cấu trúc và tham chiếu CN/CP cha khớp ID.
- Mọi FR có phát biểu “phải (shall)”, ít nhất hai AC và các mục theo template; NFR có phép đo và ít nhất hai AC.
- Các tham chiếu FR/CN trong NFR tồn tại; không có khối code xây dựng trong FR/NFR.
- Liên kết Markdown cục bộ của `docs/srs/`, brief và mục lục SRS đều trỏ tới tệp tồn tại.
- Software Glance và Software Vision có sơ đồ Mermaid. Chưa kiểm tra render bằng công cụ Mermaid.
- `git diff --check` đạt trên thay đổi tracked; kiểm tra tệp đọc trực tiếp bao gồm cả tài liệu mới chưa tracked.

## Kết quả rà soát nội dung

- Đã kiểm tra Zigzag sau CN và toàn chuỗi sau FR/NFR; xem [ma trận](traceability-matrix.md).
- Phạm vi phản ánh xác nhận: demo chọn vai trò, lịch ngoài nhập tay đủ trường, concurrency/lịch gộp bắt buộc; quản lý chỉ xem trường/ngày/giờ bận.
- Nhận lịch thiếu và xuất nháp không được đồng nhất với công bố lịch hoàn chỉnh.
- Mọi thuật toán dùng cùng quy ước đánh giá; trọng số giữ nguồn hiện tại. Objective/phá hòa và cách đếm chi tiết vẫn là thiết kế Draft, không thay đổi code.
- Không khẳng định tính khả thi của mọi input, optimality, speedup hoặc đạt 60 giây khi chưa có đo đạc.

## Điểm còn mở trước baseline

1. Dataset chuẩn hóa: mã buổi, GV/alias/đồng giảng, quan hệ nhóm, lịch theo khóa/bảng giờ và phòng có căn cứ.
2. Target S10 và trạng thái áp dụng từng metric; rà soát quy ước H/S/C và phá hòa trước triển khai.
3. Duyệt ngưỡng phản hồi UI, tỷ lệ đạt hiệu năng và mức cải thiện; hiện là đề xuất/chưa xác định, không giả vờ đã được chấp thuận.
4. Chốt định dạng xuất bổ sung 84 cột nếu cần; Excel lưới TKB và báo cáo đã thuộc demo.
5. Tạo và chạy bộ nghiệm thu tại [hợp đồng dữ liệu](design/data-contracts.md); chưa có kết quả phần mềm được chứng nhận bởi lần chỉnh tài liệu này.

Không sửa mã Java, dependency, schema hoặc trọng số. Không chạy Maven vì thay đổi lần này chỉ là tài liệu. Bộ tài liệu đã hoàn tất vòng đặc tả nội bộ 0–5 ở trạng thái Draft, chưa được chuyển thành Approved/Implemented/Tested.
