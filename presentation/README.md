# ScheduleSolver — presentation cập nhật 08/11/2026

15 slide, khoảng 15 phút. PPTX chỉnh sửa được; PDF và preview được render bằng LibreOffice.

- Slide 5 trình bày dữ liệu; sơ đồ kiến trúc đã loại khỏi luồng trình chiếu.
- Slide 8: Related Work & Technical Contributions, đối chiếu UniTime và OR-Tools; phân biệt mã nhóm triển khai với phương pháp/thư viện có sẵn.
- Slide 7: Quy trình tìm kiếm và ba thẻ HC, SA, Tabu; mỗi thẻ có một quy tắc, một ví dụ điểm số và một giới hạn.
- Slide 12: Năm hàng kiểm chứng với kết quả và phạm vi ngắn gọn; kết quả 290 buổi trên 17 phòng giả lập được tách khỏi các phép thử khác.
- Loại cách diễn đạt gắn nguồn thông tin với cá nhân; ảnh gốc vẫn là minh chứng thử nghiệm.

Nguồn đối chiếu: backend/app/solver.py, domain_rules.py, schemas.py, docs/REFACTOR_AUDIT.md và verification/full-term-simulation/README.md. Không chạy lại kiểm thử ứng dụng trong lần biên tập này.

Related work: https://help.unitime.org/manuals/courses-solver.html và https://developers.google.com/optimization/cp (truy cập 08/11/2026). So sánh phạm vi chức năng, không phải benchmark.

Đã rà soát trực quan toàn bộ trang render; kiểm tra tọa độ thành phần trong qa-report.json. Chưa kiểm tra bằng Microsoft PowerPoint gốc. Tái tạo bằng build_deck.py trong môi trường có python-pptx và Pillow.

## Đính chính phạm vi nguồn

Đối chiếu trực tiếp resources: 25 phòng (10 máy chiếu, 14 máy tính, 1 kết hợp), 4 bộ môn, 35 GV, 104 dòng quy ước phân công. Toàn bộ 22 dòng lịch ngoài có gia_dinh=x. Danh mục phòng có tên/loại/sức chứa, chưa có khả dụng. Kết quả 290/290 hard=0 và thời gian trên slide thuộc cấu hình thử nghiệm cũ 17 phòng giả lập, không được xem là kết quả chạy danh mục nguồn hiện tại. Không chạy lại solver trong lần cập nhật slide này. Xem resource-audit.json.
