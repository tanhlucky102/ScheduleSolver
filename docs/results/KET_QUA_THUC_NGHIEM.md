# Kết quả thực nghiệm

Mọi số liệu dưới đây là **số đo thật**, ghi trong các file CSV cùng thư mục, chạy ngày 28/10/2026 trên đúng phiên bản code hiện tại (sau khi thêm đăng nhập và sắp xếp A–Z), bằng lệnh:

```text
java -cp target/schedulesolver.jar vn.edu.fit.schedulesolver.experiment.BenchmarkRunner 10 5
```

Mỗi lần chạy 10 giây, 5 seed (1..5). Trước khi đo, JVM chạy khởi động 5 giây để JIT biên dịch xong. Trong lúc đo không chạy chương trình nặng nào khác.

**Máy:** AMD Ryzen 7 7435HS (8 nhân / 16 luồng), RAM 31,7 GB, Windows 11 chế độ nguồn Balanced; JDK 24.0.1, JVM được cấp tối đa 8 GB.

**Dữ liệu:** `resources/FIT Time table Fall2026 V5.2.xlsx`:
- Kế hoạch mở lớp: 290 dòng, thành **236 buổi**.
- TKB lập tay: 246 ô, nhận ra giảng viên ở **186 buổi**.
- **34 giảng viên**; quy ước phân công trong `resources/quy_uoc_phan_cong.csv` có 104 dòng.

## E1. TKB lập tay của khoa so với bộ giải (`e1_baseline.csv`)

Hai bên dùng cùng 186 buổi lấy từ TKB lập tay, cùng hàm đo `TimetableMetrics`, không có lịch bận. Bộ giải chạy chế độ kết hợp với 4 luồng (SA, Tabu, Leo đồi, SA). Có hai biến thể:
- **Giữ GV:** mỗi buổi chỉ được dạy bởi đúng GV trên TKB cũ; bộ giải chỉ đổi giờ.
- **Đổi cả GV:** được đổi GV trong phạm vi quy ước phân công.

| Phương án | Cứng | Mềm | S1 ca trống | S2 ngày 1 ca | S3 ngày lên trường | S4 vượt ca/ngày | S5 vượt ca/tuần | Ca/tuần nhiều nhất của 1 GV | S6 Lec trùng môn khác | Buổi cùng lúc nhiều nhất |
|---|---|---|---|---|---|---|---|---|---|---|
| TKB lập tay | **1** | 1778 | 28 | 37 | 111 | 3 | 8 | 18 | 14 | 11 |
| Chỉ tham lam | 0 | 1099 | 8 | 6 | 63 | 22 | 9 | 16 | 6 | 28 |
| Giữ GV – chỉ đổi giờ (n=5) | 0 | 425,0 ± 2,7 | 0 | 1 | 72,4 ± 0,5 | 0 | 8 | 18 | 0 | 17,0 ± 2,7 |
| Đổi cả GV theo quy ước (n=5) | 0 | **387,0 ± 2,7** | 0 | 1 | **69,6 ± 0,5** | 0 | 4 | 16 | 0 | 18,6 ± 2,3 |

(± là độ lệch chuẩn qua 5 seed.)

**Nhận xét:**

- **TKB lập tay có 1 vi phạm cứng thật:** lớp CLC01 K25 học `62FIT2RES` cùng giờ `62FIT2PR1` sáng Thứ 7. Bộ giải không còn vi phạm cứng nào.
- **Chỉ đổi giờ, giữ nguyên phân công của khoa:**
  - Ca trống: 28 → 0.
  - Ngày chỉ dạy 1 ca: 37 → 1.
  - Tổng ngày lên trường: 111 → 72,4 (giảm khoảng 35%).
  - Lec trùng môn khác cùng khóa (Verify 3): 14 → 0.
- **Cho đổi cả GV trong quy ước:** số ngày lên trường giảm thêm, còn 69,6 (giảm khoảng 37%); số ca vượt giới hạn tuần giảm từ 8 xuống 4.
- **Chỉ dùng tham lam:** ít ngày (63) nhưng dồn quá nặng một số ngày (22 ca vượt tối đa/ngày, 28 buổi cùng lúc). Vì thế cần bước tìm kiếm cục bộ phía sau.
- **Đánh đổi:** số buổi diễn ra cùng lúc nhiều nhất tăng từ 11 lên khoảng 17–19, tức cần nhiều phòng hơn vào giờ cao điểm. Chương trình chưa xếp phòng nên điểm này được ghi vào phần Hạn chế.

## E2. Tuần tự so với song song (`e2_threads.csv`)

Thiết lập:
- Kế hoạch 236 buổi, có lịch bận **giả lập** (seed 2026, khoảng 30% giảng viên).
- Mọi luồng chạy Simulated Annealing, luồng thứ i dùng seed `seed + i`.
- Lời giải tham lam ban đầu: cứng 0, mềm 1487.

| Số luồng | Mềm cuối (TB ± ĐLC) | Mềm tốt nhất | Vòng lặp/giây (TB) | Tăng thông lượng so với 1 luồng |
|---|---|---|---|---|
| 1 (tuần tự) | 527,0 ± 2,7 | 524 | 206 033 | 1,00× |
| 2 | 528,0 ± 4,2 | 524 | 294 828 | 1,43× |
| 4 | 524,0 ± 3,5 | 519 | 574 927 | 2,79× |
| 8 | **519,0 ± 0,0** | **519** | 1 110 017 | 5,39× |

**Nhận xét:**

- **Thông lượng tăng theo số luồng** (5,39× với 8 luồng) nhờ các luồng không phải chờ nhau:
  - `Problem` chỉ đọc.
  - Mỗi luồng giữ một `Solution` riêng.
  - Chỉ khóa `BestSolutionHolder` khi tìm được lời giải tốt hơn.
- Tăng tốc chưa tuyến tính. Khi nhiều nhân cùng chạy, laptop hạ xung nhịp. Một lần đo trước đó trên cùng máy (trước khi đổi thứ tự sắp xếp GV) đạt 7,72× với 8 luồng. Vì vậy chỉ nên so sánh các số trong cùng một bảng.
- **Chất lượng cải thiện ổn định khi tăng luồng:** 8 luồng cho mềm 519 ở cả 5 seed (độ lệch chuẩn 0), trong khi 1 luồng là 527 ± 2,7. Nhiều luồng chạy độc lập giúp kết quả ít phụ thuộc may rủi của một seed. Mức cải thiện nhỏ vì trong 10 giây mọi cấu hình đều đã đạt cứng = 0 và hội tụ quanh 515–530.

## E3. So sánh thuật toán (`e3_algorithms.csv`)

Cùng dữ liệu như E2, mỗi thuật toán chạy 4 luồng trong 10 giây.

| Thuật toán | Mềm cuối từng seed | TB ± ĐLC | Tốt nhất | Vòng lặp/giây (4 luồng) |
|---|---|---|---|---|
| Local Search (leo đồi) | 519, 519, 519, 519, 514 | **518,0 ± 2,2** | 514 | 574 908 |
| Simulated Annealing | 529, 524, 524, 524, 519 | 524,0 ± 3,5 | 519 | 577 760 |
| Tabu Search | 539, 514, 514, 514, 514 | 519,0 ± 11,2 | 514 | 11 469 (mỗi vòng thử 50 bước, khoảng 0,57 triệu bước được đánh giá/giây) |
| Kết hợp cả 3 | 529, 519, 519, 514, 519 | 520,0 ± 5,5 | 514 | 435 183 |

**Nhận xét:**

- Ba thuật toán cho kết quả **sát nhau**: chênh lệch trung bình chỉ 6 điểm mềm, trong khoảng nhiễu giữa các seed. Lần đo trước, SA đứng đầu với 516; lần này leo đồi đứng đầu với 518. Kết luận đúng là: với bài toán cỡ này và 10 giây, cả ba đều hội tụ về khoảng 514–529, chưa thuật toán nào hơn hẳn.
- Tabu Search đạt mức tốt nhất 514 ở 4/5 seed nhưng có 1 seed kém (539). Mỗi vòng thử 50 bước nên số vòng ít, kết quả phụ thuộc điểm xuất phát.
- Chế độ kết hợp không phải lúc nào cũng thắng, nhưng tránh được việc chọn "nhầm" thuật toán cho một seed xấu. Đây là lý do giao diện để chế độ này làm mặc định.
- Thông lượng ở bảng này tính trên 4 luồng. Chỉ so sánh trong cùng bảng, vì tốc độ CPU dao động giữa các lần chạy.

## E4. Tính điểm cục bộ (delta) so với chấm lại toàn bộ (`e4_delta.csv`)

Kế hoạch 236 buổi, thử bước đổi giờ ngẫu nhiên trong 3 giây cho mỗi cách tính.

| Cách tính | Bước/giây |
|---|---|
| Cục bộ (delta), `ScoreCalculator.localCost` | 278 021 |
| Chấm lại toàn bộ, `ScoreCalculator.calculate` | 7 442 |

**Nhận xét:**

- Tính cục bộ nhanh hơn khoảng **37 lần**. Lần đo trước được khoảng 33 lần (485 715 so với 14 550). Tỉ lệ ổn định dù tốc độ tuyệt đối của máy thay đổi.
- Tính đúng được bảo đảm bằng test `LocalSearchTest.deltaScoreAlwaysMatchesFullRecalculation` (10.000 bước).

## Ảnh màn hình

Thư mục `screenshots/` có ảnh: màn hình đăng nhập, Trưởng khoa (danh sách GV, quy ước phân công), Giáo vụ (lưới TKB lọc Đại trà K24), Giảng viên NgaNT (với lịch bận giả định "ĐH Thủy lợi").

Ảnh được chụp sau khi chạy luồng: nhập kế hoạch 236 buổi → xếp lịch 4 luồng trong 4 giây (cứng 0, mềm 514) → công bố.
