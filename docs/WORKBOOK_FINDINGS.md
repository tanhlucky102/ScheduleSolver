# Operational workbook review

Inspected workbook: `FIT Time table Fall2026 V5.2.xlsx`.
SHA-256: `1b58912259909a8fa2447edfb6546f698d0f574a3d5ca67a3ba7c17751774169`.
Evidence was first extracted from XLSX XML, then checked using POI importers and JUnit integration tests; the brief was read separately.

## Observations and implementation decisions

| Evidence | Consequence |
|---|---|
| 11 sheets; `Kế hoạch mở lớp ` and `Update 05.08 ` have trailing spaces | Normalize names when selecting sheets; detect ambiguous normalized names. |
| Manual sheet is named `Timetable Spring 2026`, but D4 states K22–24 start 17/08/2026 and K25 start 31/8/2026 | Sheet title is not an authoritative semester calendar. Configure cohort dates explicitly. |
| `Đại trà`: 189 course rows (113 FIT + 76 MME) | The brief's 113-row standard-programme baseline excludes MME commitments. |
| `CLC`: 48 FIT course rows | 113 + 48 = 161 is an FIT subset, not the workbook's total schedule size. |
| `TT`: 82 FIT course rows | Scope selection must be explicit; do not assume 161 encompasses TT. |
| Teaching plan: 290 rows with a course code (226 FIT, 64 MME) | Raw plan rows are not necessarily unique weekly sessions; do not equate row count with coverage. |
| Update sheets contain 13, 12, 7, and 4 course rows respectively | Treat as separate revisions until reviewed; automatic concatenation would duplicate assignments. |
| Row 2 of university sheets contains machine headers; `TKBT57` occurs after `TKBT64`; template extends through `TKBT70` | Resolve every field and week by header. Preserve up to 70 weeks; explicit `toLongMask()` rejects active weeks above 64. Bit 63 represents week 64 despite a negative signed long. |
| 184/189 `Đại trà` rows have blank `MaNV`; all CLC and TT rows have blank `MaNV` | Resolve manual-grid aliases against a reviewed teacher registry. Blank IDs must never be treated as distinct available teachers. |
| Manual D29: `61MME4CCMa - 01` / `Dung 416 C` | Preserve partial teacher names for resolution; normalize course syntax without excluding MME or mixed-case suffixes. |
| Manual D69: `TuanVM (NgocTB) - 416 C` | Preserve teacher text; parentheses cannot safely establish co-teaching, replacement, or identity without review. |
| Manual cells contain `802C`, `802 C`, `205 D1`, and room-before-teacher text | Normalize room spacing in either order; reject multiple room/course candidates. |
| D70/D79 repeat SS1 group 04 with rooms 206D1/205D1 | Do not silently merge repeated grid cells into a four-period session with an invented room. |
| Printed 14:40–16:45 and 16:40–18:45 periods overlap by five minutes | Fixed 28/10/2026: the app shows slot 5 as 16:55–18:45. `GridExcelReader` still accepts the workbook label 16:40 so the old grid can be read. |
| University `TietBD` uses starts 3, 5, 7, 9, 11, 13 | `PeriodGrid` explicitly maps these to slots 0–5; the old one-based helper was removed. |
| Plan rows 174–177 contain course codes and cohorts but no course titles | Preserve all 290 rows; emit four title warnings instead of inventing titles or dropping MME requirements. |
| Manual grid has 246 course cells; 235 parse completely and 11 lack room or teacher text | Report all 11 failures with row and column; do not claim a complete solver-ready import. Three lack rooms, eight lack teachers. |
| Verify rows 3–6 describe four substantive criteria | H1 teacher overlap, H2 same-course lecture/tutorial overlap, configurable same-cohort cross-course overlap, and H3 reviewed session coverage. |

## Cách code hiện tại dùng các phát hiện trên (cập nhật 28/10/2026)

Code cũ (JavaFX, H2/JDBC, các importer 84 cột) đã được thay bằng bản viết lại; xem `README.md`.

- `io/PlanExcelReader`: tìm sheet theo tên đã chuẩn hóa ("Kế hoạch mở lớp " có khoảng trắng thừa) và tìm cột theo tiêu đề, không theo vị trí. Dòng lỗi được báo kèm số dòng, không làm hỏng cả file. Kết quả: 290 dòng.
- `service/PlanBuilder`: gom dòng theo môn và chia thành buổi Lec/Tut/Lec+Tut/4 tiết theo quy ước từng chương trình (`docs/QUY_UOC_PHAN_CONG.md`). Kết quả: 236 buổi. Không coi một dòng Excel là một buổi một cách máy móc.
- `io/GridExcelReader` + `service/GridTimetableConverter`: đọc lưới `Timetable Spring 2026` (246 ô), nhận ra GV ở 186 buổi. Ô thiếu hoặc không rõ GV (ví dụ "Dung", "- 205 D1") được **báo cảnh báo**, không tự đoán; bí danh khai báo trong `resources/giang_vien.csv`. Hai ô lặp lại cùng lớp/cùng giờ (SS1 nhóm 04) chỉ tính một lần.
- Lưới cũ dùng để (1) đề xuất quy ước phân công mặc định và (2) làm baseline so sánh trong thực nghiệm E1.
- Sheet `Verify` (4 tiêu chí) được dùng làm ràng buộc cứng H1, H2 và mục tiêu mềm S6; xem `docs/GIAI_THUAT_VA_METRICS.md`.
- Không dùng tuần học: TKB và lịch bận là lịch tuần cố định cho cả học kỳ (DEC.19). Khác biệt ngày bắt đầu giữa K22–24 và K25 không ảnh hưởng lịch tuần.
- Các sheet `Đại trà`, `CLC`, `TT` (mẫu 84 cột) và các sheet `Update ...` chưa được dùng.
