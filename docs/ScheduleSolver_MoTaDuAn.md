# ScheduleSolver — Hệ thống phân công & xếp thời khóa biểu tối ưu cho giảng viên

**Môn học:** Java Software Development · **Năm học:** 2026–2027
**Hướng đề tài:** Java Concurrent Application (Academic Scheduler) kết hợp Integrated Java Application (GUI + Database + File I/O)

---

## 1. Giới thiệu

### 1.1. Bài toán

Mỗi học kỳ, khoa Công nghệ Thông tin phải lập thời khóa biểu (TKB) cho hàng trăm lớp học phần. Quy trình hiện tại được làm thủ công trên Excel:

1. **Trưởng khoa** lập kế hoạch mở lớp: môn học, nhóm lớp, sĩ số, số tiết, loại phòng và danh sách giảng viên (GV) phụ trách từng môn.
2. **Giáo vụ** tự chọn thứ/ca cho từng lớp, phân công GV và soát lỗi trùng lịch bằng tay.
3. **Giảng viên** nhận TKB của khoa. Nhiều GV còn dạy ở trường khác nên phải tự ghép các lịch lại với nhau.

Cách làm thủ công chỉ đảm bảo "không trùng", chưa tối ưu cho GV. Lịch thường bị rời rạc: có ngày GV lên trường chỉ để dạy đúng 1 ca, hoặc phải chờ nhiều ca trống giữa hai buổi dạy.

Xếp TKB là bài toán **University Course Timetabling**, thuộc lớp **NP-hard**. Vì vậy hệ thống dùng heuristic/metaheuristic để tìm lời giải **tốt hơn đáng kể** so với lịch lập thủ công, chứ không đảm bảo tối ưu tuyệt đối.

### 1.2. Mục tiêu

- Tự động **phân công GV** (trong danh sách GV phụ trách của từng môn) và **xếp thứ/ca** cho mọi lớp Lecture/Tutorial.
- Lịch của GV **gọn nhất có thể**: các ca dạy liền nhau, ít ca trống kẹp giữa, hạn chế ngày chỉ dạy 1 ca, giảm số ngày phải lên trường.
- Bộ giải chạy **song song nhiều luồng** để tận dụng CPU đa nhân, có thể dừng bất kỳ lúc nào và vẫn trả về lời giải tốt nhất đã tìm được.
- Cho phép giáo vụ chỉnh tay với kiểm tra xung đột tức thì, công bố TKB và xuất Excel.
- Cho phép GV xem TKB của mình và **gộp lịch dạy ở các trường khác** thành một lịch duy nhất, ghi rõ trường, ngày, giờ, phòng.
- Ứng dụng **Java desktop** có đăng nhập và phân quyền theo vai trò.

### 1.3. Phạm vi

**Trong phạm vi**

- Các môn ngành CNTT, chia 2 hệ: **hệ thường** (mã `61FIT…`) và **chất lượng cao – CLC** (mã `62FIT…`).
- Mỗi môn tách thành **lớp Lecture** và các **tổ Tutorial**. Môn 4 tiết (Chuyên đề SS1, SS2…) là lớp gộp Lecture + Tutorial.
- 1 học kỳ; mỗi lớp/tổ học 1 buổi/tuần, lặp lại trong một dải tuần.
- Phân công GV trong danh sách phụ trách, xếp thứ/ca, gán phòng theo tòa nhà.
- TKB gộp nhiều trường cho giảng viên.

**Ngoài phạm vi**

- Các ngành khác ngoài CNTT, chương trình liên kết, lớp học lại.
- Phân công GV ngoài danh sách phụ trách; đổi GV giữa kỳ; GV dạy thay.
- Định mức giờ chuẩn và thù lao; lịch thi; quản lý phòng thật của toàn trường.
- Đồng bộ trực tiếp với hệ thống đào tạo của trường; ứng dụng web/mobile.
- Ràng buộc đăng ký học phần phía sinh viên (môn tự chọn/bắt buộc).

---

## 2. Người dùng & chức năng

### 2.1. Vai trò (actor)

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| **Trưởng khoa (DEAN)** | Chủ sở hữu kế hoạch mở lớp | Tạo/sửa kế hoạch mở lớp, khai báo danh sách GV phụ trách từng môn, chốt kế hoạch và gửi giáo vụ, xem tải giảng dạy |
| **Giáo vụ (STAFF)** | Người phân công & xếp lịch | Nhận kế hoạch, cấu hình và chạy bộ giải, chỉnh tay (đổi GV, đổi giờ), khóa lớp, công bố TKB, xuất Excel, trả kế hoạch về nếu thiếu dữ liệu |
| **Giảng viên (TEACHER)** | Người dùng cuối | Xem TKB của mình, khai báo giờ bận/ưu tiên, nhập lịch trường khác, xem TKB gộp, xuất ICS/Excel/PDF |
| **Quản trị (ADMIN)** *(tuỳ chọn)* | Quản trị hệ thống | Tạo tài khoản, đặt lại mật khẩu, gán vai trò (có thể gộp vào Trưởng khoa) |

### 2.2. Quy trình nghiệp vụ

```text
Kế hoạch:  DRAFT ──submit()──► FINAL ──accept()──► IN_SCHEDULING ──công bố TKB──► LOCKED
             ▲                   │
             └───return(lý do)───┘        (giáo vụ trả về nếu dữ liệu chưa đủ)

TKB:       DRAFT ──solve()──► PROPOSED ──publish()──► PUBLISHED ──revise()──► phiên bản mới (DRAFT)
                                ▲  │  chỉnh tay (undo/redo)
                                └──┘

Lịch GV:   TKB khoa (PUBLISHED) + lịch trường A + lịch trường B … ──merge()──► Lịch gộp
           Lịch trường khác ──"chia sẻ giờ bận"──► giờ bận cứng cho lần xếp lịch sau
```

Chuyển trạng thái được kiểm soát bằng **State pattern** (enum có `canTransitionTo`), ví dụ không cho sửa kế hoạch đã `LOCKED`.

### 2.3. Yêu cầu chức năng

**Chung**
- FR-01 Đăng nhập / đăng xuất / đổi mật khẩu; khóa tạm tài khoản sau 5 lần nhập sai.
- FR-02 Phân quyền theo vai trò (menu và màn hình hiển thị theo vai trò).
- FR-03 Thông báo trong ứng dụng (kế hoạch được gửi, bị trả về, TKB đã công bố…).

**Trưởng khoa**
- FR-10 Tải file Excel mẫu để điền kế hoạch.
- FR-11 Import kế hoạch từ Excel (file mẫu của hệ thống hoặc định dạng TKB cũ của khoa).
- FR-12 Tạo/sửa/xoá dòng kế hoạch: môn, hệ đào tạo, nhóm lớp, tổ Tutorial, loại lớp (Lec/Tut/gộp), sĩ số, số tiết, loại phòng, dải tuần, thứ/ca gợi ý, GV cố định (nếu có).
- FR-13 Khai báo **danh sách GV phụ trách từng môn**. Chỉ cần tên GV; hệ thống tự quyết ai dạy Lecture, ai dạy Tutorial. Tuỳ chọn thêm: giới hạn Lec/Tut, số lớp tối thiểu/tối đa, mức ưu tiên (GV chính/phụ).
- FR-14 Kiểm tra hợp lệ kế hoạch (môn chưa có GV phụ trách, ca không hợp lệ, trùng mã…), báo lỗi theo dòng.
- FR-15 Thống kê tải giảng dạy dự kiến và thực tế theo GV.
- FR-16 Chốt kế hoạch (tạo phiên bản cố định) và gửi giáo vụ; so sánh 2 phiên bản kế hoạch.

**Giáo vụ**
- FR-20 Xem kế hoạch đã chốt; nhận hoặc trả về kèm lý do.
- FR-21 Quản lý tài nguyên: bảng ca, ngày bắt đầu tuần 1, danh mục phòng theo tòa.
- FR-22 Cấu hình bộ giải: thuật toán, số luồng, thời gian tối đa, seed, trọng số từng ràng buộc mềm, chế độ (tối ưu toàn phần / giữ gợi ý của trưởng khoa / chỉ sửa xung đột), chế độ phân công (tự phân công / giữ phân công có sẵn).
- FR-23 Chạy bộ giải ở nền, xem tiến độ theo thời gian thực (điểm tốt nhất theo thời gian), dừng bất kỳ lúc nào.
- FR-24 Xem kết quả dạng lưới TKB; lọc theo GV, nhóm lớp, phòng.
- FR-25 Chỉnh tay: kéo-thả để đổi giờ, chọn GV khác trong danh sách phụ trách; kiểm tra xung đột tức thì; undo/redo; khóa giờ và/hoặc khóa GV của lớp.
- FR-26 Báo cáo điểm: vi phạm cứng, từng loại vi phạm mềm, chi tiết theo từng GV.
- FR-27 So sánh nhiều phương án theo các chỉ số.
- FR-28 Công bố TKB.
- FR-29 Xuất Excel: lưới TKB, định dạng import của hệ thống đào tạo, TKB từng GV, bảng kiểm tra tự động.
- FR-30 Xếp lại khi kế hoạch thay đổi, giữ nguyên giờ và GV của các lớp cũ nhiều nhất có thể.
- FR-31 Gán phòng ngẫu nhiên theo tòa (có seed), ưu tiên cùng tòa với ca liền kề; cho phép sửa tay hoặc gán lại với seed khác.

**Giảng viên**
- FR-40 Xem TKB của mình theo tuần / học kỳ / danh sách, hiển thị ngày giờ thật.
- FR-41 Khai báo giờ bận (cứng) và ưu tiên (mềm): không dạy tối, không dạy Thứ 7, muốn dồn vào ít ngày…
- FR-42 Thêm "trường khác": tên, cơ sở/địa chỉ, màu hiển thị, bảng tiết riêng của trường đó.
- FR-43 Nhập lịch trường khác: nhập tay, file Excel mẫu, file ICS (Google Calendar, Outlook).
- FR-44 Xem **TKB gộp**: mỗi trường một màu, ghi rõ trường, cơ sở, môn, lớp, phòng, ngày, giờ bắt đầu–kết thúc.
- FR-45 Phát hiện trùng giờ giữa các trường và cảnh báo không kịp di chuyển giữa 2 cơ sở.
- FR-46 Xuất lịch gộp ra ICS / Excel / PDF.
- FR-47 Chia sẻ giờ bận với giáo vụ (chỉ khung giờ, không lộ chi tiết lịch trường khác).

### 2.4. Yêu cầu phi chức năng

| Mã | Yêu cầu | Cách kiểm chứng |
|---|---|---|
| NFR-01 | Bộ dữ liệu mẫu (~160 lớp/tổ, ~30 GV) có lời giải **0 vi phạm cứng** trong ≤ 60 s trên laptop thông thường | Đo thời gian trong thực nghiệm |
| NFR-02 | Giao diện không bị treo khi bộ giải, import hoặc export đang chạy | Tác vụ dài chạy ngoài UI thread |
| NFR-03 | Kết quả tái lập được với cùng seed | Chạy 2 lần cùng seed → cùng điểm |
| NFR-04 | Mật khẩu không lưu dạng thô | PBKDF2/BCrypt + salt |
| NFR-05 | Dữ liệu nhất quán khi chốt/công bố | Transaction JDBC, rollback khi lỗi |
| NFR-06 | Dễ thêm ràng buộc mới | Thêm 1 class `Constraint`, không sửa bộ giải |
| NFR-07 | Dễ build và chạy | `mvn package`, CSDL H2 nhúng, có dữ liệu mẫu sẵn |

---

## 3. Dữ liệu

### 3.1. Hệ đào tạo & loại lớp

| Khái niệm | Mô tả |
|---|---|
| Hệ thường (`61FIT…`) | Mỗi môn có 1 lớp Lecture cho cả khóa (70–200 SV) và nhiều tổ Tutorial (~30 SV/tổ) |
| CLC (`62FIT…`) | Mỗi nhóm CLC (~30 SV) có 1 lớp Lecture + 1 tổ Tutorial riêng |
| Lecture (LEC) | Lớp lý thuyết, học giảng đường |
| Tutorial (TUT) | Tổ thực hành, học phòng máy |
| Lớp gộp (COMBINED) | Môn 4 tiết (Chuyên đề SS1, SS2…), gộp Lecture + Tutorial, chiếm 2 ca liền; có nhiều nhóm song song do nhiều GV dạy |
| Section | Một lớp Lecture, một tổ Tutorial hoặc một lớp gộp; là **đơn vị phân công GV** |

Quy ước mã môn: `61FIT3DBS` = `61` (hệ thường) / `62` (CLC) + `FIT` (ngành CNTT) + `3` (năm/cấp độ) + `DBS` (viết tắt môn). Nhóm lớp `01.2024` = nhóm 01 của khóa 2024.

### 3.2. Danh mục môn (bộ dữ liệu mẫu)

**Hệ thường — `61FIT` (23 môn, 113 lớp/tổ)**

| Mã môn | Tên học phần | Khóa | Lecture (sĩ số) | Số tổ Tutorial | Tiết/buổi |
|---|---|---|---|---|---|
| 61FIT2CAL | Toán cao cấp | 2025 | 1 (200) | 6 | 2 |
| 61FIT2DMA | Toán rời rạc | 2025 | 1 (200) | 6 | 2 |
| 61FIT2PCO | Nguyên lý máy tính | 2025 | 1 (200) | 5 | 2 |
| 61FIT2POP | Nguyên lý hệ điều hành | 2025 | 1 (200) | 5 | 2 |
| 61FIT2PR1 | Lập trình 1 | 2025 | 1 (200) | 5 | 2 |
| 61FIT2RES | Phương pháp nghiên cứu khoa học | 2025 | 1 (100) | 0 | 2 |
| 61FIT3AIN | Trí tuệ nhân tạo | 2025 | 1 (100) | 3 | 2 |
| 61FIT3CGR | Đồ họa máy tính | 2024 | 1 (150) | 4 | 2 |
| 61FIT3DBS | Cơ sở dữ liệu | 2024 | 1 (200) | 6 | 2 |
| 61FIT3DSY | Hệ thống phân tán | 2024 | 1 (100) | 3 | 2 |
| 61FIT3EBU | Kinh doanh điện tử | 2024 | 1 (100) | 3 | 2 |
| 61FIT3JSD | Phát triển phần mềm Java | 2024 | 1 (100) | 3 | 2 |
| 61FIT3MUL | Đa phương tiện | 2024 | 1 (100) | 3 | 2 |
| 61FIT3NPR | Lập trình mạng | 2024 | 1 (100) | 3 | 2 |
| 61FIT3SAD | Phân tích thiết kế hệ thống | 2024 | 1 (100) | 3 | 2 |
| 61FIT3SE1 | Công nghệ phần mềm 1 | 2024 | 1 (200) | 3 | 2 |
| 61FIT3SS1 | Chuyên đề 1 | 2024 | 5 nhóm gộp × 30 | — | 4 |
| 61FIT3WPR | Lập trình web | 2024 | 1 (70) | 2 | 2 |
| 61FIT4ATI | Các chủ đề mới trong ngành CNTT | 2023 | 1 (150) | 5 | 2 |
| 61FIT4EIS | Hệ thống thông tin doanh nghiệp | 2023 | 2 (100) | 6 | 2 |
| 61FIT4ENP | Lập trình ứng dụng doanh nghiệp *(tên giả định)* | 2023 | 1 (60) | 2 | 2 |
| 61FIT4MLA | Học máy và ứng dụng | 2023 | 1 (200) | 5 | 2 |
| 61FIT4SPM | Quản lý dự án phần mềm | 2023 | 1 (150) | 4 | 2 |

**Chất lượng cao — `62FIT` (13 môn, 48 lớp/tổ)**

| Mã môn | Tên học phần | Khóa | Số nhóm CLC | Lecture | Tutorial | Tiết/buổi |
|---|---|---|---|---|---|---|
| 62FIT2POP | Nguyên lý hệ điều hành | 2025 | 1 | 1 | 1 | 2 |
| 62FIT2PR1 | Lập trình 1 | 2025 | 1 | 1 | 1 | 2 |
| 62FIT2RES | Phương pháp nghiên cứu khoa học | 2024 | 1 | 1 | 0 | 2 |
| 62FIT3DBS | Cơ sở dữ liệu | 2024 | 1 | 1 | 1 | 2 |
| 62FIT3SAD | Phân tích thiết kế hệ thống | 2024 | 1 | 1 | 1 | 2 |
| 62FIT3SEN | Công nghệ phần mềm | 2023 | 1 | 1 | 1 | 2 |
| 62FIT3SS1 | Chuyên đề 1 | 2023 | 1 (36 SV) | gộp | — | 4 |
| 62FIT3WPR | Lập trình web | 2023 | 3 | 3 | 3 | 2 |
| 62FIT4ATI | Các chủ đề mới trong ngành CNTT | 2023 | 3 | 3 | 3 | 2 |
| 62FIT4EBU | Kinh doanh điện tử | 2024 | 3 | 3 | 3 | 2 |
| 62FIT4EIS | Hệ thống thông tin doanh nghiệp | 2023 | 3 | 3 | 3 | 2 |
| 62FIT4MLA | Học máy và ứng dụng | 2023 | 3 | 3 | 3 | 2 |
| 62FIT4NAD | Quản trị mạng | 2023 | 3 | 3 | 3 | 2 |

### 3.3. Khung thời gian

| Ca | Tiết bắt đầu | Giờ | Buổi |
|---|---|---|---|
| 0 | 3 | 07:10 – 09:15 | Sáng |
| 1 | 5 | 09:30 – 11:35 | Sáng |
| 2 | 7 | 12:20 – 14:25 | Chiều |
| 3 | 9 | 14:40 – 16:45 | Chiều |
| 4 | 11 | 16:40 – 18:45 | Tối |
| 5 | 13 | 18:55 – 21:00 | Tối |

- 6 ca/ngày × 6 ngày (Thứ 2 – Thứ 7) = **36 khung giờ/tuần**. Môn 2 tiết chiếm 1 ca, môn 4 tiết chiếm 2 ca liền.
- Tuần 1 bắt đầu **03/08/2026** (giả định). Dải tuần mặc định:

| Nhóm | Lecture | Tutorial |
|---|---|---|
| Hệ thường, khóa 2023 & 2024 | tuần 3–14 | tuần 4–15 |
| Hệ thường, khóa 2025 | tuần 6–17 | tuần 7–18 |
| CLC | tuần 3–14 | tuần 3–14 |

- Bảng ca và ngày bắt đầu tuần 1 lưu trong CSDL, không viết cứng trong code, vì mỗi trường khác có bảng tiết riêng (dùng cho chức năng gộp lịch).

### 3.4. Phòng học

Phòng được sinh theo quy ước mã phòng của Trường Đại học Hà Nội (HANU): `<tầng><số thứ tự 2 chữ số> <tòa>`. Ví dụ `802 C` là tầng 8, phòng 02, tòa C; `205 D1` là tầng 2, phòng 05, tòa D1.

| Tòa | Phòng mẫu | Sinh thêm ngẫu nhiên | Loại & sức chứa (giả định) |
|---|---|---|---|
| A (A1) | `201 A1`, `206 A1` | +4 phòng, tầng 1–3 | Phòng máy 40 |
| B | — | +6 phòng, tầng 1–4 | Phòng máy 40 |
| C | `101, 402, 404, 414, 416, 417, 621, 702, 714, 801, 802, 805, 810, 901, 902 C` | +10 phòng, tầng 1–9 | Tầng 8–9 và `101 C`: giảng đường 200 · tầng 6–7: giảng đường 120 · tầng 4: phòng CLC 40 · còn lại: phòng máy 40 |
| D (D1, D2) | `205, 206, 207 D1`, `409 D2` | +5 phòng, tầng 1–4 | Phòng máy 40 |
| E | `203, 303, 304, 405 E` | +3 phòng, tầng 1–5 | Tầng 4: giảng đường 120 · còn lại: phòng máy 40 |

- Tổng khoảng **53 phòng**. Phòng sinh thêm do `RoomCatalogGenerator(seed)` tạo: cùng seed cho ra cùng danh mục; ghi vào `seed.sql` với cờ `assumed = TRUE`.
- Lecture học giảng đường; Tutorial học phòng máy; lớp CLC ưu tiên tầng 4 tòa C.

### 3.5. Danh sách GV phụ trách

- Với mỗi môn, trưởng khoa khai báo danh sách GV có thể phụ trách. Mặc định mọi GV trong danh sách dạy được cả Lecture lẫn Tutorial; hệ thống tự quyết ai nhận lớp nào.
- Ví dụ môn `61FIT2PR1` (1 Lecture + 5 tổ Tutorial), danh sách phụ trách = {GV A, GV B, GV C}. Một kết quả phân công có thể là:

| Section | GV (suốt học kỳ) |
|---|---|
| Lecture 01.2025 | GV A |
| Tutorial 01, 02 | GV A |
| Tutorial 03, 04 | GV B |
| Tutorial 05 | GV C |

- **GV nhận lớp/tổ nào thì dạy lớp/tổ đó từ tuần đầu đến tuần cuối.** Không đổi GV giữa các tuần.
- Các buổi dạy của GV ở ngành khác (ngoài phạm vi) được nhập dưới dạng **lịch cố định**: bộ giải không di chuyển nhưng không được xếp trùng.
- Dữ liệu GV mẫu do `DemoDataGenerator(seed)` sinh ra (tên GV dạng mã `GV01`, `GV02`…).

---

## 4. Mô hình bài toán

### 4.1. Thực thể

| Thực thể | Thuộc tính chính | Ví dụ |
|---|---|---|
| `Course` | code, name, program (REGULAR / HIGH_QUALITY), level | `61FIT3DBS – Cơ sở dữ liệu` |
| `StudentGroup` | code, intakeYear, program | `01.2024` |
| `Section` *(đơn vị phân công GV)* | course, group, subGroup, kind (LEC / TUT / COMBINED), size, weekFrom–weekTo, **teacher** (cố định cả kỳ), fixedTeacher, teacherLocked | `61FIT3DBS / 01.2024 / TUT 03` |
| `Session` *(đơn vị xếp giờ)* | section, durationSlots (1 hoặc 2), weekMask, roomType, suggestedSlot, timeLocked | 1 buổi/tuần, 12 tuần |
| `Teacher` | code, shortName, aliases, fullName, maxSlotsPerDay, unavailability, preferences | `GV01` |
| `PoolEntry` | course, teacher; tuỳ chọn: canLecture, canTutorial, minSections, maxSections, priority | `61FIT3DBS – GV01` |
| `Room` / `RoomType` | code, building, floor, type, capacity, assumed | `802 C`, `P.MAY` |
| `TimeSlot` | day (2..7), slotIndex (0..5), startTime, endTime | Thứ 2 – ca 0 – 07:10 |
| `Assignment` | section → teacher; session → (day, slot, room) | biến quyết định |
| `Timetable` / `Solution` | danh sách assignment + score | |

### 4.2. Biến quyết định

- Với mỗi **section** `k`: chọn `teacher(k) ∈ pool(course(k))`, dùng chung cho mọi buổi, mọi tuần của section đó.
- Với mỗi **session** `s`: chọn `day(s) ∈ {2..7}` và `slot(s) ∈ {0..5}`. Session 4 tiết chỉ nhận cặp ca liền nhau trong cùng buổi: (0,1), (2,3), (4,5).
- Phòng **không** là biến của bộ giải chính. Bộ giải chỉ đảm bảo đủ phòng theo loại; phòng cụ thể được gán ở bước hậu xử lý (mục 5.9).

Không gian tìm kiếm ≈ (36 × |pool|)^N với N là số session, quá lớn để vét cạn, nên dùng heuristic.

Hai cách tiếp cận phân công, được so sánh trong thực nghiệm E8:
- **Hai giai đoạn:** phân công GV trước (cân bằng tải), rồi xếp giờ với GV đã cố định.
- **Đồng thời** (mặc định): local search thay đổi cả GV lẫn giờ trong cùng một không gian tìm kiếm.

### 4.3. Ràng buộc cứng (phải bằng 0)

| Mã | Ràng buộc |
|---|---|
| H1 | Một GV không dạy 2 buổi chồng giờ (cùng thứ, ca giao nhau, **dải tuần giao nhau**) |
| H2 | Lecture của môn X không trùng giờ bất kỳ Tutorial nào của chính môn X |
| H3 | Mọi lớp/tổ trong kế hoạch đều được xếp đủ; buổi 4 tiết chiếm đúng 2 ca liền |
| H4 | Số phòng loại T dùng đồng thời tại (thứ, ca) ≤ số phòng loại T hiện có; sĩ số ≤ sức chứa |
| H5 | Không xếp vào giờ bận cứng của GV (lịch trường khác đã chia sẻ, lịch cố định ở ngành khác, giờ bận tự khai) |
| H6 | Session đã khóa giờ giữ nguyên vị trí |
| H7 | Ca bắt đầu phải thuộc bảng ca hợp lệ |
| H8 | GV của section phải thuộc danh sách phụ trách của môn (và đúng loại Lec/Tut nếu trưởng khoa có giới hạn) |
| H9 | Số section mỗi GV nhận trong 1 môn nằm trong `[minSections, maxSections]` (nếu trưởng khoa có ghi) |
| H10 | Section có GV cố định hoặc đã khóa GV giữ nguyên GV; sau khi TKB công bố, GV của mọi section cũ tự động bị khóa |
| H11 | Mọi buổi của một section, ở mọi tuần, do cùng 1 GV (bảo đảm bằng cấu trúc vì biến GV nằm ở `Section`) |

Ghi chú:
- Các nhóm song song của cùng một môn (nhiều tổ Tutorial, nhiều nhóm Chuyên đề) **được phép trùng giờ** vì khác GV và khác phòng. Các môn khác nhau cũng được trùng giờ; hệ thống tối ưu phía GV, việc tránh trùng khi đăng ký môn thuộc phía sinh viên.
- Ràng buộc chéo môn phía sinh viên (Lecture môn X không trùng Tutorial môn Y cùng khóa) được cài như **tuỳ chọn, mặc định tắt**, dùng cho thực nghiệm phụ.
- Kiểm tra "dải tuần giao nhau" dùng `weekMask` kiểu `long` (bit k = tuần k): hai buổi xung đột khi `(a.weekMask & b.weekMask) != 0`.

### 4.4. Ràng buộc mềm (càng nhỏ càng tốt)

Với GV `t` và ngày `d`, `mask(t,d)` là **bitmask 6 bit** các ca có dạy (bit i = ca i).

| Mã | Ràng buộc | Công thức penalty | Trọng số mặc định |
|---|---|---|---|
| S1 | **Ca trống kẹp giữa** | `(hi − lo + 1) − popcount(mask)` | 10 / ca |
| S2 | **Ngày chỉ dạy 1 ca** | `popcount(mask) == 1 ? 1 : 0` | 15 / ngày |
| S3 | **Số ngày phải lên trường** | `mask != 0 ? 1 : 0` | 5 / ngày |
| S4 | Quá tải trong ngày | `max(0, popcount(mask) − maxSlotsPerDay)` | 20 / ca vượt |
| S5 | Vi phạm ưu tiên của GV (không dạy tối, không dạy Thứ 7…) | tổng trọng số GV khai báo | 1–10 |
| S6 | Lệch khỏi thứ/ca gợi ý của trưởng khoa | 1 nếu khác gợi ý | 2 (chế độ "giữ gợi ý") |
| S7 | Lớp CLC: Tutorial nên học liền sau Lecture cùng ngày | 1 nếu không liền | 4 |
| S8 | Tutorial nên diễn ra sau Lecture trong tuần | 1 nếu Tutorial trước | 2 |
| S9 | **Ổn định**: khác vị trí so với phiên bản đã công bố | số buổi bị dời | 8 (chế độ xếp lại) |
| S10 | **Cân bằng tải** giữa các GV trong danh sách phụ trách | `Σ |load(t) − target(t)|` | 6 / buổi lệch |
| S11 | GV dạy Lecture nên dạy thêm ít nhất 1 Tutorial của lớp đó | 1 nếu không | 2 |
| S12 | Ít số môn khác nhau mỗi GV phải dạy | số môn − 1 | 3 |
| S13 | Ưu tiên GV chính hơn GV phụ | 1 mỗi section giao cho GV phụ | 2 |
| S14 | *(Tuỳ chọn)* Lớp CLC: Lecture và Tutorial cùng nhóm do cùng 1 GV | 1 nếu khác GV | 0 (tắt) |
| S15 | *(Tuỳ chọn)* Đổi tòa nhà giữa 2 ca liền nhau | số lần đổi | 0 (tắt) |

```java
int lo = Integer.numberOfTrailingZeros(mask);
int hi = 31 - Integer.numberOfLeadingZeros(mask);
int gaps = (hi - lo + 1) - Integer.bitCount(mask);   // S1
boolean single = Integer.bitCount(mask) == 1;          // S2
```

Mỗi cặp (GV, ngày) được tính trong O(1).

**Đánh đổi:** dồn lịch quá mức (S1–S3) có thể làm GV dạy 5–6 ca/ngày, nên cần S4 kéo lại. Không có giới hạn cứng về số buổi/tuần, vì vậy cách "rẻ" nhất để giảm ngày 1 ca là dồn nhiều lớp cho ít GV. S10 (cân bằng tải) luôn được bật để ngăn điều này. Trọng số chỉnh được trên giao diện.

### 4.5. Hàm mục tiêu

`Score = (hard, soft)`, so sánh theo thứ tự từ điển: A tốt hơn B nếu `A.hard < B.hard`, hoặc hai `hard` bằng nhau và `A.soft < B.soft`.

```java
public record Score(int hard, int soft) implements Comparable<Score> {
    public boolean isFeasible() { return hard == 0; }
    public Score plus(Score o) { return new Score(hard + o.hard, soft + o.soft); }
    @Override public int compareTo(Score o) {
        return hard != o.hard ? Integer.compare(hard, o.hard) : Integer.compare(soft, o.soft);
    }
}
```

---

## 5. Thuật toán

### 5.1. Pipeline

```text
Import Excel ─► Kiểm tra hợp lệ ─► Dựng Problem (chỉ mục, đồ thị xung đột, miền giá trị)
     ─► Pha 1: Xây dựng lời giải ban đầu (greedy chọn GV + thứ/ca)
     ─► Pha 2: Local search (Simulated Annealing / Late Acceptance / Tabu), đổi giờ và đổi GV, chạy song song
     ─► Lời giải tốt nhất ─► Gán phòng ─► Báo cáo điểm ─► Chỉnh tay ─► Công bố ─► Xuất file
```

### 5.2. Tiền xử lý

1. Chuẩn hoá dữ liệu: bỏ khoảng trắng thừa trong mã, quy các mã môn biến thể về một mã, ánh xạ tên GV qua bảng alias.
2. Dựng **đồ thị xung đột**: đỉnh là session; có cạnh khi 2 session không được trùng giờ (H1, H2) và dải tuần giao nhau. Bậc của đỉnh thể hiện độ khó xếp.
3. Tính **miền giá trị** của mỗi session: các (thứ, ca) không vi phạm H5, H7; session 4 tiết chỉ nhận cặp ca liền nhau.
4. *(Tuỳ chọn, khi có giới hạn số lớp)* **Kiểm tra khả thi phân công bằng luồng cực đại**. Đồ thị: `Nguồn → Section (cap 1) → (GV, môn) (cap maxSections) → Đích`. Nếu luồng cực đại < số section thì chắc chắn không phân công được; hệ thống báo trưởng khoa môn thiếu GV trước khi chạy bộ giải. Khi không có giới hạn, chỉ cần kiểm tra mỗi môn có ít nhất 1 GV phụ trách.

### 5.3. Pha 1 – Xây dựng lời giải ban đầu

Ý tưởng tương tự thuật toán tô màu **DSatur**:
1. Sắp xếp session: đã khóa → 4 tiết → miền giá trị nhỏ → bậc lớn → sĩ số lớn.
2. Lần lượt đặt mỗi session vào bộ **(GV, thứ, ca)** có chi phí tăng thêm nhỏ nhất (hard trước, soft sau). Nhờ hàm điểm mềm, greedy tự ưu tiên GV đã có mặt ở trường hôm đó và ca liền kề; S10 ngăn dồn hết cho một GV.
3. Nếu không còn chỗ hợp lệ, đặt vào chỗ ít vi phạm nhất để pha 2 sửa.

### 5.4. Pha 2 – Local search

**Các bước di chuyển** (interface `Move` với `doMove/undoMove`):

| Move | Mô tả | Mục đích |
|---|---|---|
| `ChangeMove` | Đổi (thứ, ca) của 1 session | cơ bản |
| `SwapMove` | Hoán đổi thời gian của 2 session | thoát cực trị địa phương |
| `TeacherDayPackMove` | Chuyển buổi "lẻ" của GV sang ngày GV đã có lịch, vào vị trí liền kề | giảm S2, S3 |
| `GapCloseMove` | Dời buổi ở rìa ngày vào ca trống kẹp giữa | giảm S1 |
| `ChangeTeacherMove` | Đổi GV của 1 section (toàn bộ buổi, cả kỳ) sang GV khác trong danh sách phụ trách | cân bằng tải, gỡ trùng GV |
| `SwapTeacherMove` | Hoán đổi GV của 2 section cùng môn | giữ tải, cải thiện độ gọn |
| `HandOverMove` | Giao section có buổi "lẻ" của GV A cho GV B đang có mặt ở trường hôm đó, ở ca liền kề | giảm S2 mạnh |
| `KempeChainMove` *(nâng cao)* | Đổi chéo 2 khung giờ theo chuỗi Kempe trên đồ thị xung đột | giữ khả thi khi hard = 0 |

**Chiến lược chấp nhận** (Strategy pattern):
- **Simulated Annealing:** chấp nhận lời giải tệ hơn với xác suất `exp(−Δ/T)`; `T` giảm dần (`T ← αT`); hâm nóng lại khi bị kẹt.
- **Late Acceptance Hill Climbing:** chấp nhận nếu không tệ hơn lời giải ở L bước trước.
- **Tabu Search:** cấm đảo ngược move vừa thực hiện trong k bước.

Vòng lặp chung đặt trong `AbstractLocalSearchSolver` (Template Method); mỗi chiến lược là một class cài đặt `AcceptanceStrategy`.

### 5.5. Tính điểm tăng dần (incremental scoring)

Hệ thống không tính lại toàn bộ điểm sau mỗi move mà duy trì các chỉ mục:
- `int[teacher][day]`: bitmask ca dạy, kèm bộ đếm `int[teacher][day][slot]` để phát hiện trùng (H1).
- `int[course][day][slot]`: phát hiện Lecture trùng Tutorial cùng môn (H2).
- `int[roomType][day][slot]`: đếm phòng đang dùng (H4).
- `load[teacher]`, `load[teacher][course]`: tải giảng dạy (H9, S10, S12).

Một `ChangeMove` của session có GV `t` từ `(d1, c1)` sang `(d2, c2)` chỉ ảnh hưởng `(t, d1)`, `(t, d2)` và vài ô môn/phòng. Một `ChangeTeacherMove` từ GV `a` sang `b` chỉ ảnh hưởng các ngày có buổi của section đó trên `a` và `b`, cùng bộ đếm tải. Nhờ vậy Δ được tính trong thời gian gần như hằng số thay vì O(N).

Tính đúng được kiểm tra bằng test: sau 10.000 move ngẫu nhiên, `incrementalScore == fullRecomputeScore`.

### 5.6. Chạy song song

- **Portfolio song song:** `N` worker trong `ExecutorService` (fixed pool). Mỗi worker có bản sao lời giải riêng, `SplittableRandom(seed + i)` riêng và có thể dùng chiến lược khác nhau (SA, LAHC, Tabu).
- `BestSolutionHolder` dùng `AtomicReference<SolutionSnapshot>` để giữ lời giải tốt nhất toàn cục; snapshot là bất biến nên đọc không cần khóa.
- `AtomicBoolean` làm cờ dừng (người dùng bấm Dừng, hết giờ hoặc đạt mục tiêu).
- *(Nâng cao)* **Island model:** định kỳ, worker kém nhất được khởi tạo lại từ lời giải tốt nhất toàn cục.
- Tiến độ được đẩy lên giao diện qua `SolverListener` (Observer), giới hạn khoảng 200 ms/lần.

**Lý do cần song song:** local search phụ thuộc mạnh vào điểm xuất phát và yếu tố ngẫu nhiên. Chạy nhiều luồng độc lập tận dụng CPU đa nhân và tăng xác suất tìm được lời giải tốt hơn trong cùng thời gian thực. Đồng thời giao diện vẫn phải phản hồi trong khi bộ giải chạy.

### 5.7. Chỉnh tay

- Kéo-thả một buổi trên lưới: hệ thống dùng cùng bộ tính điểm tăng dần để hiển thị ngay Δ điểm và vi phạm mới (đỏ = cứng, vàng = mềm).
- Đổi GV qua hộp thoại: chỉ liệt kê GV trong danh sách phụ trách, đánh dấu GV đang rảnh.
- Mỗi thao tác là một `Command` → undo/redo bằng 2 stack.
- Khóa giờ (H6) và/hoặc khóa GV (H10) để bộ giải không thay đổi.

### 5.8. Xếp lại khi kế hoạch thay đổi

1. Tính chênh lệch giữa kế hoạch cũ và mới (thêm / xoá / sửa).
2. Khởi tạo từ TKB đã công bố: lớp không đổi giữ nguyên chỗ; lớp mới được đặt bằng greedy.
3. Bật S9 (ổn định) với trọng số cao; GV của các section đã công bố bị khóa, chỉ section mới được phân công GV.
4. Báo cáo số buổi bị dời và danh sách GV bị ảnh hưởng, gửi thông báo cho đúng các GV đó.

### 5.9. Gán phòng

Sau khi mọi buổi đã có GV, thứ và ca, `RandomRoomAssigner(seed)` xét từng (thứ, ca):
1. Lọc phòng còn trống, đúng loại (giảng đường / phòng máy), đủ sức chứa.
2. Chọn tòa: nếu GV có ca liền trước/liền sau cùng ngày thì giữ cùng tòa đó; lớp CLC ưu tiên tầng 4 tòa C; còn lại chọn ngẫu nhiên một tòa trong A/B/C/D/E (có trọng số theo số phòng phù hợp).
3. Chọn ngẫu nhiên một phòng trong tòa đó. Cùng seed cho cùng kết quả; đổi seed cho phương án khác.
4. Tòa hết phòng thì thử tòa khác; nếu hết hẳn thì cảnh báo nhưng không chặn công bố.

### 5.10. Giải thích điểm

`ScoreExplanation` liệt kê vi phạm theo từng ràng buộc và từng GV, ví dụ:
`GV01 — S2 Ngày chỉ dạy 1 ca: Thứ 3 (61FIT3DBS-TUT02), Thứ 5 (61FIT3SAD-TUT01) — penalty 30`.

---

## 6. TKB gộp nhiều trường

### 6.1. Mô hình dữ liệu

```java
public record SchoolProfile(String id, String name, String address, String colorHex,
                            Map<Integer, TimeRange> periodTable,   // tiết -> giờ thật của trường đó
                            LocalDate week1Start) {}

public record CalendarEntry(LocalDate date, LocalTime start, LocalTime end,
                            String schoolName, String campus, String title,
                            String classInfo, String room, EntrySource source) {}
// EntrySource: FACULTY_TIMETABLE, MANUAL, EXCEL, ICS
```

### 6.2. Nguồn nhập

```java
public interface ScheduleImporter {
    boolean supports(Path file);
    List<ExternalEvent> importFrom(Path file, SchoolProfile school) throws ImportException;
}
// FacultyTimetableImporter, ExcelTemplateImporter, IcsImporter
// ImporterFactory.forFile(path) chọn importer theo loại file
```

- **Nhập tay:** trường, môn, thứ, giờ bắt đầu–kết thúc (hoặc tiết theo bảng tiết của trường đó), từ ngày–đến ngày, phòng, ghi chú.
- **Excel mẫu** dành cho GV.
- **ICS (RFC 5545):** đọc `VEVENT` với `DTSTART`, `DTEND`, `RRULE` (WEEKLY, BYDAY, UNTIL/COUNT), `EXDATE`, `LOCATION`, `SUMMARY`. Sự kiện không hỗ trợ được báo rõ, không bỏ qua im lặng.

### 6.3. Thuật toán gộp

1. **Mở rộng sự kiện lặp** thành từng ngày cụ thể. Với TKB khoa: `ngày = week1Start + (tuần − 1) × 7 + (thứ − 2)`, giờ lấy từ bảng ca của khoa. Với trường khác: giờ lấy từ bảng tiết của chính trường đó.
2. Gộp tất cả `CalendarEntry`, sắp theo `(date, start)` rồi quét một lượt (O(n log n)):
   - `next.start < prev.end` → **trùng giờ**.
   - `next.start − prev.end < travelMinutes(prev.campus, next.campus)` → **không kịp di chuyển**. Thời gian di chuyển giữa các cơ sở do GV tự nhập (mặc định 30 phút).
3. Hiển thị dạng tuần (lưới ngày × giờ thật, mỗi trường một màu), dạng danh sách theo ngày, và dạng tổng quan học kỳ.
4. Xuất ICS (để nhập vào Google Calendar), Excel, PDF.

### 6.4. Vòng phản hồi giữa các vai trò

GV chọn "Chia sẻ giờ bận với giáo vụ": hệ thống chỉ lưu khung giờ bận (không lưu tên trường/môn) vào `teacher_unavailability`. Ở lần xếp lịch sau, các khung giờ này trở thành ràng buộc cứng H5. Nhờ vậy 3 vai trò liên kết thành một vòng khép kín: trưởng khoa → giáo vụ → giảng viên → giáo vụ.

---

## 7. Kiến trúc

### 7.1. Kiến trúc tổng thể

Ứng dụng desktop nhiều tầng, truy cập CSDL qua JDBC:
- **Mặc định:** H2 nhúng ở chế độ file (`jdbc:h2:./data/schedule;AUTO_SERVER=TRUE`) để 3 vai trò có thể mở ứng dụng đồng thời trên cùng một máy.
- **Nhiều máy:** đổi URL sang MySQL/PostgreSQL trong `config.properties`.

```text
+------------------------------------------------------------------+
|  Presentation (JavaFX / Swing)                                    |
|  LoginView | DeanViews | StaffViews (SolverView, GridView)        |
|  TeacherViews (MyTimetable, MergedCalendar)  — Controller         |
+-------------------------------+----------------------------------+
                                | gọi service
+-------------------------------v----------------------------------+
|  Application Services                                             |
|  AuthService  PlanService  ValidationService  SchedulingService   |
|  TimetableService  PersonalCalendarService  ExportService         |
|  NotificationService                                              |
+-------+-----------------------+------------------+---------------+
        |                       |                  |
+-------v--------+   +----------v---------+   +----v--------------+
| Solver Engine  |   | Persistence (DAO)  |   | I/O               |
| Problem, Score |   | JDBC + Transaction |   | Excel (POI), ICS, |
| Constraints    |   | H2 / MySQL         |   | NIO               |
| Moves, Solvers |   +--------------------+   +-------------------+
| Parallel exec  |
+----------------+
        ▲
+-------+----------------------------------------------------------+
|  Domain Model (record/POJO, không phụ thuộc UI hay DB)            |
+------------------------------------------------------------------+
```

### 7.2. Cấu trúc thư mục

```text
schedulesolver/
├── pom.xml
├── README.md
├── config/
│   └── config.properties              # db.url, solver.defaultThreads, ...
├── database/
│   ├── schema.sql
│   └── seed.sql                       # tài khoản mẫu, phòng, bảng ca, danh mục môn, GV mẫu
├── samples/
│   ├── template_ke_hoach_mo_lop.xlsx
│   └── other_school_demo.ics
├── docs/                              # UML, ảnh chụp màn hình, kết quả thực nghiệm (CSV)
├── report/
└── src/
    ├── main/java/vn/edu/fit/schedulesolver/
    │   ├── App.java                   # main, khởi tạo AppContext
    │   ├── config/                    # AppConfig, AppContext
    │   ├── domain/
    │   │   ├── model/                 # Course, StudentGroup, Section, Session, Teacher, Room,
    │   │   │                          # RoomType, TimeSlot, PoolEntry, Assignment, Timetable,
    │   │   │                          # TeachingPlan, PlanItem, User, Role, PlanStatus, ...
    │   │   ├── calendar/              # SchoolProfile, ExternalEvent, CalendarEntry, TimeRange
    │   │   └── exception/             # DomainException, ValidationException, ...
    │   ├── solver/
    │   │   ├── Problem.java           # dữ liệu bất biến + chỉ mục
    │   │   ├── Solution.java          # trạng thái gán (mỗi luồng 1 bản)
    │   │   ├── score/                 # Score, ScoreCalculator, IncrementalScoreCalculator, ScoreExplanation
    │   │   ├── constraint/
    │   │   │   ├── hard/              # TeacherNoOverlap, LectureVsOwnTutorial, ...
    │   │   │   └── soft/              # TeacherIdleGap, SingleSessionDay, TeachingDays, LoadBalance, ...
    │   │   ├── construct/             # GreedyConstructor
    │   │   ├── move/                  # ChangeMove, SwapMove, TeacherDayPackMove, GapCloseMove,
    │   │   │                          # ChangeTeacherMove, SwapTeacherMove, HandOverMove, ...
    │   │   ├── localsearch/           # AbstractLocalSearchSolver, AcceptanceStrategy,
    │   │   │                          # SimulatedAnnealing, LateAcceptance, TabuAcceptance
    │   │   ├── parallel/              # ParallelPortfolioSolver, BestSolutionHolder
    │   │   ├── feasibility/           # PoolFeasibilityChecker, MaxFlow
    │   │   ├── room/                  # RoomCatalogGenerator, RandomRoomAssigner
    │   │   └── api/                   # Solver, SolverConfig, SolverListener, SolverResult
    │   ├── io/
    │   │   ├── excel/                 # PlanTemplateImporter, LegacyTimetableImporter,
    │   │   │                          # TimetableGridExporter, UniversityImportFormatExporter,
    │   │   │                          # VerifySheetExporter
    │   │   ├── ics/                   # IcsImporter, IcsExporter
    │   │   └── ImporterFactory.java
    │   ├── persistence/
    │   │   ├── ConnectionProvider.java, TransactionManager.java
    │   │   ├── dao/                   # UserDao, PlanDao, TimetableDao, TeacherDao, ...
    │   │   └── jdbc/                  # JdbcUserDao, JdbcPlanDao, ...
    │   ├── service/                   # AuthService, PlanService, SchedulingService, ...
    │   ├── demo/                      # DemoDataGenerator
    │   └── ui/
    │       ├── common/                # TimetableGridView, WeekCalendarView, ScoreChart, Dialogs
    │       ├── login/
    │       ├── dean/
    │       ├── staff/
    │       └── teacher/
    └── test/java/vn/edu/fit/schedulesolver/
        ├── solver/constraint/         # 1 test class cho mỗi ràng buộc
        ├── solver/score/              # IncrementalVsFullScoreTest
        ├── solver/                    # SolverDeterminismTest, FeasibilityTest
        ├── io/                        # ExcelImporterTest, IcsImporterTest
        ├── persistence/               # DAO test với H2 in-memory
        ├── service/                   # AuthServiceTest, PlanWorkflowTest, MergeCalendarTest
        └── benchmark/                 # BenchmarkRunner (ghi CSV)
```

### 7.3. Interface cốt lõi

```java
public interface Constraint {
    String id();                          // "H1", "S2", ...
    String displayName();
    ConstraintLevel level();              // HARD | SOFT
    int weight();
    /** Tính lại toàn phần — dùng cho test và kiểm tra chéo incremental. */
    int penalty(Solution s);
    /** Liệt kê vi phạm để hiển thị và giải thích. */
    List<Violation> explain(Solution s);
}

public interface Solver {
    SolverResult solve(Problem problem, SolverConfig config, SolverListener listener);
}

public interface SolverListener {
    void onProgress(SolverProgress p);
    void onNewBest(SolutionSnapshot best);
    void onFinished(SolverResult result);
}

public interface Move {
    boolean isDoable(Solution s);
    Score delta(Solution s, IncrementalScoreCalculator calc);
    void doMove(Solution s);
    void undoMove(Solution s);
}
```

```java
public abstract class AbstractLocalSearchSolver implements Solver {
    protected abstract AcceptanceStrategy acceptance(SolverConfig cfg);

    @Override
    public final SolverResult solve(Problem p, SolverConfig cfg, SolverListener l) {
        Solution current = new GreedyConstructor().construct(p);
        IncrementalScoreCalculator calc = new IncrementalScoreCalculator(p, current);
        SolutionSnapshot best = current.snapshot(calc.score());
        AcceptanceStrategy acc = acceptance(cfg);
        MoveSelector selector = new MoveSelector(p, cfg.random());
        while (!cfg.termination().isTerminated()) {
            Move m = selector.next(current);
            if (!m.isDoable(current)) continue;
            Score delta = m.delta(current, calc);
            if (acc.accept(calc.score(), delta)) {
                m.doMove(current);
                calc.apply(delta);
                if (calc.score().compareTo(best.score()) < 0) {
                    best = current.snapshot(calc.score());
                    l.onNewBest(best);
                }
            }
            acc.stepEnded();
        }
        return SolverResult.of(best);
    }
}
```

```java
public final class ParallelPortfolioSolver implements Solver {
    private final List<Supplier<Solver>> strategies;   // SA, LAHC, Tabu

    @Override
    public SolverResult solve(Problem p, SolverConfig cfg, SolverListener l) {
        int n = cfg.threads();
        ExecutorService pool = Executors.newFixedThreadPool(n);
        BestSolutionHolder best = new BestSolutionHolder();
        try {
            List<Callable<SolverResult>> tasks = IntStream.range(0, n)
                .mapToObj(i -> (Callable<SolverResult>) () -> strategies.get(i % strategies.size()).get()
                        .solve(p, cfg.withSeed(cfg.seed() + i), new ForwardingListener(best, l)))
                .toList();
            pool.invokeAll(tasks);
            return SolverResult.of(best.get());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return SolverResult.of(best.get());
        } finally {
            pool.shutdownNow();
        }
    }
}

final class BestSolutionHolder {
    private final AtomicReference<SolutionSnapshot> ref = new AtomicReference<>();

    /** Chỉ thay khi tốt hơn; snapshot bất biến nên đọc không cần khóa. */
    boolean offer(SolutionSnapshot candidate) {
        SolutionSnapshot prev = ref.getAndAccumulate(candidate,
            (cur, cand) -> cur == null || cand.score().compareTo(cur.score()) < 0 ? cand : cur);
        return prev == null || candidate.score().compareTo(prev.score()) < 0;
    }

    SolutionSnapshot get() { return ref.get(); }
}
```

### 7.4. OOP, SOLID & Design Patterns

| Khái niệm | Áp dụng |
|---|---|
| Encapsulation | `Solution` chỉ thay đổi qua `Move`; `Score` là record bất biến; mật khẩu băm không lộ ra UI |
| Abstraction | `Constraint`, `Solver`, `Move`, `ScheduleImporter`, các DAO interface |
| Inheritance | `AbstractHardConstraint` / `AbstractSoftConstraint`; `AbstractLocalSearchSolver` → `SimulatedAnnealingSolver`, `LateAcceptanceSolver` |
| Polymorphism | Bộ giải gọi `constraint.penalty()` mà không cần biết loại cụ thể; `importer.importFrom()` |
| Composition | `ScoreCalculator` chứa danh sách `Constraint`; `ParallelPortfolioSolver` chứa các `Solver` |
| Exception handling | `ImportException` (kèm vị trí dòng/ô), `ValidationException`, `InfeasibleProblemException`, `DataAccessException` bọc `SQLException` |
| Single Responsibility | Importer chỉ đọc file; Validator chỉ kiểm tra; Solver chỉ tối ưu; DAO chỉ truy cập CSDL |
| Open/Closed | Thêm ràng buộc, thuật toán, định dạng import mới bằng cách thêm class |
| Liskov Substitution | Mọi `AcceptanceStrategy` thay thế được cho nhau |
| Interface Segregation | `SolverListener` tách khỏi `Solver`; DAO tách theo từng aggregate |
| Dependency Inversion | Service phụ thuộc DAO interface; `AppContext` tiêm cài đặt JDBC (dễ thay bằng bản giả khi test) |

| Pattern | Nơi dùng |
|---|---|
| Strategy | `Solver`, `AcceptanceStrategy`, `MoveSelector` |
| Template Method | `AbstractLocalSearchSolver` |
| Observer | `SolverListener` (tiến độ lên giao diện) |
| Command | `Move` (do/undo), `MoveSessionCommand` (undo/redo khi chỉnh tay) |
| Factory | `ImporterFactory` |
| Adapter | `LegacyTimetableImporter`, importer lịch trường khác |
| State | `PlanStatus`, `TimetableStatus` |
| Builder | `SolverConfig.builder()` |
| Repository / DAO | `persistence.dao` |
| Memento | `SolutionSnapshot` |
| Annotation + Reflection *(tuỳ chọn)* | `@ConstraintDef(id = "S2", name = "Ngày 1 ca", level = SOFT, defaultWeight = 15)`, quét package để tự đăng ký ràng buộc và sinh form chỉnh trọng số |

---

## 8. Cơ sở dữ liệu

```sql
-- ===== Người dùng =====
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- PBKDF2/BCrypt, gồm salt
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL,           -- DEAN | STAFF | TEACHER | ADMIN
  teacher_id    INT NULL,
  failed_logins INT DEFAULT 0,
  locked_until  TIMESTAMP NULL,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Danh mục =====
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE,                       -- GV01
  short_name VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100), email VARCHAR(100),
  max_slots_per_day INT DEFAULT 4                -- dùng cho ràng buộc mềm S4
);
CREATE TABLE teacher_aliases (teacher_id INT, alias VARCHAR(50), PRIMARY KEY (teacher_id, alias));
CREATE TABLE courses (code VARCHAR(20) PRIMARY KEY, name VARCHAR(200),
                      program VARCHAR(15), level INT);           -- REGULAR | HIGH_QUALITY
CREATE TABLE course_aliases (alias VARCHAR(20) PRIMARY KEY, course_code VARCHAR(20));
CREATE TABLE student_groups (code VARCHAR(30) PRIMARY KEY, intake_year INT, program VARCHAR(15));
CREATE TABLE room_types (code VARCHAR(20) PRIMARY KEY, name VARCHAR(100));   -- MAYCHIEU, P.MAY
CREATE TABLE buildings (code VARCHAR(5) PRIMARY KEY, name VARCHAR(50), max_floor INT);  -- A1, B, C, D1, D2, E
CREATE TABLE rooms (code VARCHAR(20) PRIMARY KEY,                -- '802 C'
                    building_code VARCHAR(5), floor INT, room_type_code VARCHAR(20),
                    capacity INT, assumed BOOLEAN DEFAULT TRUE);
CREATE TABLE semesters (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), week1_start DATE, num_weeks INT);
CREATE TABLE time_slots (semester_id INT, slot_index INT, start_period INT, start_time TIME, end_time TIME,
                         PRIMARY KEY (semester_id, slot_index));

-- ===== Kế hoạch mở lớp =====
CREATE TABLE teaching_plans (
  id INT AUTO_INCREMENT PRIMARY KEY, semester_id INT, version INT, status VARCHAR(20),
  created_by INT, submitted_at TIMESTAMP NULL, return_reason VARCHAR(500), parent_plan_id INT NULL
);
-- Mỗi plan_item là 1 section (lớp Lecture / tổ Tutorial / lớp gộp), học 1 buổi/tuần trong [week_from, week_to]
CREATE TABLE plan_items (
  id INT AUTO_INCREMENT PRIMARY KEY, plan_id INT NOT NULL,
  course_code VARCHAR(20), group_code VARCHAR(30), sub_group VARCHAR(10),
  kind VARCHAR(10),                              -- LEC | TUT | COMBINED
  size INT, periods INT, room_type_code VARCHAR(20),
  week_from INT, week_to INT, suggested_day INT NULL, suggested_period INT NULL,
  fixed BOOLEAN DEFAULT FALSE, fixed_teacher_id INT NULL, note VARCHAR(500)
);
CREATE TABLE course_teacher_pool (
  plan_id INT, course_code VARCHAR(20), teacher_id INT,
  can_lecture BOOLEAN DEFAULT TRUE, can_tutorial BOOLEAN DEFAULT TRUE,
  min_sections INT DEFAULT 0, max_sections INT NULL,
  priority INT DEFAULT 1,                        -- 1 = GV chính, 2 = GV phụ
  PRIMARY KEY (plan_id, course_code, teacher_id)
);

-- ===== Thời khóa biểu =====
CREATE TABLE timetables (
  id INT AUTO_INCREMENT PRIMARY KEY, plan_id INT, version INT, status VARCHAR(20),
  row_version INT DEFAULT 0,                     -- optimistic locking khi nhiều giáo vụ cùng sửa
  hard_score INT, soft_score INT, solver_config TEXT, created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, published_at TIMESTAMP NULL
);
CREATE TABLE assignments (
  timetable_id INT, plan_item_id INT, teacher_id INT NOT NULL,
  day INT, slot_index INT, room_code VARCHAR(20) NULL,
  time_locked BOOLEAN DEFAULT FALSE, teacher_locked BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (timetable_id, plan_item_id)
);
CREATE TABLE assignment_co_teachers (            -- đồng giảng
  timetable_id INT, plan_item_id INT, teacher_id INT,
  PRIMARY KEY (timetable_id, plan_item_id, teacher_id)
);
CREATE TABLE fixed_teaching (                    -- lịch dạy cố định ở ngành khác (không tối ưu)
  id INT AUTO_INCREMENT PRIMARY KEY, teacher_id INT, day INT, slot_index INT,
  duration_slots INT, week_from INT, week_to INT, note VARCHAR(200)
);
CREATE TABLE solver_runs (                       -- lưu kết quả thực nghiệm
  id INT AUTO_INCREMENT PRIMARY KEY, timetable_id INT, algorithm VARCHAR(30), threads INT, seed BIGINT,
  time_limit_ms INT, duration_ms INT, iterations BIGINT, best_hard INT, best_soft INT,
  started_at TIMESTAMP
);

-- ===== Giảng viên =====
CREATE TABLE teacher_unavailability (
  id INT AUTO_INCREMENT PRIMARY KEY, teacher_id INT, day INT, start_time TIME, end_time TIME,
  week_from INT, week_to INT, hard BOOLEAN DEFAULT TRUE,
  source VARCHAR(20)                             -- MANUAL | EXTERNAL_SHARED
);
CREATE TABLE teacher_preferences (id INT AUTO_INCREMENT PRIMARY KEY, teacher_id INT, pref_type VARCHAR(30),
                                  day INT NULL, slot_index INT NULL, weight INT);
CREATE TABLE external_schools (id INT AUTO_INCREMENT PRIMARY KEY, teacher_id INT, name VARCHAR(150),
                               address VARCHAR(255), color VARCHAR(10), period_table TEXT, week1_start DATE NULL);
CREATE TABLE external_events (
  id INT AUTO_INCREMENT PRIMARY KEY, school_id INT, title VARCHAR(200), class_info VARCHAR(100),
  day_of_week INT NULL, start_time TIME, end_time TIME, date_from DATE, date_to DATE,
  single_date DATE NULL, room VARCHAR(50), source VARCHAR(10), ics_uid VARCHAR(255)
);
CREATE TABLE travel_times (teacher_id INT, from_place VARCHAR(150), to_place VARCHAR(150), minutes INT);

-- ===== Thông báo & nhật ký =====
CREATE TABLE notifications (id INT AUTO_INCREMENT PRIMARY KEY, to_user_id INT, message VARCHAR(500),
                            is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE audit_log (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50),
                        detail VARCHAR(1000), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
```

- Mọi truy vấn dùng `PreparedStatement`.
- **Transaction** cho các thao tác nhiều bảng:
  - Chốt kế hoạch: tạo phiên bản mới, đổi trạng thái, ghi thông báo.
  - Công bố TKB: ghi batch `assignments`, cập nhật trạng thái TKB và kế hoạch, gửi thông báo cho các GV liên quan.
  - Import Excel: lỗi giữa chừng thì rollback toàn bộ và báo dòng lỗi.
- Thông báo giữa các vai trò được đọc khi đăng nhập và kiểm tra định kỳ (30 s) bằng `ScheduledExecutorService`.

---

## 9. Định dạng nhập / xuất

### 9.1. File Excel mẫu cho Trưởng khoa

**Sheet `PlanItems`**

| Cột | Ý nghĩa | Ví dụ | Bắt buộc |
|---|---|---|---|
| MaMH | Mã môn | 61FIT3DBS | ✔ |
| TenMH | Tên học phần | Cơ sở dữ liệu | ✔ |
| HeDaoTao | THUONG / CLC | THUONG | ✔ |
| NhomTo | Nhóm lớp – khóa | 01.2024 | ✔ |
| ToTH | Tổ Tutorial (trống = Lecture) | 03 | |
| Loai | LEC / TUT / COMBINED | TUT | ✔ |
| SiSo | Sĩ số | 30 | ✔ |
| SoTiet | 2 hoặc 4 | 2 | ✔ |
| TinhChatPhong | MAYCHIEU / P.MAY | P.MAY | ✔ |
| TuanBD / TuanKT | Dải tuần | 4 / 15 | ✔ |
| GVCoDinh | GV bắt buộc cho lớp này (trống = hệ thống phân công) | | |
| ThuGoiY / TietGoiY | Thứ/tiết gợi ý | 5 / 7 | |
| CoDinh | 1 = bắt buộc đúng thứ/tiết gợi ý | 0 | |
| GhiChu | | | |

**Sheet `TeacherPool`** (danh sách GV phụ trách)

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| MaMH | Mã môn | 61FIT3DBS |
| GiangVien | Mã hoặc tên tắt GV | GV01 |
| DayLec | *(tuỳ chọn, mặc định 1)* được dạy Lecture | 1 |
| DayTut | *(tuỳ chọn, mặc định 1)* được dạy Tutorial | 1 |
| SoLopMin / SoLopMax | *(tuỳ chọn)* số section tối thiểu/tối đa trong môn | 1 / 3 |
| UuTien | *(tuỳ chọn)* 1 = GV chính, 2 = GV phụ | 1 |

**Sheet phụ:** `Teachers` (mã, tên tắt, họ tên, email, số ca tối đa/ngày), `Config` (ngày bắt đầu tuần 1, bảng ca).

Hệ thống cũng đọc được file TKB định dạng cũ của khoa qua `LegacyTimetableImporter` (Adapter).

### 9.2. File xuất

1. **Lưới TKB:** khối Lecture/Tutorial, cột Thứ 2 – Thứ 7, mỗi ca một khối hàng, tô màu theo khóa.
2. **Định dạng import của hệ thống đào tạo:** 84 cột (`IsKgXepPh, NhomTo, ToTH, …, MaMH, TKBT1…TKBT70`, đánh `x` ở các tuần có học), tách sheet hệ thường / CLC.
3. **TKB từng GV.**
4. **Bảng kiểm tra tự động:** mỗi tiêu chí PASS/FAIL kèm danh sách vi phạm.
5. **Chênh lệch giữa 2 phiên bản:** chỉ các lớp thay đổi.

Thư viện: Apache POI (`poi-ooxml`), dùng `DataFormatter` khi đọc số dạng text, xử lý merged cell và ô nhiều dòng; thao tác file bằng NIO (`Files`, `Path`) với `try-with-resources`.

---

## 10. Tài khoản & bảo mật

- Băm mật khẩu bằng **PBKDF2WithHmacSHA256** (`javax.crypto`) hoặc **BCrypt**; lưu salt, hash và số vòng lặp.
- So sánh hash bằng `MessageDigest.isEqual`.
- Khóa tạm 5 phút sau 5 lần đăng nhập sai.
- Người dùng hiện tại và vai trò lưu trong `AppContext`; mỗi service kiểm tra quyền (`requireRole(Role.STAFF)`), không chỉ ẩn nút trên giao diện.
- Tài khoản mẫu trong `seed.sql`: `dean`, `staff`, `teacher1`, `teacher2`; bắt buộc đổi mật khẩu ở lần đăng nhập đầu.
- Chia sẻ giờ bận chỉ gửi khung giờ, không gửi chi tiết lịch trường khác.

---

## 11. Giao diện

**Chung:** Đăng nhập, Đổi mật khẩu, Thanh thông báo, Menu theo vai trò.

**Trưởng khoa:** Danh sách kế hoạch (phiên bản, trạng thái) · Bảng chỉnh sửa kế hoạch (lọc/sắp xếp, tô đỏ dòng lỗi) · Danh sách GV phụ trách theo môn · Thống kê tải GV · So sánh 2 phiên bản · Chốt và gửi giáo vụ.

**Giáo vụ:** Hộp thư kế hoạch · Tài nguyên (bảng ca, tuần, phòng) · Màn hình bộ giải · Lưới TKB (theo khoa / GV / nhóm / phòng) · Báo cáo điểm · So sánh phương án · Công bố · Xuất file.

**Giảng viên:** TKB của tôi · Giờ bận & ưu tiên · Trường khác (danh sách + bảng tiết) · Nhập lịch (tay / Excel / ICS) · Lịch gộp · Xuất.

```text
┌─ Bộ giải ──────────────────────────────────────────────────────────────┐
│ Kế hoạch: FIT HK1 2026-2027 v3 (FINAL)   Lớp/tổ: 161   GV: 28   Khóa: 0 │
│ Thuật toán: [Portfolio ▼]  Luồng: [4 ▼]  Thời gian: [60 s]  Seed: [42]   │
│ Chế độ: (•) Tối ưu toàn phần  ( ) Giữ gợi ý trưởng khoa  ( ) Ít xáo trộn  │
│ Phân công GV: (•) Tự phân công  ( ) Giữ phân công hiện có                │
│ Trọng số: Ca trống [10]  Ngày 1 ca [15]  Số ngày [5]  Cân bằng tải [6]…   │
│ [▶ Chạy]  [■ Dừng]                                                        │
│ ┌ Điểm tốt nhất theo thời gian ─────────────┐  Hard: 0   Soft: 1 234      │
│ │ \__                                       │  Ngày 1 ca: --  Ca trống: -- │
│ │    \______                                │  Luồng 1: SA     soft …      │
│ │           \______________                 │  Luồng 2: LAHC   soft …      │
│ └───────────────────────────────────────────┘  Luồng 3: Tabu   soft …      │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Lịch gộp – GV01 – Tuần 7 (14/09 – 20/09/2026) ─────── [◀] [▶] [Xuất ICS] ┐
│         T2 14/09        T3 15/09         T4 16/09        …                │
│ 07:10  ┌────────────┐                  ┌──────────────┐                   │
│        │FIT – DBS L │                  │Trường X – CSDL│  ■ FIT            │
│ 09:15  │01.2024 802C│                  │Cơ sở 2 – P305 │  ■ Trường X       │
│ 09:30  ├────────────┤                  └──────────────┘                   │
│        │FIT – DBS T1│  ⚠ 11:35→12:00: không kịp di chuyển FIT → Trường X  │
│ …                                                                         │
└───────────────────────────────────────────────────────────────────────────┘
```

Lưới TKB và lịch tuần là **component tự vẽ** (custom `Canvas` / `JPanel.paintComponent`), hỗ trợ kéo-thả.

---

## 12. Mô hình đa luồng

| Luồng | Nhiệm vụ | Cơ chế |
|---|---|---|
| UI thread (FX Application Thread / EDT) | Vẽ giao diện, nhận sự kiện | Không chạy tác vụ nặng |
| Solver workers (N) | Mỗi luồng chạy một local search độc lập | `ExecutorService` fixed pool, `Callable` |
| Progress publisher | Gom tiến độ, cập nhật giao diện mỗi ~200 ms | `ScheduledExecutorService` + `Platform.runLater` / `SwingUtilities.invokeLater` |
| Background I/O | Import/export Excel, ICS, truy vấn lớn | JavaFX `Task` / Swing `SwingWorker` |
| Notification poller | Kiểm tra thông báo mới | `ScheduledExecutorService` |
| Benchmark runner | Chạy hàng loạt cấu hình thực nghiệm | `CompletableFuture`, ghi CSV |

**Tài nguyên chia sẻ & đồng bộ**

| Tài nguyên | Rủi ro | Giải pháp |
|---|---|---|
| Lời giải tốt nhất toàn cục | Hai luồng cùng ghi, mất cập nhật | `AtomicReference` + `getAndAccumulate` với snapshot bất biến |
| Cờ dừng | Luồng không thấy giá trị mới | `AtomicBoolean`, kiểm tra mỗi vòng lặp; `Thread.interrupt()` |
| `Problem` (dữ liệu đầu vào) | — | Bất biến (`final`, `List.copyOf`), chia sẻ không cần khóa |
| `Solution` đang tối ưu | Hai luồng sửa cùng object | Mỗi luồng một bản sao riêng (thread confinement) |
| Bộ sinh số ngẫu nhiên | Tranh chấp, không tái lập | `SplittableRandom(seed + i)` riêng mỗi luồng |
| Bộ đếm thống kê | Race khi cộng dồn | `LongAdder` |
| Dữ liệu hiển thị | UI đọc khi solver đang ghi | UI chỉ đọc snapshot |

Phần debugging minh hoạ race condition bằng một phiên bản dùng biến thường (`if (cand < best) best = cand;`) chạy lặp nhiều lần, rồi so sánh với phiên bản dùng `AtomicReference` / `LongAdder`.

---

## 13. Kiểm thử

### 13.1. Loại kiểm thử

- **Unit:** từng `Constraint` trên bộ dữ liệu nhỏ dựng tay, `Score.compareTo`, bitmask, parser mã môn, `IcsImporter`, quy đổi tiết → giờ theo từng trường, `PasswordHasher`.
- **Kiểm thử ngẫu nhiên:** 10.000 move ngẫu nhiên → `incremental == full`; `doMove` rồi `undoMove` → trạng thái như cũ.
- **Integration:** import file Excel mẫu, DAO với H2 in-memory, luồng DRAFT → FINAL → PUBLISHED.
- **System / GUI:** kịch bản thủ công có ảnh chụp: đăng nhập từng vai trò, chạy bộ giải, chỉnh tay, công bố, GV xem lịch gộp.
- **Concurrency:** chạy song song 50 lần không lỗi; dừng giữa chừng vẫn trả về lời giải hợp lệ.
- **Performance:** benchmark ở mục 14.

### 13.2. Test case

| ID | Test case | Input | Expected |
|---|---|---|---|
| TC01 | Đăng nhập đúng | `staff` / mật khẩu đúng | Vào màn hình Giáo vụ |
| TC02 | Đăng nhập sai 5 lần | Mật khẩu sai ×5 | Tài khoản bị khóa tạm 5 phút |
| TC03 | Phân quyền | TEACHER gọi `PlanService.submit()` | `AccessDeniedException` |
| TC04 | Import file mẫu | File Excel kế hoạch mẫu | Đúng 161 lớp/tổ (113 hệ thường + 48 CLC) |
| TC05 | Ca không hợp lệ | Dòng có tiết bắt đầu không thuộc bảng ca | Lỗi kèm số dòng |
| TC06 | Môn chưa có GV phụ trách | Môn không có dòng nào trong `TeacherPool` | Báo lỗi, chặn chạy bộ giải |
| TC07 | Alias mã môn | File có `61FIT2AIN` | Import thành `61FIT3AIN` |
| TC08 | H1 trùng GV | 2 buổi cùng GV, Thứ 2 ca 0, tuần 3–14 | hard = 1 |
| TC09 | H1 khác dải tuần | Như TC08 nhưng tuần 3–8 và 9–14 | hard = 0 |
| TC10 | H2 Lecture trùng Tutorial cùng môn | Lec DBS và Tut DBS-01 cùng giờ | hard = 1 |
| TC11 | Nhóm song song cùng môn | Tut DBS-01 và Tut DBS-02 cùng giờ, khác GV, khác phòng | hard = 0 |
| TC12 | Khác môn trùng giờ | Lec MUL trùng Tut DBS cùng khóa, khác GV | hard = 0 |
| TC13 | Lớp gộp 4 tiết | SS1 nhóm 01–05, 5 GV khác nhau, cùng ca tối | hard = 0; mỗi nhóm chiếm đúng 2 ca liền |
| TC14 | S1 ca trống | GV dạy ca 0 và ca 3 cùng ngày | penalty S1 = 2 ca |
| TC15 | S2 ngày 1 ca | GV dạy đúng 1 ca Thứ 3 | penalty S2 = 1 ngày |
| TC16 | Incremental = full | 10.000 move ngẫu nhiên (đổi giờ + đổi GV) | Luôn bằng nhau |
| TC17 | Undo move | `doMove` rồi `undoMove` | Solution như ban đầu |
| TC18 | Tái lập | 1 luồng, seed 42, chạy 2 lần | Cùng điểm |
| TC19 | Bộ giải trên dữ liệu mẫu | 161 lớp/tổ, 60 s | hard = 0 |
| TC20 | Dừng giữa chừng | Bấm Dừng sau 5 s | Trả lời giải tốt nhất hiện có, UI không treo |
| TC21 | Khóa giờ | Khóa 10 buổi rồi chạy | 10 buổi giữ nguyên |
| TC22 | Khóa GV | Khóa GV của 5 section rồi chạy | 5 section giữ nguyên GV |
| TC23 | Giờ bận GV (H5) | GV bận sáng Thứ 4 | Không buổi nào của GV vào sáng Thứ 4 |
| TC24 | Lịch cố định ngành khác | GV có lịch cố định Thứ 2 ca 1 | Không bị xếp trùng |
| TC25 | GV ngoài danh sách (H8) | Gán section DBS cho GV không phụ trách DBS | hard = 1 |
| TC26 | Giới hạn Lec/Tut | GV có `canLecture = false` bị gán Lecture | hard = 1; nếu không giới hạn → hard = 0 |
| TC27 | Giới hạn số lớp (H9) | GV tối đa 3 section DBS, bị gán 4 | hard = 1 |
| TC28 | Kiểm tra khả thi | Môn 7 section, 2 GV tối đa 3 + 3 | Báo thiếu 1 section trước khi chạy |
| TC29 | Cân bằng tải (S10) | 3 GV, 9 section, không giới hạn | S10 bật: chênh lệch tải ≤ 1 |
| TC30 | Liên tục GV cả kỳ | 1 tổ Tutorial học tuần 4–15 | Mọi buổi tuần 4–15 cùng 1 GV trên lịch gộp |
| TC31 | Xếp lại sau công bố | Công bố rồi thêm 2 tổ Tutorial | Chỉ 2 tổ mới được phân công; GV các section cũ không đổi |
| TC32 | Gán phòng | TKB đã có giờ + GV | Mọi buổi có phòng đúng loại, không phòng nào trùng |
| TC33 | Gán phòng tái lập | Gán 2 lần cùng seed | Giống hệt; đổi seed → khác |
| TC34 | Import ICS lặp tuần | `VEVENT` với `RRULE:FREQ=WEEKLY;UNTIL=…` | Đúng số buổi, đúng ngày |
| TC35 | Gộp lịch trùng giờ | FIT 07:10–09:15 và Trường X 08:00–10:00 cùng ngày | Cảnh báo trùng giờ |
| TC36 | Không kịp di chuyển | Kết thúc 11:35, buổi sau 12:00, cần 40 phút | Cảnh báo di chuyển |
| TC37 | Bảng tiết khác nhau | Trường X tiết 1 = 07:00 | Hiển thị đúng 07:00 |
| TC38 | Công bố (transaction) | Lỗi CSDL giả lập giữa batch | Rollback, TKB vẫn ở PROPOSED |
| TC39 | Xuất định dạng 84 cột | TKB đã công bố | Mở lại bằng importer → dữ liệu giống hệt |

Khi chạy, mỗi test case được bổ sung cột **Actual Result** và **Status**.

---

## 14. Thực nghiệm

Mọi số liệu lấy từ lần chạy thật, lưu vào bảng `solver_runs` hoặc file CSV trong `docs/results/`, kèm cấu hình máy (CPU, số nhân, RAM, JDK). Mỗi cấu hình chạy ít nhất 10 seed; báo cáo trung bình ± độ lệch chuẩn.

| ID | Thực nghiệm | Biến thay đổi | Chỉ số |
|---|---|---|---|
| E1a | TKB lập thủ công (baseline) vs ScheduleSolver, **giữ nguyên phân công GV**, chỉ tối ưu giờ | phương pháp | hard, số ngày 1 ca, số ca trống, tổng ngày đi dạy, số ca tối đa/ngày |
| E1b | Như E1a nhưng **tự phân công GV** trong danh sách phụ trách | phương pháp | như E1a + độ lệch tải (max − min, độ lệch chuẩn) |
| E2 | Tuần tự vs song song | 1 / 2 / 4 / 8 luồng; thời gian 10 / 30 / 60 s | best soft, thời gian đạt hard = 0, speedup, CPU |
| E3 | So sánh thuật toán | Greedy / Greedy + Hill Climbing / SA / LAHC / Tabu / Portfolio | best soft, thời gian |
| E4 | Incremental vs tính lại toàn phần | 2 cách tính điểm | số move/giây |
| E5 | Độ nhạy trọng số | thay đổi S1 / S2 / S3 / S4 / S10 | đánh đổi: ngày 1 ca ↔ quá tải ↔ lệch tải |
| E6 | Khả năng mở rộng | dữ liệu ×1, ×2, ×4 | thời gian đạt hard = 0, best soft |
| E7 | Ổn định khi xếp lại | áp dụng lần lượt các bản cập nhật kế hoạch | số buổi bị dời / đổi GV, có và không có S9 |
| E8 | Phân công 2 giai đoạn vs đồng thời | 2 cách ở mục 4.2 | best soft, ngày 1 ca, độ lệch tải |
| E9 | Độ rộng danh sách phụ trách | danh sách gốc / thêm 1–2 GV mỗi môn | ngày 1 ca, ca trống |

**Baseline:** TKB lập thủ công của khoa được import và đo bằng cùng class `TimetableMetrics`, trên đúng tập section có trong TKB đó, với cùng bảng ca và cùng lịch cố định.

**Cận dưới tham chiếu:** với GV có `n` ca/tuần và tối đa `m` ca/ngày, số ngày tối thiểu là `⌈n/m⌉`; số ngày 1 ca tối thiểu là 1 nếu `n = 1`, ngược lại có thể bằng 0.

| Phương pháp | Hard | Ngày 1 ca | Ca trống | Tổng ngày đi dạy | Thời gian |
|---|---|---|---|---|---|
| Baseline (lập thủ công) | | | | | — |
| Greedy | | | | | |
| SA 1 luồng (giữ phân công) | | | | | |
| Portfolio 4 luồng (giữ phân công) | | | | | |
| Portfolio 4 luồng (tự phân công) | | | | | |
| Cận dưới | 0 | | | | — |

Biểu đồ: best soft theo thời gian cho 1/2/4/8 luồng; biểu đồ cột so sánh các chỉ số E1; boxplot trên 10 seed.

---

## 15. Đóng góp

**Hiện trạng / baseline:** TKB lập thủ công trên Excel, chỉ kiểm tra không trùng lịch, không tối ưu lịch cho GV. Các công cụ có sẵn như UniTime, FET, Timefold Solver không được dùng làm lõi.

**Đóng góp của nhóm:**
1. **Hàm điểm "độ gọn lịch GV"** (ca trống, ngày 1 ca, số ngày lên trường, quá tải, cân bằng tải) tính O(1) bằng bitmask, kết hợp **tính điểm tăng dần**.
2. **Bộ giải 2 pha tự xây dựng**, tối ưu đồng thời **phân công GV** và **thời gian** (greedy kiểu DSatur + local search với các move chuyên biệt `TeacherDayPackMove`, `GapCloseMove`, `HandOverMove`).
3. **Portfolio solver song song** với chia sẻ lời giải tốt nhất an toàn luồng; đo speedup và chất lượng.
4. **Tự động hoá kiểm tra TKB**: các tiêu chí kiểm tra thủ công của khoa trở thành ràng buộc cứng, kèm bảng kiểm tra xuất ra Excel.
5. **Phân công theo section suốt học kỳ**: GV nhận lớp nào dạy lớp đó đến hết kỳ; xếp lại khi có thay đổi mà không đổi GV các lớp cũ.
6. **TKB gộp nhiều trường**: quy đổi tiết → giờ theo bảng tiết từng trường, phát hiện trùng giờ và không kịp di chuyển, xuất ICS.
7. **Vòng phản hồi**: lịch trường khác của GV trở thành giờ bận cứng cho lần xếp sau, liên kết 3 vai trò.
8. **Xuất đúng định dạng import 84 cột** của hệ thống đào tạo.
9. *(Tuỳ chọn)* Ràng buộc dạng plugin qua `@ConstraintDef` + Reflection; form chỉnh trọng số sinh tự động.

---

## 16. Giả định & hạn chế

**Giả định**
- Danh mục môn và lớp/tổ theo mục 3.2; tuần 1 bắt đầu 03/08/2026; không xử lý ngày nghỉ lễ.
- Danh sách GV phụ trách, giới hạn số lớp và tên GV là dữ liệu mẫu (`GV01`, `GV02`…).
- Mọi GV trong danh sách phụ trách dạy được cả Lecture và Tutorial, trừ khi có giới hạn.
- Không giới hạn số buổi/tuần của GV; "tối đa 4 ca/ngày" chỉ là ràng buộc mềm.
- Phòng sinh theo quy ước tòa A–E; loại phòng, sức chứa và các phòng tòa B là giả định.
- Giờ các ca giữ theo bảng ở mục 3.3; hai ca liền kề được coi là hợp lệ.
- Đồng giảng: cả 2 GV đều tính là bận; tải tính cho GV chính.

**Hạn chế**
- Heuristic không đảm bảo tối ưu toàn cục.
- Không xét trùng lịch chéo môn phía sinh viên.
- Không đánh giá việc đổi tòa nhà vì phòng là giả định.
- Thông báo giữa các vai trò không theo thời gian thực (kiểm tra định kỳ).
- Không xử lý GV dạy thay giữa kỳ.

**Hướng phát triển**
- Client/server với thông báo thời gian thực.
- Gán phòng theo dữ liệu thật của trường; lịch thi.
- Tích hợp API hệ thống đào tạo; mở rộng sang các ngành và chương trình khác.
- Ứng dụng web/mobile cho giảng viên.

---

## 17. Công nghệ

| Mục đích | Công nghệ |
|---|---|
| Ngôn ngữ | Java 21 (LTS) |
| Build | Maven |
| Giao diện | JavaFX 21 hoặc Swing + FlatLaf |
| Excel | Apache POI (`poi-ooxml`) |
| CSDL | H2 (mặc định, nhúng) / MySQL (tuỳ chọn), JDBC |
| Băm mật khẩu | `javax.crypto` (PBKDF2) hoặc jBCrypt |
| Lịch ICS | Parser tự viết (Text I/O + `java.time`) hoặc ical4j |
| Đa luồng | `java.util.concurrent` |
| Kiểm thử | JUnit 5 |
| Biểu đồ | JavaFX Chart / XChart, hoặc xuất CSV |

---

## 18. Kế hoạch thực hiện

### 18.1. Phân chia công việc

| Vai trò | Phụ trách |
|---|---|
| Solver | Domain model, ràng buộc, tính điểm tăng dần, greedy, local search, move đổi GV, kiểm tra khả thi |
| Concurrency & Benchmark | Portfolio / Island model, `BestSolutionHolder`, tiến độ, benchmark, thực nghiệm |
| Data / I/O | Import/export Excel, validator, ICS, sinh dữ liệu mẫu, gán phòng |
| Backend / CSDL | Schema, DAO, transaction, đăng nhập, service, luồng trạng thái |
| GUI | Màn hình 3 vai trò, lưới TKB tự vẽ, kéo-thả + undo, lịch gộp |

### 18.2. Lộ trình

| Giai đoạn | Nội dung | Kết quả |
|---|---|---|
| 1 | Dựng project Maven, schema CSDL, domain model | Project build được, ERD, class diagram |
| 2 | Import Excel, validator, dữ liệu mẫu, `TimetableMetrics` | TC04–TC07 pass |
| 3 | Ràng buộc + tính điểm toàn phần + unit test; greedy | TC08–TC15 pass |
| 4 | Tính điểm tăng dần, move, SA/LAHC; GUI đăng nhập + màn hình giáo vụ | TC16–TC19 pass, hard = 0 trên dữ liệu mẫu |
| 5 | Chạy song song, tiến độ; DAO + luồng Trưởng khoa → Giáo vụ; lưới TKB | TC20–TC22, demo end-to-end |
| 6 | Chức năng Giảng viên: TKB, giờ bận, trường khác, ICS, lịch gộp; xuất file | TC23–TC24, TC34–TC37, TC39 |
| 7 | Chỉnh tay + undo, xếp lại khi thay đổi, báo cáo điểm, gán phòng; chạy thực nghiệm | E1–E9 có số liệu, biểu đồ |
| 8 | Review & refactor, README, báo cáo | Hoàn thiện bản nộp |

### 18.3. Quy ước Git

- Nhánh: `main` (bản ổn định) ← `develop` ← `feature/<tên>` (vd `feature/incremental-score`, `feature/ics-import`).
- Mỗi feature được merge qua pull request có review chéo.
- Commit message: `feat(solver): add TeacherDayPackMove`, `fix(import): trim course code`, `test(score): incremental vs full`.
- `.gitignore`: `target/`, file CSDL (`data/`), cấu hình chứa mật khẩu.
- Tag: `v0.1-mvp`, `v0.5-parallel`, `v1.0-final`.

---

## 19. Tài liệu tham khảo

- Schaerf, A. (1999). *A survey of automated timetabling*. Artificial Intelligence Review, 13(2), 87–127.
- Lewis, R. (2008). *A survey of metaheuristic-based techniques for University Timetabling problems*. OR Spectrum, 30(1), 167–190.
- Di Gaspero, L., McCollum, B., & Schaerf, A. (2007). *The Second International Timetabling Competition (ITC-2007): Curriculum-based Course Timetabling (Track 3)*. Technical report.
- Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). *Optimization by Simulated Annealing*. Science, 220(4598), 671–680.
- Burke, E. K., & Bykov, Y. (2017). *The late acceptance Hill-Climbing heuristic*. European Journal of Operational Research, 258(1), 70–78.
- Glover, F. (1989). *Tabu Search—Part I*. ORSA Journal on Computing, 1(3), 190–206.
- Brélaz, D. (1979). *New methods to color the vertices of a graph*. Communications of the ACM, 22(4), 251–256.
- RFC 5545 – Internet Calendaring and Scheduling Core Object Specification (iCalendar).
- Apache POI documentation; Oracle Java SE 21 documentation (`java.util.concurrent`, `java.time`); OWASP Password Storage Cheat Sheet.
