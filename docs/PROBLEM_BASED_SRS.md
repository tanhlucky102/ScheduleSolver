# ScheduleSolver — Bộ tài liệu Problem-Based SRS

Phương pháp: **Problem-Based SRS của Gorski & Stadzisz**, thực hiện theo skill `~/.codex/skills/problem-based-srs`. Chuỗi truy vết chuẩn: **FR → CN → CP**. Tài liệu phân tích trước đây dựa trên Problem Frames không được coi là đã hoàn tất quy trình này.

Giữ [project brief](../PROJECT_BREIF.md) làm bản tổng quan ngắn; đặc tả được lưu theo bước trong `docs/srs/`. Mỗi FR/NFR sẽ có tệp riêng, tiêu chí nghiệm thu và liên kết về nhu cầu/vấn đề gốc. Không xem mã thử nghiệm là đặc tả đã được duyệt.

## Cập nhật 28/10/2026

Nhóm chốt thêm các quyết định DEC.19–DEC.24 (xem [bối cảnh](srs/00-business-context.md)):

- Lịch bận GV cố định cả học kỳ, không chọn tuần.
- Giao diện Swing.
- Lưu bằng CSV + Serialization, không dùng CSDL.
- Quy ước phân công theo chương trình ([QUY_UOC_PHAN_CONG.md](QUY_UOC_PHAN_CONG.md)).
- 3 giải thuật thầy đề xuất chạy song song ([GIAI_THUAT_VA_METRICS.md](GIAI_THUAT_VA_METRICS.md)).
- Đăng nhập cho 3 actor, giảng viên chỉ xem lịch của mình (DEC.24).

FR.04.1.1 và FR.04.1.2 đã được viết lại theo các quyết định này. Các FR/NFR khác giữ nguyên nội dung Draft. Mức độ đáp ứng của code hiện tại được ghi trong README.

## Tiến độ và đầu ra

| Bước | Tài liệu | Trạng thái |
|---|---|---|
| 0 — Business Context | [00-business-context.md](srs/00-business-context.md) | Đã lưu bối cảnh và các quyết định trực tiếp của người dùng; còn đề xuất cần xác nhận |
| 1 — Customer Problems | [01-customer-problems.md](srs/01-customer-problems.md) | Đã lưu 6 CP sau vòng trao đổi về điều kiện input, metric và giáo vụ trong vòng quyết định |
| 2 — Software Glance | [02-software-glance.md](srs/02-software-glance.md) | Đã lưu sơ đồ Mermaid, giao diện và truy vết đủ 6 CP từ các xác nhận hiện có |
| 3 — Customer Needs | [03-customer-needs.md](srs/03-customer-needs.md) | Đã lưu 13 CN; đã kiểm tra Zigzag CP ↔ CN |
| 4 — Software Vision | [04-software-vision.md](srs/04-software-vision.md) | Đã lưu phạm vi, ưu tiên và sơ đồ kiến trúc Mermaid |
| 5 — FR | [Mục lục FR](srs/functional-requirements/_index.md) | 20 FR phủ 13 CN, từng tệp có AC và test dự kiến |
| 5 — NFR | [Mục lục NFR](srs/non-functional-requirements/_index.md) | 7 NFR có phép đo và AC; giữ trạng thái Draft |
| Kiểm tra truy vết | [traceability-matrix.md](srs/traceability-matrix.md) | Đã rà CP ↔ CN sau bước 3 và toàn chuỗi sau bước 5 |

## Những điểm bắt buộc xuyên suốt

- Kế hoạch mở lớp là input chính; tạo TKB cho các chương trình theo mẫu `Timetable Spring 2026`; `Verify` là tiêu chí để giáo vụ xem xét.
- Demo chuyển vai trò trên một máy; lịch gộp và solver song song đều bắt buộc.
- Chỉ GV sở hữu xem chi tiết lịch gộp. Quản lý xem trường/ngày/khung bận, bao gồm khi xuất báo cáo.
- Giờ bận giả lập được phép, phải đánh dấu và tái tạo được; không khẳng định đó là lịch thực.
- Đánh giá theo kế hoạch hiện có đã chuẩn hóa; xử lý được input mới và có chế độ tái lập.
- Đặc tả objective/metric riêng với Verify; không tự đổi trọng số mặc định. Định hướng thuật toán: Local Search, Simulated Annealing, Tabu Search.
- Giáo vụ nhận và tiếp tục xử lý phương án thiếu; demo có TKB trong ứng dụng và Excel TKB/báo cáo cho cùng phiên bản.
- Demo có đăng nhập theo vai trò (DEC.24); lịch trường khác nhập tay đủ thông tin, không bắt buộc ICS/Excel cho lịch ngoài.
- Đã xác nhận đặc tả đủ 13 CN; trường lịch ngoài bắt buộc: GV, trường, môn, lớp, ngày, giờ bắt đầu/kết thúc. Cơ sở/địa chỉ/phòng có thể chưa biết; hỗ trợ buổi đơn, lặp tuần có hiệu lực và ngày nghỉ ngoại lệ.

## Các nội dung cần cụ thể hóa trong đặc tả

1. **Objective:** hướng nghiệp vụ đã xác nhận là trả phương án tốt nhất tìm được theo điểm, có giáo vụ xem xét. [Objective và metric](srs/design/objective-and-metrics.md) đặc tả `(H, S, C)` nhỏ hơn là tốt hơn: H cứng trước, S giữ trọng số hiện có, C chỉ phá hòa để tránh trùng chéo; “điểm cao nhất” không phải chỉ dẫn đảo dấu bộ so sánh. Quy ước đếm/phá hòa chi tiết là Draft, chưa thay đổi code hoặc cam kết tối ưu toàn cục.
2. **Metric:** giữ metric hiện tại: độ phủ, từng loại vi phạm Verify, ca trống theo GV/ngày/tuần, ngày một ca, số ngày đi dạy, tải/độ lệch tải và số buổi đổi giờ/GV; quy định đơn vị, mẫu số, tuần rời rạc và tập so sánh trước khi báo cải thiện. Không tự thêm trọng số cho trùng chéo môn.
3. **Tái lập:** định danh input chuẩn hóa, seed, cấu hình, phiên bản thuật toán và lịch trao đổi kết quả giữa worker. Ngân sách thời gian thực và lịch chạy luồng không tự bảo đảm cùng output; cần tách chế độ thực nghiệm theo thời gian với chế độ tái lập theo số bước/đồng bộ xác định.
4. **Verify:** trùng chéo môn cùng khóa được cố gắng tránh khi có thể và báo để giáo vụ xem xét; không mặc định là lỗi cứng chỉ do cùng khóa. Các quan hệ cùng nhóm sinh viên/cấm trùng đã được xác nhận được kiểm tra riêng. Thuật toán ảnh hưởng khả năng tìm lịch tốt; objective và quy tắc quyết định lịch nào được đánh giá tốt hơn.
5. **Đầu ra kỳ vọng:** đúng kế hoạch, định dạng và quy tắc, không yêu cầu ô lịch trùng tuyệt đối bản Excel cũ; nếu input mâu thuẫn hoặc hết ngân sách, báo rõ trạng thái và phần chưa giải.

**Khi đầu vào khó:** vẫn trả best-so-far, bao gồm phần chưa xếp và vi phạm nếu còn. Không tự bỏ giờ bận hay giả định giáo vụ đồng ý với mọi lỗi; xem xét một phương án chưa hợp lệ khác với công bố nó như một lịch hoàn chỉnh.

Các nội dung chưa được xác nhận sẽ giữ trạng thái đề xuất/điểm mở. Bộ tài liệu chỉ trở thành baseline sau các bước phỏng vấn, kiểm tra truy vết và xác nhận tương ứng.

## Bàn giao bộ đặc tả

Đã hoàn thành vòng tài liệu bước 0–5 theo các cuộc phỏng vấn; 20 FR, 7 NFR ở trạng thái Draft. [Hợp đồng dữ liệu và bộ nghiệm thu](srs/design/data-contracts.md) tách ý nghĩa đầu vào/đầu ra, lịch nhập tay, dữ liệu giả lập và các kịch bản kiểm tra khỏi FR/NFR. Không thay đổi code, database/schema, dependency hay trọng số.

[Báo cáo kiểm tra](srs/validation-report.md): kiểm tra cấu trúc, độ phủ ID/AC và liên kết nội bộ đạt; 13/13 CN được phủ. Chưa kiểm chứng render Mermaid hoặc nghiệm thu phần mềm.

Các mục còn cần review trước baseline: quy ước đếm/target tải, dữ liệu phòng/bảng giờ/alias/nhóm, ngưỡng phản hồi UI, tỷ lệ đạt mục tiêu thực nghiệm và định dạng Excel bổ sung. Đây không phải tuyên bố phần mềm đã đạt nghiệm thu. Đề bài cũ được giữ làm nguồn tham khảo; quyết định người dùng trong brief và bộ SRS này có ưu tiên khi khác phạm vi cũ (đăng nhập, ICS, concurrency, lịch gộp và quyền riêng tư).
