# Objective, metric và giao thức đánh giá

**Trạng thái:** Đặc tả thiết kế đề xuất để triển khai từ FR.03.1.1, FR.03.2.1 và FR.05.1.2; chưa có benchmark thực. Giữ trọng số từ mục 4.4 của [mô tả gốc](../../ScheduleSolver_MoTaDuAn.md); không sửa code, schema hoặc trọng số trong bước tài liệu này.

## 1. Ý nghĩa của “điểm tốt nhất”

Mỗi phương án x có bộ giá trị **F(x) = (H(x), S(x), C(x))**, so sánh từ điển và **càng nhỏ càng tốt**:

1. H: tổng vi phạm cứng, gồm phần nhu cầu còn thiếu.
2. S: tổng phạt mềm của các metric S1–S15 đang áp dụng, theo trọng số hiện có.
3. C: số trùng chéo môn theo tiêu chí Verify, chỉ phá hòa khi H và S bằng nhau.

Nếu cả ba bằng nhau, dùng biểu diễn phân công chuẩn hóa có thứ tự cố định để chọn nhất quán. Đề xuất phá hòa bằng C không thêm trọng số hay đặt C cao hơn S. Điều này làm rõ giới hạn của “nếu có thể”: lịch ít trùng chéo không được ưu tiên bằng cách làm tăng lỗi cứng hoặc tổng phạt S. Nếu sau này muốn đánh đổi S để giảm C thì cần duyệt chính sách mới, không tự thêm S16.

H=0 không tự chứng minh dữ liệu đủ: phải có đủ các điều kiện áp dụng đã được xác nhận. Điều kiện phòng/bảng giờ chưa có căn cứ được báo **chưa đủ dữ liệu**, không coi là đã kiểm tra đạt. Chỉ đánh giá tính hợp lệ trong phạm vi chính sách và dữ liệu phiên bản đó.

**Best-so-far** là nhỏ nhất trong các phương án đã kiểm tra, không phải nhỏ nhất toàn không gian. Không đảo dấu bộ so sánh chỉ vì người dùng gọi là “điểm cao nhất”; UI hiển thị rõ “phạt thấp hơn là tốt hơn”, H, S, C và độ phủ.

## 2. Đếm phần cứng

Đếm trên bản kế hoạch có mã buổi duy nhất, tuần hoạt động đã chuẩn hóa. Đây là quy ước đếm cần được oracle toàn phần và scoring tăng dần dùng giống nhau.

| Thành phần | Đơn vị đếm đề xuất |
|---|---|
| H1 — Trùng GV | Một đơn vị cho mỗi cặp buổi khác nhau, mỗi GV chung, mỗi tuần thực sự giao nhau; không nhân thêm theo số ca giao |
| H2 — Lec/Tut cùng môn và khóa | Một đơn vị cho mỗi cặp Lec/Tut vi phạm trong mỗi tuần; không cấm các tổ Tut song song chỉ vì cùng môn |
| H3 — Độ phủ/thời lượng | Một đơn vị cho mỗi buổi thiếu; mỗi phân công dư lặp sau bản đầu; mỗi phân công ngoài kế hoạch không được duyệt; mỗi buổi sai thời lượng/liền ca |
| H4 — Phòng | Khi có danh mục xác nhận: một đơn vị cho mỗi cặp buổi trùng phòng/tuần; mỗi buổi sai loại/sức chứa. Nếu chỉ biết tổng phòng theo loại, đếm số vượt khả năng từng ca/tuần thay vì cộng cả kiểm tra phòng cụ thể cho cùng chính sách |
| H5 — Bận cứng | Một đơn vị cho mỗi buổi–GV–tuần bị bận; gộp các khoảng bận trùng nhau để không tăng lỗi do khai trùng nguồn |
| H6 — Khóa thời gian | Một đơn vị cho mỗi buổi đã xếp khác thời gian được khóa |
| H7 — Thời gian hợp lệ | Một đơn vị cho mỗi buổi dùng ngày/ca/tuần không thuộc miền cho phép |
| H8 — GV hợp lệ | Một đơn vị cho mỗi phân công có GV ngoài tập được phép hoặc sai giới hạn loại Lec/Tut |
| H9 — Giới hạn phân công | Tổng số section thiếu/vượt min/max đã khai, trên mỗi cặp GV–môn; min=0 nếu không khai giới hạn dưới |
| H10 — Khóa GV | Một đơn vị cho mỗi section đã phân công khác GV được khóa; giữ phân công GV section đã công bố khi xếp lại theo chính sách mô tả gốc |
| H11 — Nhất quán GV | Một đơn vị cho mỗi GV phân công khác GV chính đã chọn của section qua các tuần; mô hình một GV/section hợp lệ làm số này bằng 0 |

Các lỗi có thể đồng thời vi phạm nhiều quy tắc độc lập và được nêu rõ; không được thay đổi quy ước đếm giữa hai thuật toán. Buổi chưa có phân công chỉ bị tính thiếu ở H3, không nhận các lỗi suy ra từ trường trống như “GV không hợp lệ”. Giới hạn min GV ở H9 vẫn được đánh giá trên trạng thái tải hiện có.

Quan hệ cấm trùng theo nhóm sinh viên được cung cấp tường minh là điều kiện cứng riêng trong chính sách mở rộng, không suy từ cùng khóa. Nếu bổ sung loại lỗi cứng, phiên bản chính sách/định nghĩa H phải thay đổi công khai.

## 3. Metric và trọng số mềm giữ nguyên

Với GV t, ngày d, tuần hoạt động w: k là số ca FIT khác nhau đã dạy, lo/hi là ca đầu/cuối. Buổi bốn tiết chiếm hai ca; nhiều phân công cùng ca chỉ chiếm một ca cho metric gọn lịch nhưng vẫn bị kiểm tra H1. Ngày không dạy có ca trống/ngày một ca đều bằng 0.

| Mã | Đại lượng gốc | Trọng số giữ nguyên |
|---|---|---|
| S1 | Tổng ca trống kẹp giữa: hi−lo+1−k trên GV/ngày/tuần | 10 |
| S2 | Số GV/ngày/tuần chỉ có một ca | 15 |
| S3 | Số GV/ngày/tuần có ít nhất một ca | 5 |
| S4 | Tổng ca vượt maxSlotsPerDay trên GV/ngày/tuần | 20 |
| S5 | Vi phạm ưu tiên đã khai báo; mỗi ưu tiên có mức phạt rõ | 1–10 theo khai báo |
| S6 | Số buổi lệch ngày/ca gợi ý trong chế độ giữ gợi ý | 2 |
| S7 | Số cặp Lec/Tut CLC không liền nhau cùng ngày theo quan hệ nhóm đã xác nhận | 4 |
| S8 | Số quan hệ Tutorial trước Lecture trong thứ tự tuần | 2 |
| S9 | Số buổi đổi vị trí so bản công bố trong chế độ xếp lại | 8 |
| S10 | Tổng độ lệch tuyệt đối giữa số section GV nhận và target của GV trong từng môn | 6 |
| S11 | Số quan hệ GV Lecture không nhận Tutorial nào của lớp liên quan | 2 |
| S12 | Tổng max(0, số môn GV phụ trách − 1), GV không nhận môn có giá trị 0 | 3 |
| S13 | Số section giao cho GV phụ khi có nhãn chính/phụ | 2 |
| S14 | Số nhóm CLC có GV Lec/Tut khác nhau | 0 — tắt |
| S15 | Số lần đổi tòa giữa hai ca liền | 0 — tắt |

**S(x)** là tổng các đại lượng áp dụng nhân trọng số trong bảng, với S5 cộng đúng phạt ưu tiên từng mục một lần. Không nhân trọng số S5 hai lần. S1–S4 tính trên từng tuần, không gộp các buổi ở hai tuần rời rạc thành một ngày giả. S6–S13 đếm theo buổi/section/quan hệ như bảng, không tự nhân số tuần học. Cách tổng hợp này phải được ghi trong phiên bản metric khi đo baseline.

**S10:** tải tính bằng số section, không phải tổng giờ hoặc số ca; nếu báo thêm giờ/ca phải ghi đó là metric bổ sung. Target được lưu theo từng GV–môn; trường hợp mọi GV cùng điều kiện và không có ưu tiên/giới hạn khác nhau có thể đề xuất chia đều N/k, còn trường hợp khác phải xác nhận target trước khi chạy objective có S10. Không tự tắt S10 để dồn tải vào ít GV.

Metric phụ thuộc dữ liệu như S5–S8, S11, S13 phải có trạng thái **áp dụng / không áp dụng / chưa đủ dữ liệu**. Không áp dụng khác với chưa biết. S9 không áp dụng cho lần xếp đầu; S14/S15 giữ tắt. Nếu dữ liệu cần thiết của metric bắt buộc còn thiếu, phải hoàn thiện/xác nhận bộ input, không âm thầm báo phạt bằng 0 và so như đầy đủ.

## 4. Trùng chéo môn và Verify

C đếm cặp buổi khác môn cùng khóa, trong mỗi tuần có giao giờ, theo loại cặp của tiêu chí Verify đã đối soát (không tự mở rộng sang mọi cặp Tutorial). Mỗi cặp/tuần đếm một lần. Chưa biết nhóm sinh viên dùng chung thì là cảnh báo/mục tiêu phá hòa, không H.

Verify cần hiển thị riêng: trùng GV, trùng Lecture/Tutorial cùng môn, trùng chéo môn cùng khóa và độ phủ kế hoạch. Verify không thay thế H4–H11 hoặc metric độ gọn. Giáo vụ vẫn xem xét cảnh báo dù phương án có H=0.

## 5. Bộ số liệu báo cáo tối thiểu

- Số buổi bắt buộc, buổi được xếp đúng một lần và độ phủ = số buổi được xếp đúng một lần / số buổi bắt buộc; kế hoạch rỗng báo không áp dụng thay vì chia 0. Độ phủ không chứng minh không có lỗi khác.
- H và từng loại lỗi; trạng thái dữ liệu; S và từng đại lượng/phạt; C và các cảnh báo Verify.
- Tổng ca trống, ngày một ca, ngày đi dạy và quá tải trong tập tuần; báo thêm trung bình trên tuần có định nghĩa mẫu số rõ. Giờ bận trường ngoài không tự coi là ca FIT để tính S1–S4.
- Tải section theo GV/môn, độ lệch target S10; tải giờ nếu có là chỉ số phụ khác đơn vị.
- Số buổi đổi giờ theo S9; số section đổi GV báo riêng, không nhập vào S9. Khóa GV section cũ có thể làm số đổi GV bằng 0.
- Thời gian, số worker, seed, số bước đánh giá, thời điểm đạt H=0, lý do dừng và best-so-far theo quá trình.

Không so soft score của lịch còn thiếu với lịch đầy đủ để tuyên bố lịch thiếu “tối ưu hơn”. Đối chiếu độ phủ/H trước, rồi mới so chất lượng trên cùng nhu cầu và chính sách.

## 6. Tái lập và concurrency

Hai chế độ được phân biệt:

| Chế độ | Ngân sách | Cam kết |
|---|---|---|
| Tái lập | Số bước/epoch xác định; số worker, seed riêng, quy tắc chia sẻ và phá hòa được lưu | Cùng input, cấu hình, phiên bản cho cùng phân công chuẩn hóa và điểm |
| Theo thời gian thực | Hạn wall-clock, có thể dừng bởi người dùng | Giữ kết quả tốt nhất đã có; cùng seed không đủ hứa output giống nhau |

Thiết kế đề xuất cho tái lập: khởi tạo thứ tự dữ liệu ổn định; seed từng worker suy ra xác định; chia sẻ ở ranh giới epoch theo thứ tự worker đã định; mỗi epoch có ngân sách công cố định; so sánh phương án bằng F và phá hòa chuẩn hóa. Đây là hướng xây dựng, không phải giả định rằng AtomicReference hay seed tự giải quyết tính xác định.

Định danh input bao gồm nội dung chuẩn hóa, tập tuần/lịch theo khóa, các khoảng bận và chính sách; không bao gồm thứ tự dòng vô nghĩa. Lưu nội dung cần để chạy lại, không chỉ hash. Metadata có phiên bản thuật toán và môi trường. Lần dừng thủ công giữa epoch phải ghi chưa hoàn thành ngân sách tái lập, không đem so như chạy đủ.

## 7. Thực nghiệm và các điểm chưa khẳng định

Chạy ít nhất 10 seed trên kế hoạch hiện có đã đối soát; thử 1/2/4 worker nếu máy cho phép. Ghi cả ngân sách wall-clock lẫn tổng công tìm kiếm: nhiều worker trong cùng thời gian có thể làm nhiều công hơn, không được nhầm cải thiện chất lượng với speedup thuần.

Baseline lịch thủ công phải được đo bởi cùng oracle, cùng nhu cầu, tuần và giờ bận. Nếu input giả lập làm baseline vi phạm, nêu rõ và tách thực nghiệm, không so lệch điều kiện. Có kịch bản thông thường, nhiều GV bận thứ Hai và input mới đã biết khả thi. Báo tỷ lệ có lịch hợp lệ, trung bình/độ lệch chuẩn thời gian/điểm cùng kết quả từng seed.

Các quy ước đếm chi tiết và phá hòa ở tài liệu này là thiết kế Draft để review, không phải thay đổi mặc định trong code. Cần đối soát bảng giờ, danh mục phòng, alias/nhóm và target S10 trước khi tạo dataset nghiệm thu chính thức. Không có số đo chứng minh đạt 60 giây hoặc tối ưu toàn cục ở bước tài liệu này.
