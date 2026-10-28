# Kiểm tra truy vết Problem-Based SRS

**Trạng thái:** Đã kiểm tra Zigzag sau bước 3 và thực hiện rà soát toàn chuỗi sau bước 5. Bộ yêu cầu là Draft; kiểm tra truy vết không phải nghiệm thu phần mềm.

## ZAG — CP → CN

| CP | CN liên quan | Độ phủ của từng CN | Nhận xét tổng hợp |
|---|---|---|---|
| CP.01 | CN.01.1, CN.01.2 | P, P | Đủ phương án và thông tin phần chưa đáp ứng; không hứa giải được input bất khả thi |
| CP.02 | CN.02.1, CN.02.2, CN.02.3 | P, P, P | Đủ căn cứ đánh giá, quyền xử lý và tài liệu bàn giao |
| CP.03 | CN.03.1, CN.03.2 | P, P | Đủ thông tin chất lượng và mục tiêu cải thiện; giữ metric hiện có |
| CP.04 | CN.04.1, CN.04.2 | P, P | Đủ lịch cá nhân chi tiết và giới hạn thông tin quản lý |
| CP.05 | CN.05.1, CN.05.2 | P, P | Đủ căn cứ tái lập và xử lý input mới ở mức nhu cầu |
| CP.06 | CN.06.1, CN.06.2 | P, P | Đủ nhận biết vấn đề dữ liệu và tạo bản kế hoạch đối soát |

**P:** một CN giải quyết một phần của CP; tổ hợp các CN trong dòng phủ các khía cạnh CP đã mô tả. Đây là độ phủ đặc tả nhu cầu, không phải bằng chứng sản phẩm đã giải quyết vấn đề.

## ZIG — CN → CP

| CN | CP cha tồn tại | ID đúng cấu trúc | Lớp kết quả |
|---|---|---|---|
| CN.01.1 | CP.01 | Có | Construction |
| CN.01.2 | CP.01 | Có | Information |
| CN.02.1 | CP.02 | Có | Information |
| CN.02.2 | CP.02 | Có | Control |
| CN.02.3 | CP.02 | Có | Construction |
| CN.03.1 | CP.03 | Có | Information |
| CN.03.2 | CP.03 | Có | Construction |
| CN.04.1 | CP.04 | Có | Information |
| CN.04.2 | CP.04 | Có | Control |
| CN.05.1 | CP.05 | Có | Information |
| CN.05.2 | CP.05 | Có | Construction |
| CN.06.1 | CP.06 | Có | Information |
| CN.06.2 | CP.06 | Có | Construction |

## Khoảng trống, trùng lặp và hành động

- **CP không có CN:** 0. **CN không có CP:** 0. **CN sai ID cha:** 0.
- **CN chưa có FR:** 0; 20 FR đã phủ 13 CN, mỗi FR có một CN cha chính.
- **Phân biệt CN gần nhau:** CN.01.1 là phương án đáp ứng kế hoạch; CN.03.2 là phương án được cải thiện theo objective. CN.02.1 là kết quả Verify; CN.03.1 là chất lượng; CN.02.3 là sản phẩm Excel tổng hợp cùng phiên bản.
- **Các điểm phải giải quyết khi lập FR/NFR:** điều kiện công bố; hợp đồng dữ liệu/mẫu xuất; phòng và bảng giờ đã xác nhận; định nghĩa objective và metric; chế độ tái lập chạy song song; các trường và lịch lặp của dữ liệu lịch ngoài nhập tay. Đã chốt demo chọn vai trò, không đăng nhập và không bắt buộc ICS/Excel cho lịch ngoài.
- **Kết luận bước 3:** đạt kiểm tra CP ↔ CN về cấu trúc và nội dung trong ranh giới Software Glance; kết quả sau bước 5 được ghi dưới đây. Không có căn cứ kết luận phần mềm đã đáp ứng yêu cầu.

## Toàn chuỗi CP → CN → FR sau bước 5

| CP | CN | FR | Độ phủ nhu cầu |
|---|---|---|---|
| CP.01 | CN.01.1 | [FR.01.1.1](functional-requirements/FR.01.1.1-tao-phuong-an.md) | Có — nội dung Draft |
| CP.01 | CN.01.2 | [FR.01.2.1](functional-requirements/FR.01.2.1-ket-qua-chua-day-du.md) | Có — nội dung Draft |
| CP.02 | CN.02.1 | [FR.02.1.1](functional-requirements/FR.02.1.1-bao-cao-verify.md) | Có — nội dung Draft |
| CP.02 | CN.02.2 | [FR.02.2.1](functional-requirements/FR.02.2.1-sua-va-khoa.md), [FR.02.2.2](functional-requirements/FR.02.2.2-cong-bo-phien-ban.md) | Có — nội dung Draft |
| CP.02 | CN.02.3 | [FR.02.3.1](functional-requirements/FR.02.3.1-xuat-excel.md) | Có — nội dung Draft |
| CP.03 | CN.03.1 | [FR.03.1.1](functional-requirements/FR.03.1.1-metric-chat-luong.md) | Có — nội dung Draft |
| CP.03 | CN.03.2 | [FR.03.2.1](functional-requirements/FR.03.2.1-objective.md), [FR.03.2.2](functional-requirements/FR.03.2.2-tim-kiem-song-song.md) | Có — nội dung Draft |
| CP.04 | CN.04.1 | [FR.04.1.1](functional-requirements/FR.04.1.1-nhap-lich-truong-khac.md), [FR.04.1.2](functional-requirements/FR.04.1.2-lich-lap-va-ngoai-le.md), [FR.04.1.3](functional-requirements/FR.04.1.3-xem-lich-gop.md) | Có — nội dung Draft |
| CP.04 | CN.04.2 | [FR.04.2.1](functional-requirements/FR.04.2.1-vai-tro-va-rieng-tu.md), [FR.04.2.2](functional-requirements/FR.04.2.2-chia-se-gio-ban.md) | Có — nội dung Draft |
| CP.05 | CN.05.1 | [FR.05.1.1](functional-requirements/FR.05.1.1-ho-so-lan-chay.md), [FR.05.1.2](functional-requirements/FR.05.1.2-chay-tai-lap.md) | Có — nội dung Draft |
| CP.05 | CN.05.2 | [FR.05.2.1](functional-requirements/FR.05.2.1-input-moi.md) | Có — nội dung Draft |
| CP.06 | CN.06.1 | [FR.06.1.1](functional-requirements/FR.06.1.1-nhap-va-chan-doan.md) | Có — nội dung Draft |
| CP.06 | CN.06.2 | [FR.06.2.1](functional-requirements/FR.06.2.1-ke-hoach-doi-soat.md), [FR.06.2.2](functional-requirements/FR.06.2.2-luu-mo-du-an.md) | Có — nội dung Draft |

## NFR và hành vi liên quan

| NFR | CN | FR áp dụng |
|---|---|---|
| [NFR.01](non-functional-requirements/NFR.01-nhat-quan-diem.md) | CN.03.1 | FR.02.1.1, FR.03.1.1, FR.03.2.1 |
| [NFR.02](non-functional-requirements/NFR.02-tai-lap.md) | CN.05.1 | FR.05.1.1, FR.05.1.2 |
| [NFR.03](non-functional-requirements/NFR.03-gioi-han-thong-tin.md) | CN.04.2 | FR.04.2.1, FR.04.2.2, FR.02.3.1, FR.05.1.1 |
| [NFR.04](non-functional-requirements/NFR.04-toan-ven-luu-tru.md) | CN.02.2 | FR.02.2.2, FR.06.2.2 |
| [NFR.05](non-functional-requirements/NFR.05-phan-hoi-giao-dien.md) | CN.02.2 | FR.03.2.2, FR.02.3.1, FR.06.1.1 |
| [NFR.06](non-functional-requirements/NFR.06-an-toan-song-song.md) | CN.03.2 | FR.03.2.2, FR.05.1.2 |
| [NFR.07](non-functional-requirements/NFR.07-thuc-nghiem-hieu-nang.md) | CN.05.1 | FR.03.2.2, FR.03.1.1, FR.05.1.1 |

## Rà soát nhất quán và điểm còn mở

- **ZAG:** 6/6 CP có CN; 13/13 CN có FR. **ZIG:** 20/20 FR có đúng CN và CP tương ứng ID; 7/7 NFR có CN và tham chiếu FR. Mỗi FR/NFR có AC và tệp riêng.
- **Phạm vi:** FR không bắt đăng nhập, ICS hoặc nhập Excel lịch ngoài; nhập/xuất Excel kế hoạch/TKB/báo cáo vẫn có. Concurrency và lịch gộp đều bắt buộc.
- **Không nhập nhằng trạng thái:** nhận/xuất lịch nháp thiếu khác với công bố lịch hoàn chỉnh. Input bất khả thi/chưa giải đủ có báo cáo; không tự bỏ giờ bận.
- **Giới hạn phối hợp:** FR.03.2.1 phụ thuộc metric FR.03.1.1; FR.02.3.1 dùng cùng snapshot với Verify và metric; FR.04.2.2 đưa lịch ngoài vào input nhưng không được lộ chi tiết. Các phụ thuộc này được nêu rõ, không đổi CN cha của FR.
- **Phân biệt nội dung gần nhau:** FR.01.1.1 tạo phương án; FR.03.2.1 xác định thứ hạng; FR.03.2.2 điều phối tìm kiếm. FR.05.1.1 lưu căn cứ, FR.05.1.2 bảo đảm chế độ tái lập, FR.06.2.2 giữ dữ liệu qua các phiên làm việc. Không gộp các hành vi khác mục đích chỉ vì cùng dùng lưu trữ.
- **Objective:** giữ trọng số S1–S15; tránh trùng chéo bằng tiêu chí phá hòa C là quy tắc thiết kế Draft, không thêm trọng số mặc định mới. [Objective và metric](design/objective-and-metrics.md) quy định đơn vị đếm, trạng thái không áp dụng/thiếu dữ liệu và giới hạn so sánh.
- **Điểm mở dữ liệu:** xác nhận mapping dòng kế hoạch → buổi, alias/đồng giảng, quan hệ nhóm, bảng giờ, phòng và target S10. Đây là dữ liệu/cấu hình cần hoàn thiện trước nghiệm thu, không được tự bịa.
- **Điểm mở nghiệm thu:** ngưỡng UI NFR.05, tỷ lệ đạt mục tiêu 60 giây NFR.07, mức cải thiện, định dạng bổ sung 84 cột. Các mục đó chưa được coi là đã duyệt hay đã đạt.
- **Kết luận:** hoàn tất vòng đặc tả bước 0–5 và truy vết nội bộ ở mức Draft theo thông tin đã xác nhận. Chưa phải baseline ký duyệt, bộ dữ liệu nghiệm thu hoàn chỉnh hoặc bằng chứng tính đúng/hiệu năng của mã thử nghiệm.

