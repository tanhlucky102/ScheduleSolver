# Giải thuật, metrics và mô hình đa luồng

Tài liệu giải thích cách bộ giải chấm điểm và tìm thời khóa biểu, cùng cách chạy song song, để mọi thành viên trả lời được khi vấn đáp. Số liệu thực nghiệm nằm ở [results/KET_QUA_THUC_NGHIEM.md](results/KET_QUA_THUC_NGHIEM.md).

## 1. Bài toán

- **Đầu vào:**
  - Các buổi học cần xếp (từ kế hoạch mở lớp).
  - Với mỗi buổi, danh sách GV được phép dạy (từ quy ước phân công).
  - Lịch bận cố định của GV.
  - Các buổi đã được giáo vụ cố định.
- **Biến quyết định:** với mỗi buổi i, chọn **giảng viên**, **ngày** (Thứ 2..7) và **ca bắt đầu** (ca 1..6). Buổi 2 ca chỉ bắt đầu ở ca 1, 3, 5.
- **Lời giải** (`solver/Solution`) gồm 3 mảng `int`: `teacher[i]`, `day[i]`, `slot[i]`.
- **Đầu ra:** một TKB tuần, lặp lại cả học kỳ.

## 2. Metrics và hàm điểm (`solver/ScoreCalculator`)

Điểm = (điểm cứng, điểm mềm). **Càng nhỏ càng tốt; luôn so điểm cứng trước.** Để thuật toán so sánh nhanh, hai điểm được gộp thành một số: `cost = cứng × 1.000.000 + mềm`.

### 2.1 Ràng buộc cứng: phải bằng 0 mới được công bố

| Mã | Ý nghĩa | Nguồn |
|---|---|---|
| H1 | Một GV dạy 2 buổi trùng giờ | Verify 1 của khoa |
| H2 | Lec trùng giờ Tut của chính môn đó (cùng khóa, cùng lớp Lec A/B) | Verify 2 |
| H2 | Hai buổi của cùng một lớp CLC (ví dụ CLC01 K24) trùng giờ | Quy ước CLC |
| H3 | Buổi dạy trùng lịch bận cố định của GV dạy buổi đó | Yêu cầu GV |

Verify 4 ("đủ giờ Lec/Tut") luôn đạt vì bộ giải đặt mọi buổi. Khi giáo vụ sửa tay, `Verifier` kiểm tra thêm buổi bị thiếu và GV ngoài quy ước.

### 2.2 Ràng buộc mềm: độ gọn lịch giảng viên

Tính cho **từng GV, từng ngày** bằng dãy 6 bit (bit k = 1 nghĩa là dạy ca k). Ví dụ `001011` là dạy ca 1, 2 và 4, nên có 3 ca dạy và 1 ca trống.

| Mã | Đại lượng | Trọng số | Vì sao |
|---|---|---|---|
| S1 | Số ca trống kẹp giữa hai ca dạy | 10 | GV phải chờ ở trường |
| S2 | Số ngày chỉ dạy đúng 1 ca | 15 | Lên trường chỉ để dạy 1 ca |
| S3 | Số ngày phải lên trường | 5 | Càng ít ngày càng tiện |
| S4 | Số ca vượt "tối đa ca/ngày" của GV | 20 | Tránh dồn quá nặng một ngày |
| S5 | Số ca vượt "tối đa ca/tuần" của GV | 6 | Cân bằng tải giữa các GV |
| S6 | Lec trùng giờ Lec/Tut **môn khác** cùng khóa, cùng chương trình | 20 | Verify 3: cố gắng tránh, không cấm hẳn |

S1–S3 giữ trọng số của bản mô tả gốc. S4 và S5 giới hạn tải để thuật toán không dồn hết buổi cho ít GV; nếu không có chúng, cách đó sẽ làm giảm S3.

Hàm `DayMask.countGaps(mask)` tìm ca đầu và ca cuối có bit 1, rồi lấy `(cuối − đầu + 1) − số ca dạy`. Vì chỉ duyệt 6 bit nên chạy rất nhanh.

### 2.3 Tính điểm cục bộ (delta)

Một bước di chuyển chỉ làm thay đổi 1–2 buổi và 1–4 giảng viên. `ScoreCalculator.localCost()` chỉ tính phần điểm liên quan tới các buổi và GV đó:

1. Tính phần điểm đó trước khi di chuyển.
2. Thực hiện bước di chuyển.
3. Tính lại phần điểm đó.
4. Lấy hiệu (sau − trước), chính là thay đổi của tổng điểm.

Test `LocalSearchTest.deltaScoreAlwaysMatchesFullRecalculation` chạy 10.000 bước ngẫu nhiên và xác nhận điểm cộng dồn bằng delta luôn bằng điểm chấm lại toàn bộ. Thực nghiệm E4 đo được cách này nhanh hơn khoảng **37 lần**.

### 2.4 Metrics báo cáo (`solver/TimetableMetrics`)

Ngoài điểm, báo cáo "Đánh giá" có:

- Số vi phạm theo từng tiêu chí Verify.
- Tổng ca trống, số ngày chỉ dạy 1 ca, tổng số ngày lên trường.
- Số ca vượt giới hạn ngày/tuần, số ca nhiều nhất của 1 GV.
- **Số buổi diễn ra cùng lúc nhiều nhất trong một ca**, dùng để ước lượng số phòng cần, vì chương trình chưa xếp phòng.

Cùng một lớp metrics được dùng để đo TKB lập tay của khoa và TKB của bộ giải, nên hai kết quả so sánh được.

## 3. Giải thuật

### 3.1 Lời giải ban đầu: tham lam (`GreedyBuilder`)

1. Đặt các buổi giáo vụ đã cố định.
2. Sắp xếp các buổi còn lại theo thứ tự khó xếp trước: buổi 2 ca → ít GV được phép → đông SV.
3. Lần lượt thử mọi (GV, ngày, ca) cho từng buổi và chọn chỗ làm điểm tăng ít nhất.

### 3.2 Các bước di chuyển (interface `Move`, mỗi bước có `apply` và `undo`)

| Lớp | Tỉ lệ | Việc làm |
|---|---|---|
| `ChangeTimeMove` | ~50% | Chuyển 1 buổi sang ngày/ca khác |
| `SwapTimeMove` | ~30% | Hoán đổi giờ 2 buổi cùng số ca |
| `ChangeTeacherMove` | ~20% | Đổi sang GV khác trong quy ước |

Buổi đã cố định không bao giờ bị di chuyển.

### 3.3 Ba thuật toán thầy đề xuất (lớp cha `LocalSearch`, mẫu Template Method)

`LocalSearch.step()` là vòng lặp chung:

1. Gọi `doStep()` của lớp con.
2. Tăng số vòng lặp.
3. Nếu điểm hiện tại tốt hơn điểm tốt nhất thì lưu bản sao.

Mỗi lớp con chỉ khác nhau ở cách **chấp nhận** bước đi (đa hình):

| Lớp | Cách chấp nhận | Tham số |
|---|---|---|
| `HillClimbing` (Local Search) | Chỉ nhận bước không làm điểm tệ hơn (delta ≤ 0) | — |
| `SimulatedAnnealing` | Nhận bước tốt hơn; nhận bước tệ hơn với xác suất `exp(−delta / T)`. T giảm dần (T ← T × 0,99999); khi T < 0,2 thì "hâm nóng" lại T = 10 | T₀ = 10 |
| `TabuSearch` | Mỗi vòng thử 50 bước ngẫu nhiên, chọn bước có delta nhỏ nhất kể cả khi tệ hơn. Buổi vừa di chuyển bị cấm (tabu) trong 10 vòng, trừ khi bước đó cho điểm tốt nhất từ trước tới nay (aspiration) | 50 ứng viên, tenure 10 |

Các tham số được chọn bằng cách chạy thử 8 giây với vài bộ giá trị trên kế hoạch thật. Tabu với 20 ứng viên/vòng cho kết quả kém (mềm khoảng 690), với 50 ứng viên đạt khoảng 530.

## 4. Mô hình đa luồng (Topic 4)

### 4.1 Vì sao cần đa luồng

1. **Giao diện không bị treo:** xếp lịch chạy 10–60 giây và đọc/ghi Excel mất 1–3 giây. Nếu làm trên luồng giao diện (EDT) thì cửa sổ đứng hình và không bấm được nút Dừng.
2. **Tìm được nhiều hơn trong cùng thời gian:** local search phụ thuộc điểm xuất phát và yếu tố ngẫu nhiên. N luồng chạy độc lập với seed khác nhau thực hiện được khoảng N lần số vòng lặp trên máy nhiều nhân (đo ở E2) và chọn kết quả tốt nhất.

### 4.2 Mỗi luồng làm gì

| Luồng | Việc | Cơ chế |
|---|---|---|
| Luồng giao diện (EDT) | Vẽ màn hình, nhận sự kiện bấm nút | `SwingUtilities.invokeLater` để đưa kết quả về |
| `solver-coordinator` | Gọi `ParallelSolver.solve()`: tạo lời giải tham lam, tạo thread pool, chờ các luồng xong, chọn kết quả | `new Thread(...)` |
| `pool-x-thread-y` (N luồng) | Mỗi luồng chạy 1 `SolverWorker` (Runnable) với một thuật toán và seed riêng | `Executors.newFixedThreadPool(N)`, `execute`, `shutdown`, `awaitTermination` |
| `background-io` | Đọc/ghi Excel | `new Thread(...)` + `invokeLater` (`MainFrame.runInBackground`) |
| `javax.swing.Timer` | Mỗi 0,3 giây đọc điểm tốt nhất để hiển thị tiến độ | Chạy trên EDT |

### 4.3 Tài nguyên dùng chung và cách đồng bộ

| Tài nguyên | Ai đọc/ghi | Nguy cơ race condition | Cách xử lý |
|---|---|---|---|
| `Problem` (dữ liệu đầu vào) | Mọi luồng giải chỉ đọc | Không có vì không ai ghi | Tạo xong là không đổi, không cần khóa |
| `Solution` đang tối ưu | Mỗi luồng một bản riêng | Hai luồng sửa chung một mảng | **Thread confinement:** mỗi `LocalSearch` làm trên `initial.copy()` |
| `Random` | Mỗi luồng một đối tượng | Tranh chấp, mất tính tái lập | `new Random(seed + i)` cho từng luồng |
| `BestSolutionHolder` | Các luồng giải ghi, EDT đọc | Luồng A và B cùng thấy mình tốt hơn rồi ghi đè nhau, mất lời giải tốt | Mọi phương thức `synchronized`; lưu bản sao của lời giải |
| Cờ dừng `stopRequested` | EDT ghi, luồng giải đọc | Luồng giải không thấy giá trị mới (cache CPU) nên chạy mãi | `volatile` |
| Số vòng lặp của mỗi luồng | Luồng giải ghi, EDT đọc | Đọc giá trị cũ | `volatile long iterations` (chỉ 1 luồng ghi) |
| Kết quả riêng của mỗi luồng | Luồng giải ghi khi xong, luồng điều phối đọc | Đọc khi chưa ghi xong | `synchronized saveResult()` / `getResultCost()` |
| `Workspace` | Chỉ EDT | Luồng nền đọc trong lúc người dùng sửa | Luồng nền chỉ nhận **bản sao** dữ liệu (xem `DeanPanel.suggestFromOldTimetable`, `StaffPanel.exportExcel`) |

Test liên quan:

- `ParallelSolverTest.bestSolutionHolderKeepsMinimumUnderConcurrentOffers`: 8 luồng × 1000 lần gửi, kết quả luôn là giá trị nhỏ nhất.
- `workersRunOnDifferentThreadsAndBestIsTheMinimum`: 4 worker chạy trên 4 thread khác nhau.
- `stopRequestEndsAllWorkersQuickly`: bấm dừng thì mọi luồng kết thúc trong vài giây.

### 4.4 Tuần tự và song song khác nhau thế nào

- **Tuần tự:** chọn số luồng = 1. Vẫn cùng code, chỉ có 1 worker.
- **Song song:** N worker chạy cùng lúc. Kết quả là lời giải có điểm nhỏ nhất trong N worker. Khi hòa điểm, chọn worker có số thứ tự nhỏ hơn, để kết quả không phụ thuộc luồng nào chạy xong trước.
- **Không phụ thuộc thứ tự dòng trong file:** danh sách GV được phép của mỗi buổi luôn xếp A–Z (`Convention.candidatesFor`), nên sửa hay sắp xếp lại file quy ước không làm đổi kết quả.
- **Tái lập được:** khi chạy theo **số vòng lặp** cố định (không theo đồng hồ), mỗi worker chỉ dùng dữ liệu riêng và seed riêng nên cùng cấu hình luôn cho cùng kết quả, kể cả 4 luồng (test `sameSeedAndIterationBudgetGiveSameResult`). Khi chạy theo **thời gian**, số vòng lặp phụ thuộc tốc độ máy nên kết quả có thể khác nhau chút ít; điều này được ghi rõ, không hứa giống hệt.

## 5. Giới hạn

- Chưa xếp phòng. Số buổi cùng lúc nhiều nhất được báo để ước lượng số phòng cần.
- Ràng buộc phía sinh viên chỉ gồm các tiêu chí Verify của khoa và lớp CLC cố định. Môn tự chọn thì sinh viên tự tránh.
- Không bảo đảm tối ưu toàn cục; kết quả là lời giải tốt nhất tìm được trong thời gian cho phép.
