# ĐẶC TẢ CHI TIẾT: KHUNG GIỜ CA/TIẾT (HANU 2.5 TIẾT), MODULE NHÂN SỰ, XEM TKB TUẦN, BẢNG MÃ MÀU & HỆ THỐNG FILE MẪU (TEMPLATE)

---

## 1. Chuẩn Hóa Khung Giờ Ca / Tiết & Giải Quyết Triệt Để Bài Toán Ca 2.5 Tiết HANU

### 1.1. Nguyên nhân lỗi Ca/Tiết hiện tại trên bản Web
1. **Lỗi ép kiểu số nguyên (`int`) chặn ca 2.5 tiết**: Trong `backend/app/timetable/models.py:32-33, 65` và `importer.py:74-75`, trường `periods` đang khai báo kiểu `int`. Khi nhập ca học chuẩn của HANU là **2.5 tiết** (125 phút), hệ thống báo lỗi hoặc cắt mất `.5` thành `2` tiết.
2. **Lỗi công thức cộng giải lao cứng nhắc**: Trong `backend/app/timetable/rules.py:58`, thời lượng đang tính bằng `s.periods * c.period_minutes + (s.periods - 1) * c.break_minutes`. Với 2 tiết $\times 50$ phút $+ 10$ phút nghỉ $= 110$ phút (`07:10` $\to$ `09:00`), bị hụt 15 phút so với ca thực tế của HANU (`07:10` $\to$ `09:15` $= 125$ phút $= 2.5 \text{ tiết} \times 50 \text{ phút}$ không cộng giải lao, hoặc $2 \text{ tiết} \times 50 \text{ phút} + 25 \text{ phút}$).
3. **Lỗi phân rã lặp lại 66 khung giờ tròn (`07:00, 08:00...`)**: Trong `frontend/features/scheduling/config-editor.tsx:38-55`, nút nạp khung chuẩn đang tạo 66 dòng riêng lẻ cho từng ngày từ Thứ 2 đến Thứ 7 theo giờ tròn (`07:00`, `08:00`), làm lệch hoàn toàn với 6 ca chuẩn (`07:10–09:15`, `09:30–11:35`...) trên lưới `term-calendar-model.ts`.

---

### 1.2. Thiết kế Công thức & Quy chuẩn Ca/Tiết Mới (Đáp ứng 100% Note 1 & Note 2)

#### A. Công thức Toán học Đồng bộ Ca $\leftrightarrow$ Tiết (Có Checkbox Giải lao)
Giáo vụ thiết lập các thông số gốc của Học kỳ:
- $M_{\text{period}}$: Số phút của 1 tiết chuẩn (mặc định $50$ phút).
- $P_{\text{shift}}$: Số tiết trong 1 ca (hỗ trợ số thực bước nhảy $0.5$, ví dụ HANU: $P_{\text{shift}} = 2.5$ tiết).
- `include_break` (**Checkbox**): Có cộng thời gian giải lao vào ca hay không.
- $M_{\text{break}}$: Tổng số phút giải lao trong ca (chỉ kích hoạt khi `include_break == true`).

$$\text{Duration}_{\text{ca}} = \text{round}\big(P_{\text{shift}} \times M_{\text{period}}\big) + \begin{cases} M_{\text{break}}, & \text{nếu } \text{include\_break} = \text{true} \\ 0, & \text{nếu } \text{include\_break} = \text{false} \end{cases}$$

$$\text{EndTime}_{\text{ca}} = \text{StartTime}_{\text{ca}} + \text{Duration}_{\text{ca}}$$

- **Ví dụ kiểm chứng khớp tuyệt đối với Ca 1 HANU (`07:10 -> 09:15`)**:
  - Cách 1 (Theo chuẩn 2.5 tiết HANU, bỏ tick checkbox giải lao):
    $$\text{StartTime} = \text{07:10} \ (430'), \quad P_{\text{shift}} = 2.5 \text{ tiết}, \quad M_{\text{period}} = 50', \quad \text{include\_break} = \text{false}$$
    $$\implies \text{Duration} = 2.5 \times 50 + 0 = 125 \text{ phút} \implies \text{EndTime} = 430 + 125 = 555' \ (\textbf{09:15})$$
  - Cách 2 (Theo 2 tiết + tick checkbox giải lao 25 phút):
    $$\text{StartTime} = \text{07:10}, \quad P_{\text{shift}} = 2.0 \text{ tiết}, \quad M_{\text{period}} = 50', \quad \text{include\_break} = \text{true} \ (M_{\text{break}} = 25') \implies \textbf{09:15}$$

#### B. Quy chuẩn 6 Ca Học Áp dụng Chung từ Thứ 2 $\to$ Thứ 7 (Không phân rã lặp lại)
Thay vì bắt Giáo vụ quản lý 66 dòng rời rạc theo từng ngày, giao diện `ConfigEditor` chỉ quản lý **1 Bảng Quy Chuẩn Ca Học Trong Ngày** (gồm 6 ca chuẩn) kèm dãy Checkbox chọn ngày áp dụng (`[x] Thứ 2  [x] Thứ 3  [x] Thứ 4  [x] Thứ 5  [x] Thứ 6  [x] Thứ 7  [ ] Chủ nhật`):

| Mã Ca | Tên Ca | Tiết Quy Đổi (Trường / Khoa) | Giờ Bắt Đầu | Số Tiết ($P_{\text{shift}}$) | Phút/Tiết | Checkbox Giải Lao | Thời Lượng | Giờ Kết Thúc | Buổi Tối? |
|---|---|---|---|---|---|---|---|---|---|
| **Ca 1 (`S1`)** | Sáng 1 | Tiết 1 – 3 (Tiết BĐ: 3) | **07:10** | `2.5` | `50p` | `[ ] Không (0p)` | `125 phút` | **09:15** | Không |
| **Ca 2 (`S2`)** | Sáng 2 | Tiết 4 – 6 (Tiết BĐ: 5) | **09:30** | `2.5` | `50p` | `[ ] Không (0p)` | `125 phút` | **11:35** | Không |
| **Ca 3 (`A1`)** | Chiều 1 | Tiết 7 – 9 (Tiết BĐ: 7) | **12:20** | `2.5` | `50p` | `[ ] Không (0p)` | `125 phút` | **14:25** | Không |
| **Ca 4 (`A2`)** | Chiều 2 | Tiết 10 – 12 (Tiết BĐ: 9) | **14:40** | `2.5` | `50p` | `[ ] Không (0p)` | `125 phút` | **16:45** | Không |
| **Ca 5 (`E1`)** | Chiều muộn | Tiết 13 – 14 (Tiết BĐ: 11) | **16:55** *(Đã fix lỗi 16:40)* | `2.2` *(hoặc 2t + 10p)* | `50p` | `[x] Có (10p)` | `110 phút` | **18:45** | Không |
| **Ca 6 (`E2`)** | Tối | Tiết 15 – 16 (Tiết BĐ: 13) | **18:55** | `2.5` | `50p` | `[ ] Không (0p)` | `125 phút` | **21:00** | **Có** |

> **Đồng bộ Tiết bắt đầu $\leftrightarrow$ Ca bắt đầu**: Khi Giáo vụ chỉnh `Giờ bắt đầu Tiết 1` (ví dụ `07:00` hoặc `07:10`) và `Độ lệch / Nghỉ chuyển ca` (`15 phút`), hệ thống tự động tính và cập nhật dây chuyền giờ bắt đầu của toàn bộ các tiết và các ca tiếp theo trong ngày!

---

## 2. Thiết Kế Lại Module "Nhân Sự" (Hồ Sơ Năng Lực Giảng Viên)

### 2.1. Các yêu cầu bắt buộc từ Note 1 & Note 2
1. **Đặt tên rõ ràng là `"Nhân Sự"`** (hợp nhất danh sách giảng viên và hồ sơ năng lực).
2. **Hiển thị toàn bộ danh sách nhân sự trên một bảng tổng quan — TUYỆT ĐỐI KHÔNG bắt chọn từng người qua dropdown `<select>`** như `capabilities-editor.tsx` hiện tại.
3. **Hiển thị rõ 2 trạng thái (Status)**:
   - **Status Khoa (`active: bool`)**: Còn đang hoạt động giảng dạy tại khoa hay đang nghỉ phép/tạm ngưng (nếu `active == false` thì Solver tự động loại khỏi danh sách phân công).
   - **Status Trực tuyến (`online: bool`)**: Đang online (`🟢 Đang online`) hay offline (`⚪ Offline · Hoạt động 10p trước`) đồng bộ qua Socket.IO.
4. **Phân công rõ ai dạy `LEC` (Lý thuyết), ai dạy `TUT` (Thực hành)**:
   - **Trưởng bộ môn (TBM)**: Có quyền tick sửa trực tiếp `[x] LEC` / `[x] TUT` cho từng môn trên bảng ma trận của bộ môn mình.
   - **Giáo vụ (STAFF)**: Có quyền xem toàn bộ Hồ sơ năng lực của tất cả các bộ môn, lọc theo môn/bộ môn/trạng thái, và quản lý danh mục Nhân sự.

### 2.2. Wireframe Cấu trúc Bảng "Nhân Sự & Hồ Sơ Năng Lực"

```text
+----------------------------------------------------------------------------------------------------------------------------+
| 👥 QUẢN LÝ NHÂN SỰ & HỒ SƠ NĂNG LỰC GIẢNG VIÊN                                  [📥 Tải File Mẫu] [📤 Import] [💾 Lưu]     |
| Bộ lọc: [🔍 Tìm mã/tên GV...] [Bộ môn: Tất cả v] [Status Khoa: Đang hoạt động v] [Online: Tất cả v] [Môn học: Tất cả v]    |
+--------+------------------+---------+-------------------+---------------+------------+-------------------------------------+
| Mã GV  | Họ và Tên        | Bộ môn  | Status tại Khoa   | Status Mạng   | Tải (Tiết) | Hồ sơ Năng lực (Tick trực tiếp)     |
+--------+------------------+---------+-------------------+---------------+------------+-------------------------------------+
| QuyenNV| Ngô Văn Quyền    | HTTT    | [x] Đang HĐ (GV)  | 🟢 Online     | 12 / 16t   | • 61FIT3JSD: [x] LEC  [x] TUT       |
|        |                  |         |                   |               |            | • 61FIT4LTM: [x] LEC  [x] TUT       |
|        |                  |         |                   |               |            | [+ Thêm môn phụ trách...]           |
+--------+------------------+---------+-------------------+---------------+------------+-------------------------------------+
| AnhVQ  | Vũ Quốc Anh      | CNPM    | [x] Đang HĐ (TG)  | 🟢 Online     |  8 / 12t   | • 61FIT3JSD: [ ] LEC  [x] TUT (TG)  |
|        |                  |         | (Trợ giảng)       |               |            | • 61FIT2PR1: [ ] LEC  [x] TUT       |
+--------+------------------+---------+-------------------+---------------+------------+-------------------------------------+
| DungVT | Vũ Thị Dung      | MME     | [ ] Tạm nghỉ      | ⚪ Offline    |  0 / 12t   | • 61MME3WDE: [x] LEC  [x] TUT       |
+--------+------------------+---------+-------------------+---------------+------------+-------------------------------------+
```

---

## 3. Xem Danh Sách Môn Học & Lưới TKB Cả Tuần Ngay Sau Khi Giáo Vụ Xếp Lịch

- **Khắc phục điểm mù hiện tại**: Ở bản Web hiện tại, tab `Lịch học kỳ` (`TermCalendar`) chỉ nhận prop `events={state?.published ?? []}` (`page.tsx:529`). Do đó khi Giáo vụ vừa chạy bộ giải xong (`state.draft`), tab `Lịch học kỳ` trống trơn!
- **Thiết kế mới**:
  1. Ngay trong màn hình **Xếp lịch & Công bố (`DraftSchedule`)** và **Thời khóa biểu toàn học kỳ (`TermCalendar`)**, thêm thanh chuyển đổi nguồn dữ liệu:
     - `🔘 Xem Bản Nháp Vừa Xếp (Draft - 290 lớp)` (Mặc định chọn ngay sau khi chạy Solver)
     - `⚪ Xem Bản Chính Thức Đã Công Bố (Published)`
  2. Cung cấp **3 Chế độ Hiển thị Đồng bộ** cho Giáo vụ kiểm tra sau khi xếp lịch:
     - **Chế độ 1 — Lưới TKB Cả Tuần (`Ma trận Thứ 2 -> Thứ 7 × 6 Ca chuẩn`)**: Nhìn tổng thể toàn bộ các môn học trong tuần nằm ở ca nào, phòng nào, màu sắc theo chương trình/loại buổi.
     - **Chế độ 2 — Lưới TKB Theo Phòng Học (`Phòng × Thứ 2 -> Thứ 7`)**: Kiểm tra độ lấp đầy của từng phòng học (`301-C`, `Lab 402`...) trong cả tuần.
     - **Chế độ 3 — Bảng Danh Sách Môn Học Đã Xếp (`Master Scheduled Course Table`)**: Hiển thị bảng đầy đủ các cột giống chuẩn QLDT (Ảnh 3):
       `Mã MH` | `Tên môn học` | `Nhóm/Lớp` | `Loại (LEC/TUT)` | `Số tiết` | `Thứ` | `Ca / Tiết BĐ` | `Khung giờ` | `Phòng học` | `Giảng viên` | `Sĩ số / Sức chứa` | `Trạng thái Hợp lệ`.

---

## 4. Quản Lý Bảng Mã Màu & Ghi Chú Cá Nhân (`Color Palette & Custom Notes`)

Để đáp ứng yêu cầu *"Bổ sung bảng màu cho trường, lec, tut... thêm màu các kiểu xong tự note theo sở thích"*, hệ thống bổ sung cấu hình `color_rules` trong `State.config` (lưu bền vững trong DB và xuất thẳng ra file Excel):

| Nhóm Phân Loại | Khóa Nhận Diện (`key`) | Màu Nền Mặc Định | Màu Chữ / Viền | Nhãn Mặc Định (Cho phép User sửa Note tùy ý) |
|---|---|---|---|---|
| **Chương trình** | `PROG_STD` (`61FIT`) | `#EFF6FF` | `#1D4ED8` | Đại trà CNTT (61FIT) |
| **Chương trình** | `PROG_MME` (`61MME`) | `#FFF7ED` | `#C2410C` | Truyền thông Đa phương tiện (61MME) |
| **Chương trình** | `PROG_CLC` (`62FIT`) | `#DBEAFE` | `#1E3A8A` | Chất lượng cao (62FIT - Học ghép Lec+Tut) |
| **Chương trình** | `PROG_TT` (`66FIT`) | `#D1FAE5` | `#047857` | **Tiên tiến (66FIT)** *(Tách riêng, không gộp vào Đại trà!)* |
| **Loại buổi học** | `KIND_LEC` | Badge `#E0E7FF` | `#3730A3` | Lý thuyết (`LEC`) |
| **Loại buổi học** | `KIND_TUT` | Badge `#FCE7F3` | `#9D174D` | Thực hành / Bài tập (`TUT`) |
| **Loại buổi học** | `KIND_COMBINED` | Badge `#FEF3C7` | `#92400E` | Lý thuyết + Thực hành (`4 tiết`) |
| **Trạng thái TKB** | `STATUS_EVENING` | `#F1F5F9` | `#334155` | Thời khóa biểu tối (Ca 6) |
| **Trạng thái TKB** | `STATUS_MAKEUP` | `#F3E8FF` | `#7E22CE` | Dạy bù (Theo chuẩn ảnh chụp QLDT) |
| **Trạng thái TKB** | `STATUS_CONFLICT` | `#FEF08A` / `#FEE2E2` | `#DC2626` | Trùng lịch / Cảnh báo di chuyển |
| **Trường ngoài & Đi học** | `EXT_<SCHOOL_ID>` | Tùy chọn Color Picker | Tùy chọn | Ví dụ: `ĐH Bưu chính (PTIT)` - `#CCFBF1`, `Đi học Tiến sĩ` - `#FDE68A` + **Ghi chú riêng (Private Note)** |

---

## 5. Chuẩn Hóa Toàn Bộ File Mẫu (Templates) Cho Mọi Chức Năng Import

Theo đúng nguyên tắc trong Note 1 & Note 2: **"Nếu yêu cầu import file thì bắt buộc phải có file mẫu (Template) kèm xem trước cấu trúc để người dùng biết có những cột gì và import chuẩn"**:

### 5.1. Danh sách 4 Bộ File Mẫu Chuẩn (`.xlsx` & `.csv`)

1. **Mẫu 1: Kế hoạch đào tạo (`plan-template.xlsx` / `ke_hoach_dao_tao_mau.xlsx`)**
   - **Các cột chuẩn**: `Mã học phần (course)` | `Tên học phần (name)` | `Chương trình (STD/MME/CLC/TT)` | `Bộ môn (department)` | `Khóa (cohort)` | `Tổng sĩ số (students)` | `Số lớp Lec chỉ định` | `Số tiết Lec (hỗ trợ 2.5)` | `Số tiết Tut (hỗ trợ 2.5)` | `Học ghép 4 tiết? (combined)` | `Yêu cầu phòng Lec` | `Yêu cầu phòng Tut`.
   - **Cải tiến UI**: Trên `PlanImportCard`, bên cạnh nút `📥 Tải File Excel Mẫu (.xlsx)`, hiển thị ngay bảng mẫu thu gọn (3 dòng ví dụ thực tế của `61FIT3JSD`, `62FIT3DBS`, `66FIT2RES`) để Giáo vụ nhìn thấy ngay cấu trúc trước khi tải.

2. **Mẫu 2: Lịch ngoài trường & Lịch đi học (`external-schedule-template.xlsx` / `.csv`)**
   - **Các cột chuẩn**: `Mã GV (teacher)` | `Loại lịch (DAY_NGOAI / DI_HOC / HOP_BAN)` | `Trường / Đơn vị (institution)` | `Mã môn / Hoạt động (course)` | `Nhóm / Lớp (class_name)` | `Thứ (2..8)` | `Giờ bắt đầu (07:00) hoặc Tiết BĐ` | `Giờ kết thúc (09:30) hoặc Số tiết` | `Phòng (room)` | `Mã màu (color_hex)` | `Ghi chú riêng (note)`.
   - **Tương thích**: Hỗ trợ đọc cả định dạng xuất từ QLDT PTIT (như Ảnh 2 của GV Ngô Văn Quyền: `Mã môn học`, `Tên môn học`, `Nhóm`, `Thứ`, `Ngày`, `Tiết bắt đầu`, `Số tiết`).

3. **Mẫu 3: Danh sách Nhân sự & Hồ sơ Năng lực (`personnel-capabilities-template.xlsx` / `.csv`)**
   - **Sheet 1 (`Nhan_Su`)**: `Mã GV (id)` | `Họ và tên (name)` | `Bộ môn (department)` | `Vai trò (GV / TRO_GIANG)` | `Đang hoạt động (active: x)` | `Tối đa ca/ngày` | `Tối đa ca/tuần` | `Bí danh (aliases)`.
   - **Sheet 2 (`Ho_So_Nang_Luc`)**: `Mã học phần` | `Tên học phần` | `Mã GV` | `Dạy Lý thuyết (day_lec: x)` | `Dạy Thực hành (day_tut: x)`.

4. **Mẫu 4: Danh mục Phòng học & Lịch chiếm dụng (`rooms-template.xlsx` / `.csv`)**
   - **Các cột chuẩn**: `Mã phòng (id)` | `Tên phòng (name)` | `Sức chứa (capacity)` | `Loại phòng (LECTURE / LAB / SEMINAR)` | `Thiết bị (PROJECTOR, COMPUTER, MIC)` | `Bộ môn ưu tiên` | `Khung giờ mở cửa (T2-T7: 07:10-21:00)` | `Ghi chú`.
