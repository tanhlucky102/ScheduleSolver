# Quy ước giảng viên dạy từng môn cho từng chương trình đào tạo

Tài liệu này mô tả **ai được dạy môn nào** và **lớp được tổ chức thế nào** ở mỗi chương trình. Bộ giải chỉ được phân công giảng viên theo đúng quy ước này. Code liên quan: `model/Program`, `model/TeachingRule`, `service/PlanBuilder`, `service/Convention`, `service/ConventionBuilder`.

## 1. Nhận biết chương trình qua mã môn

| Tiền tố mã môn | Chương trình | Cách tổ chức lớp | Lớp cố định? |
|---|---|---|---|
| `61FIT` | Đại trà CNTT | 1 lớp Lecture đông SV (100–200) + nhiều nhóm Tutorial 30 SV | Không |
| `61MME` | Ngành MME | Giống Đại trà | Không |
| `62FIT` | Chất lượng cao (CLC) | Mỗi lớp ~30 SV học **Lec rồi Tut liền nhau** trong cùng một buổi, **cùng 1 GV** | **Có**: CLC01 khóa K24 học chung mọi môn |
| `66FIT` | Tiên tiến (tên mới của CLC từ K25) | Giống CLC (Lec+Tut liền nhau, 1 GV) | Không: TT01 của môn này khác TT01 của môn kia |

Căn cứ dữ liệu thật (`resources/FIT Time table Fall2026 V5.2.xlsx`, sheet `Timetable Spring 2026`):

- Mọi lớp CLC / Tiên tiến đều có ô "Lec" và ô "Tut" của cùng lớp, cùng GV, nằm ở hai ca liền nhau. Ví dụ `62FIT3DBS - CLC01`: Lec 07:10 và Tut 09:30 thứ Hai, cùng do NgaNT dạy.
- Ở TT, `66FIT2POP - TT01` và `66FIT2DMA - TT01` được khoa xếp cùng giờ. Vì vậy nhãn TTxx chỉ là nhóm riêng của từng môn, không phải một lớp sinh viên cố định.
- Đại trà có môn mở 2 lớp Lec (A, B), ví dụ `61MME4ADC - A` và `- B`. Khi đó nhóm Tut `B01` thuộc Lec B.

## 2. Chuyển kế hoạch mở lớp thành các buổi cần xếp

Mỗi dòng trong sheet "Kế hoạch mở lớp" có: mã môn, tên, sĩ số, khóa (năm nhập học), số lớp mở và số tiết. `PlanBuilder` gom các dòng theo môn rồi tạo buổi như sau:

| Trường hợp | Kết quả | Số ca |
|---|---|---|
| Dòng 4 tiết (ví dụ SS1) | 1 buổi **4 tiết** (`COMBINED`), mã `...-4T-01` | 2 ca liền nhau |
| Đại trà/MME, sĩ số > 40 | 1 buổi **Lecture**; nếu có Lec thứ hai thì nhóm là `B` | 1 ca |
| Đại trà/MME, sĩ số ≤ 40 | 1 buổi **Tutorial** `01, 02...`; Tut đứng sau Lec B được đánh số `B03, B04...` | 1 ca |
| CLC / Tiên tiến, số dòng chẵn | Ghép 2 dòng liên tiếp thành 1 buổi **Lec+Tut** `CLC01`, `TT01`... | 2 ca liền nhau |
| CLC / Tiên tiến, số dòng lẻ (ví dụ RES chỉ có Lec) | Mỗi dòng là 1 buổi **Lecture** của lớp `CLC01`... | 1 ca |

Buổi 2 ca chỉ được bắt đầu ở ca 1, 3 hoặc 5 (đầu buổi sáng/chiều/tối), để nằm trọn trong một buổi giống TKB của khoa.

Kết quả trên file thật: 290 dòng kế hoạch thành **236 buổi** cần xếp.

## 3. Bảng quy ước giảng viên – môn (trưởng khoa quản lý)

Mỗi dòng: `ma_mon, ten_mon, ma_gv, day_lec, day_tut` (file `resources/quy_uoc_phan_cong.csv`, sửa được ở màn hình Trưởng khoa → tab "Quy ước phân công").

Luật chọn giảng viên cho một buổi (`Convention.candidatesFor`):

| Loại buổi | GV phải có |
|---|---|
| Lecture | `day_lec = x` cho môn đó |
| Tutorial | `day_tut = x` cho môn đó |
| Lec+Tut (CLC / Tiên tiến) | cả `day_lec` và `day_tut` (vì một GV dạy cả hai phần của lớp) |
| 4 tiết | cả `day_lec` và `day_tut` |

Cùng một học phần nhưng khác chương trình thì là **mã môn khác nhau** (ví dụ `61FIT3DBS`, `62FIT3DBS`, `66FIT3DBS`), nên quy ước được đặt riêng cho từng chương trình. Ví dụ, một GV có thể dạy Tut CSDL ở Đại trà nhưng không được giao lớp CLC.

Ràng buộc đi kèm:

- Một buổi chỉ có 1 GV chính. Ô ghi đồng giảng như `TuanVM (NgocTB)` được lấy GV đầu tiên.
- Bộ giải không bao giờ giao buổi cho GV ngoài quy ước. Giáo vụ có thể chỉnh tay và "cố định" buổi; khi đó Verify vẫn kiểm tra theo quy ước, trừ buổi đã cố định.
- Mỗi GV có giới hạn **tối đa ca/ngày** (mặc định 4) và **tối đa ca/tuần** (mặc định 12). Vượt giới hạn bị phạt mềm (S4, S5), không cấm hẳn.

## 4. Bộ quy ước mặc định được tạo như thế nào

Chạy `java -cp target/schedulesolver.jar vn.edu.fit.schedulesolver.experiment.DataSetup` (hoặc bấm "Đề xuất từ TKB cũ..." ở màn hình Trưởng khoa):

1. Đọc lưới TKB lập tay: 246 ô môn học, nhận ra giảng viên ở 186 buổi.
   - Ô không có tên GV hoặc tên không rõ bị bỏ qua và **in cảnh báo**, ví dụ JSD Tut ghi `- 205 D1`, hay MME ghi "Dung" (không biết là ai).
   - Bí danh được khai báo trong `giang_vien.csv`: `Thảo` → ThaoDTP, `Khoa` → KhoaTN, `VânHT` → VanHT.
2. Ai đã dạy môn nào trên TKB cũ thì được dạy môn đó, đúng loại Lec/Tut đã dạy.
3. Buổi trong kế hoạch chưa có GV phù hợp thì lấy GV của **cùng học phần ở chương trình khác** (ví dụ `62FIT4EIS` lấy theo `61FIT4EIS`). Với CLC / Tiên tiến, GV được dạy cả Lec và Tut.
4. **Giả định của nhóm**, vì TKB cũ không ghi GV (hằng số `ASSUMED_RULES` trong `DataSetup`):

   | Môn | GV đề xuất |
   |---|---|
   | 61FIT3JSD | QuyenNV (Lec+Tut), AnhVQ (Tut) |
   | 61MME2PRE | PhuongTM (Lec+Tut), KhoaTN (Tut) |
   | 61MME4CCMA | ChauNTB (Lec+Tut) |

   Đây là dữ liệu giả định cho demo, trưởng khoa cần duyệt lại.

Kết quả: 34 giảng viên, 104 dòng quy ước; cả 236 buổi của kế hoạch đều có ít nhất 1 GV được phép dạy (kiểm thử `RealWorkbookTest.planSheetBecomesSessionsCoveredByDefaultConvention`).

## 5. Một chỗ chưa khớp trên TKB cũ

Với quy ước trên, TKB lập tay của khoa còn **1 trùng lịch sinh viên**: lớp CLC01 khóa K25 học `62FIT2RES` cùng giờ `62FIT2PR1` (sáng Thứ 7). Nhóm giữ nguyên quy ước "lớp CLC cố định" và báo đây là vi phạm. Nếu khoa xác nhận RES của CLC dành cho nhóm sinh viên khác thì cần tách nhóm này trong kế hoạch.
