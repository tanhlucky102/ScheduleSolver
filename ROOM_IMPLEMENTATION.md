# Mở rộng lập lịch phòng học — 05/11/2026

Phòng cụ thể là tài nguyên bắt buộc, Giáo vụ là nguồn cấu hình chính thức. Yêu cầu mới thay thế quy tắc cũ chỉ phạt mềm khi vượt số phòng theo loại.

## Mô hình và sử dụng

Giữ aggregate JSONB theo workspace/học kỳ. Bổ sung rooms, reservations, Placement.room_id, yêu cầu thiết bị/loại phòng theo lớp và Config.soft_weights. Migration 002 thêm trường thiếu, tăng revision và thêm SQL guard; không suy ra phòng, sửa kế hoạch hoặc xóa dữ liệu cũ. Database mới chạy 001 rồi 002; đã có 001 thì chỉ chạy 002.

1. Nhập data/fall2026/catalog_seed.json tại Cấu hình & kế hoạch; nhập khung bắt đầu đã được đơn vị xác nhận.
2. Chọn data/fall2026/approved_plan.xlsx để preview và xác nhận nhập. Đây là kế hoạch 67 dòng được người dùng duyệt, chuyển thành 290 buổi. Giữ cờ học liền, phòng Lec/Tut và số lớp chỉ định.
3. Trong Phòng học, khai báo mã, sức chứa, loại, thiết bị, khả dụng hằng tuần và điều kiện bộ môn/chương trình/môn. Không có khả dụng nghĩa không được dùng. Loại phòng là nhãn được xác nhận, chỉ so khớp khi lớp yêu cầu.
4. PROJECTOR/COMPUTER là mã thiết bị chính. Có thể thêm thiết bị riêng và yêu cầu từng lớp; mã phải khớp chính xác. Không suy ra máy chiếu từ máy tính. Ghi chú chỉ để người dùng đọc.
5. Nhập lịch chiếm dụng đã xác nhận; chỉ giải phóng bằng lệnh tường minh có revision/audit. Snapshot đã công bố được bảo vệ tự động.
6. Với lịch công bố cũ chưa có room_id, Giáo vụ phải xác nhận từng phòng thực tế trước khi solve; API trả ROOM_REVIEW_REQUIRED nếu chưa hoàn tất.
7. HEAD cập nhật năng lực/phân công và nộp như quy trình cũ. Bộ giải không đổi giảng viên. Sửa nháp luôn chấm lại; công bố đòi 0 lỗi cứng. Excel/lịch cá nhân có mã phòng.

Không được xóa hoặc thay phòng làm sai lịch công bố. Khi tái lập lịch, chiếm dụng của các lớp khác trong snapshot cũ vẫn được giữ; cùng lớp có thể giữ/đổi vị trí. Cách bảo thủ này có thể ngăn một số phép hoán đổi đồng thời, nhưng không tự giải phóng lịch đã xác nhận.

## Hard và soft

Giữ HC/SA/Tabu, seed và thứ tự ưu tiên điểm (hard, soft). Miền tìm kiếm là cặp giờ/phòng đã lọc. Bộ chấm điểm kiểm tra độc lập mọi điều kiện, cả khi sửa thủ công.

Hard: thời lượng/khung hợp lệ, mỗi lớp một placement, không trùng giảng viên/Lec-Tut/CLC theo quy tắc cũ; phòng tồn tại, hoạt động, đủ chỗ, đúng thiết bị/loại/điều kiện; toàn buổi nằm trong một khung khả dụng; không trùng phòng, reservation hoặc lớp khác đã công bố. Phân công phải hợp lệ trước solve/publish.

Soft: thứ bảy/buổi tối, ngày chỉ một lớp, vượt trần tiết/ngày và phút trống giảng viên. Trọng số nguyên 0–1000 do Giáo vụ cấu hình, mặc định 1. Soft không thể bỏ hard. Config.rooms cũ được giữ để đọc dữ liệu cũ nhưng không là tài nguyên và đã bỏ khỏi form.

INFEASIBLE_INPUT: một lớp không có cặp phòng/giờ hợp lệ riêng lẻ, kèm nguyên nhân. SEARCH_EXHAUSTED: hết lượt chưa có lịch hợp lệ, không chứng minh toàn bài toán vô nghiệm. Cả hai HTTP 409, rollback nháp/revision. Không trả lịch vi phạm như kết quả thành công.

## Kế hoạch đã được duyệt và tương thích

Theo xác nhận sau cùng của người dùng, dùng resources/ke_hoach_mo_lop_HK1_2026.xlsx (67 dòng), không phân tích thêm workbook FIT. scripts/prepare_approved_plan.py tạo JSON/XLSX và provenance.

Dữ liệu mới có combined tường minh, lecture_room/tutorial_room và số nhóm tùy chọn. Kế hoạch cũ thiếu combined vẫn giữ quy tắc Python cũ gộp tổng 4 tiết; kế hoạch 67 dòng có combined=false thì Lec/Tut tách riêng theo nguồn. Hai dòng chỉ định 2 Lec/5 Tut được giữ; sĩ số thực từng lớp được kiểm tra với phòng, không ép nhóm chỉ định về 30 SV.

Chương trình 61FIT/61MME=STANDARD, 62FIT=CLC, 66FIT=TT dựa Program.java của nguồn gốc. Với dữ liệu nhập mới, nhóm CLC/TT mặc định 40 theo cùng mã nguồn; hệ thường giữ mặc định Python 200/30 nếu nguồn không chỉ định. TT là chương trình riêng, không gán nhầm nhãn CLC. Không đổi các điều kiện cohort của CLC cũ.

readiness_audit.json ghi 7 tổ hợp môn/loại buổi chưa có GV hợp lệ từ catalog CSV: đây là thiếu cấu hình phải được HEAD cập nhật, không tự sửa bộ môn hay nâng quyền/năng lực.

## Tài khoản mẫu

Đã tạo tài khoản thật trong Supabase và một workspace demo riêng chứa kế hoạch 67 dòng/290 buổi, 4 bộ môn và 35 GV:
- 1 STAFF.
- 4 HEAD theo bộ môn KHMT/CNPM/HTTT/TTDPT.
- 1 TEACHER.

Danh sách email/role/workspace không chứa mật khẩu: data/demo/manifest.json.
Thông tin đăng nhập: /tmp/schedule-demo-credentials.json, quyền 0600; giữ tệp này riêng và đổi mật khẩu sau bàn giao. Không gửi email và không nhập mật khẩu CSV nguồn.

Migration 002 đã áp dụng trên project cấu hình trong backend/.env; database không có workspace trước khi nâng cấp. Backend đọc .env khi provisioning; không đưa khóa quản trị vào frontend.

Để tạo một bộ demo khác:
    cd backend
    python provision_demo.py --approved-plan --apply --credentials /tmp/another-demo-credentials.json

Mỗi lần tạo tài khoản mới và workspace mới; không sửa account đã tồn tại. Không có phòng giả trong demo kế hoạch: Giáo vụ phải khai báo dữ liệu phòng đã xác nhận.

Xem AUDIT.md và verification/RESULTS.md về các giới hạn còn lại.
