"""Sample template generators (.xlsx / .csv) and external/study schedule file parser."""
import csv
from io import BytesIO, StringIO
from zipfile import ZipFile
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from .timetable.models import normalize_iso_date


def _style_header(ws, fill_hex: str = "126759"):
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF", size=10)
        cell.fill = PatternFill("solid", fgColor=fill_hex)
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = 20


def build_plan_template_xlsx() -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "KeHoachDaoTao"
    ws.append([
        "Mã môn", "Tên học phần", "Khóa", "Bộ môn", "Sĩ số",
        "Số tiết Lec", "Số tiết Tut", "Lec+Tut liền",
        "Phòng Lec", "Phòng Tut", "Số lớp Lec", "Số lớp Tut",
        "Ngày bắt đầu", "Ngày kết thúc",
    ])
    ws.append(["61FIT3SS1", "Phát triển phần mềm nguồn mở", "2024", "CNPM", 120, 2.5, 2.5, "", "Máy chiếu", "Máy tính", 1, 4, "17/08/2026", "22/11/2026"])
    ws.append(["61FIT3OS1CLC", "Hệ điều hành (CLC)", "2024", "HTTT", 60, 2.5, 2.5, "", "Máy chiếu", "Máy tính", 1, 2, "17/08/2026", "22/11/2026"])
    ws.append(["66FIT3AI1", "Trí tuệ nhân tạo (Tiên tiến TT)", "2024", "KHMT", 55, 2.5, 2.5, "", "Máy chiếu", "Máy tính", 1, 2, "17/08/2026", "22/11/2026"])
    ws.append(["61MME2GD1", "Thiết kế đồ họa đa phương tiện", "2025", "TTDPT", 80, 2, 2, "x", "Máy tính", "Máy tính", "", 3, "07/09/2026", "13/12/2026"])
    _style_header(ws)
    out = BytesIO()
    wb.save(out)
    return out.getvalue()


def build_external_template_xlsx() -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "LichNgoaiVaDiHoc"
    ws.append([
        "Loại lịch", "Trường / Đơn vị", "Mã môn / Hoạt động", "Lớp / Nhóm",
        "Thứ", "Giờ bắt đầu", "Giờ kết thúc", "Tiết bắt đầu", "Số tiết",
        "Phòng", "Ngày bắt đầu", "Ngày kết thúc", "Mã màu", "Ghi chú",
    ])
    ws.append(["EXTERNAL_TEACHING", "Trường A", "INT1306 - Cấu trúc dữ liệu & GT", "Nhóm 02", 5, "18:00", "20:30", 13, 3, "502-NT", "17/08/2026", "13/12/2026", "#fef3c7", "Dạy tối T5 tại Trường A"])
    ws.append(["STUDYING", "ĐH Quốc Gia (VNU)", "ENG801 - Nghiên cứu sinh Tiến sĩ", "NCS-K42", 7, "07:10", "09:15", 3, 2.5, "B1-302", "17/08/2026", "20/12/2026", "#dcfce7", "Đi học sáng T7 (Tiết 3–4)"])
    ws.append(["MAKEUP", "HANU - Khoa CNTT", "61FIT3SS1 - Dạy bù", "Tut 01", 4, "17:10", "19:15", 11, 2.5, "402C", "09/11/2026", "15/11/2026", "#f3e8ff", "Dạy bù Ca 5 tối T4 (Tuần 15)"])
    _style_header(ws, "1E3A8A")
    out = BytesIO()
    wb.save(out)
    return out.getvalue()


def build_teachers_template_csv() -> bytes:
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "name", "department", "assistant", "active", "capabilities"])
    writer.writerow(["GV01", "Nguyễn Văn An", "CNPM", "false", "true", "61FIT3SS1:LEC|TUT;61FIT3SE1:LEC"])
    writer.writerow(["GV02", "Trần Thị Bình", "KHMT", "false", "true", "66FIT3AI1:LEC|TUT"])
    writer.writerow(["TG01", "Lê Minh Châu", "CNPM", "true", "true", "61FIT3SS1:TUT"])
    writer.writerow(["GV03", "Phạm Quốc Dũng", "HTTT", "false", "false", "61FIT3OS1CLC:LEC"])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def build_rooms_template_csv() -> bytes:
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "name", "capacity", "room_type", "equipment", "active", "note"])
    writer.writerow(["801C", "Phòng 801C", "150", "PROJECTOR", "PROJECTOR", "true", "Phòng lý thuyết lớn tầng 8"])
    writer.writerow(["402C", "Phòng máy 402C", "45", "COMPUTER", "COMPUTER|PROJECTOR", "true", "Phòng thực hành Tut"])
    writer.writerow(["206A1", "Phòng đa năng 206A1", "100", "COMPUTER", "COMPUTER|PROJECTOR", "true", "Phòng gộp Lec+Tut"])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def _parse_time_str(val) -> int | None:
    if val is None:
        return None
    if hasattr(val, "hour") and hasattr(val, "minute"):
        return int(val.hour) * 60 + int(val.minute)
    if isinstance(val, float) and 0 < val < 1:
        return round(val * 1440)
    if isinstance(val, (int, float)) and 300 <= int(val) <= 1400:
        return int(val)
    s = str(val).strip().lower().replace("h", ":").replace(".", ":")
    if not s:
        return None
    if ":" in s:
        parts = s.split(":")
        h = int(parts[0].strip())
        m = int(parts[1].strip()[:2]) if len(parts) > 1 and parts[1].strip() else 0
        return h * 60 + m
    if s.isdigit():
        num = int(s)
        if 6 <= num <= 22:
            return num * 60
        if 360 <= num <= 1320:
            return num
    return None


def _parse_day(val) -> int:
    s = str(val or "").strip().lower()
    if s in ("cn", "chủ nhật", "chu nhat", "sun", "sunday", "8"):
        return 8
    digits = "".join(ch for ch in s if ch.isdigit())
    if digits:
        d = int(digits)
        if 2 <= d <= 8:
            return d
    raise ValueError(f"Thứ không hợp lệ: '{val}' (nhập từ 2 đến 8 hoặc CN)")


def _normalize_activity_type(val) -> str:
    s = str(val or "").strip().upper()
    if s in ("EXTERNAL_TEACHING", "STUDYING", "PERSONAL_BUSY", "MAKEUP"):
        return s
    low = str(val or "").strip().lower()
    if "đi học" in low or "di hoc" in low or "study" in low or "ncs" in low or "cao học" in low:
        return "STUDYING"
    if "bù" in low or "bu" in low or "makeup" in low:
        return "MAKEUP"
    if "bận" in low or "ban" in low or "busy" in low or "cá nhân" in low:
        return "PERSONAL_BUSY"
    return "EXTERNAL_TEACHING"


def _period_to_minutes(start_period: float, periods: float, first_period_start: int = 430, period_minutes: float = 50, break_minutes: int = 10, include_break: bool = True) -> tuple[int, int]:
    step = period_minutes + (break_minutes if include_break else 0)
    hanu_mode = (first_period_start == 430)
    if hanu_mode:
        # HANU Edusoft portal: Tiết 1–2 is early reserve before 07:10; academic shifts start at Tiết 3 (07:10), 5 (09:30), 7 (12:20), 9 (14:40), 11 (17:10), 13 (19:30)
        hanu_starts = {1: 360, 2: 395, 3: 430, 4: 490, 5: 570, 6: 630, 7: 740, 8: 800, 9: 880, 10: 940, 11: 1030, 12: 1090, 13: 1170, 14: 1230}
        start = hanu_starts.get(int(round(start_period)), 430 + round(max(0, start_period - 3) * step))
    elif start_period <= 6:
        start = first_period_start + round((start_period - 1) * step)
    elif start_period <= 12:
        start = 780 + round((start_period - 7) * step)
    else:
        start = 1080 + round((start_period - 13) * step)
    dur = round(periods * period_minutes) + (max(0, int(periods) - 1) * break_minutes if include_break else 0)
    start = max(360, min(1310, start))
    end = max(start + 30, min(1320, start + max(30, dur)))
    return start, end


def preview_external_file(
    filename: str,
    raw: bytes,
    first_period_start: int = 430,
    period_minutes: float = 50,
    break_minutes: int = 10,
    include_break: bool = False,
    teacher_filter: str | None = None,
) -> dict:
    ext = (filename or "").lower().rsplit(".", 1)[-1]
    raw_rows: list[list] = []
    if ext in ("xlsx", "xlsm"):
        with ZipFile(BytesIO(raw)) as archive:
            if sum(info.file_size for info in archive.infolist()) > 25_000_000:
                raise ValueError("Expanded workbook limit is 25 MB")
        wb = load_workbook(BytesIO(raw), read_only=True, data_only=True)
        ws = wb.active
        for r in ws.iter_rows(values_only=True):
            raw_rows.append(list(r))
        wb.close()
    elif ext == "csv":
        text = raw.decode("utf-8-sig", errors="replace")
        for r in csv.reader(StringIO(text)):
            raw_rows.append(r)
    else:
        raise ValueError("Chỉ hỗ trợ file .xlsx hoặc .csv")

    non_empty = [r for r in raw_rows if any(v is not None and str(v).strip() != "" for v in r)]
    if len(non_empty) < 2:
        raise ValueError("File rỗng hoặc thiếu dòng dữ liệu")

    headers = [str(x).strip() if x is not None else "" for x in non_empty[0]]
    hmap = {
        "loại lịch": "activity_type", "loai lich": "activity_type", "loại": "activity_type", "activity_type": "activity_type",
        "trường / đơn vị": "institution", "truong / don vi": "institution", "trường": "institution", "truong": "institution",
        "đơn vị": "institution", "don vi": "institution", "institution": "institution",
        "mã môn / hoạt động": "course", "ma mon / hoat dong": "course", "môn": "course", "mon": "course", "course": "course",
        "mã môn": "course_code", "ma mon": "course_code", "mã môn học": "course_code", "ma mon hoc": "course_code", "mã mh": "course_code",
        "tên môn": "course_name", "ten mon": "course_name", "tên môn học": "course_name", "ten mon hoc": "course_name",
        "lớp / nhóm": "class_name", "lop / nhom": "class_name", "nhóm": "class_name", "nhom": "class_name",
        "nhóm tổ": "class_name", "lớp": "class_name", "lop": "class_name", "class_name": "class_name",
        "thứ": "day", "thu": "day", "day": "day",
        "giờ bắt đầu": "start", "gio bat dau": "start", "bắt đầu": "start", "bat dau": "start", "bat_dau": "start", "start": "start",
        "giờ kết thúc": "end", "gio ket thuc": "end", "kết thúc": "end", "ket thuc": "end", "ket_thuc": "end", "end": "end",
        "tiết bắt đầu": "start_period", "tiet bat dau": "start_period", "tiết bắt đầu (*)": "start_period", "tiet bat dau (*)": "start_period", "start_period": "start_period",
        "số tiết": "periods", "so tiet": "periods", "periods": "periods",
        "phòng": "room", "phong": "room", "room": "room",
        "ngày bắt đầu": "start_date", "ngay bat dau": "start_date", "từ ngày": "start_date", "tu ngay": "start_date", "start_date": "start_date",
        "ngày kết thúc": "end_date", "ngay ket thuc": "end_date", "đến ngày": "end_date", "den ngay": "end_date", "end_date": "end_date",
        "mã màu": "color", "ma mau": "color", "màu": "color", "color": "color",
        "ghi chú": "note", "ghi chu": "note", "note": "note",
        "tài khoản": "account", "tai khoan": "account",
        "ma_gv": "teacher_code", "mã gv": "teacher_code", "ma gv": "teacher_code", "teacher": "teacher_code",
    }
    norm = [hmap.get(h.lower().strip(), h.lower().strip()) for h in headers]
    if "day" not in norm or not ({"course", "course_code", "course_name"} & set(norm)):
        raise ValueError("File thiếu cột bắt buộc: Thứ, Mã môn / Tên môn, và Giờ (hoặc Tiết bắt đầu + Số tiết)")

    items, errors = [], []
    seen_keys: set[tuple] = set()
    for row_idx, vals in enumerate(non_empty[1:], start=2):
        if row_idx > 2001:
            raise ValueError("Giới hạn tối đa 2000 dòng")
        rec = dict(zip(norm, vals))
        if teacher_filter and "teacher_code" in rec:
            row_tid = str(rec.get("teacher_code") or "").strip()
            if row_tid and row_tid.lower() != teacher_filter.lower():
                continue
        try:
            day = _parse_day(rec.get("day"))
            course = str(rec.get("course") or "").strip()
            if not course:
                c_code = str(rec.get("course_code") or "").strip()
                c_name = str(rec.get("course_name") or "").strip()
                course = f"{c_code} - {c_name}".strip(" -")
            if not course:
                raise ValueError("Thiếu tên môn học / hoạt động")

            class_name = str(rec.get("class_name") or "N01").strip() or "N01"
            institution = str(rec.get("institution") or "").strip()
            if not institution:
                acct = str(rec.get("account") or "").lower()
                institution = "PTIT" if "ptit" in acct else "Trường ngoài / Cơ sở đào tạo"

            start = _parse_time_str(rec.get("start"))
            end = _parse_time_str(rec.get("end"))
            if start is None or end is None:
                sp = rec.get("start_period")
                pr = rec.get("periods")
                if sp is not None and str(sp).strip() != "" and pr is not None and str(pr).strip() != "":
                    # If PTIT account detected, use 07:00 (420) standard period start unless HANU specified
                    fp = 420 if "ptit" in institution.lower() else first_period_start
                    ib = True if "ptit" in institution.lower() else include_break
                    start, end = _period_to_minutes(float(sp), float(pr), fp, period_minutes, break_minutes, ib)
                else:
                    raise ValueError("Cần nhập Giờ bắt đầu + Giờ kết thúc hoặc Tiết bắt đầu + Số tiết")

            if start >= end or start < 360 or end > 1320:
                raise ValueError(f"Khung giờ không hợp lệ ({start}..{end}, cho phép 06:00–22:00)")

            activity_type = _normalize_activity_type(rec.get("activity_type"))
            room = str(rec.get("room") or "").strip()
            color = str(rec.get("color") or "").strip()
            note = str(rec.get("note") or "").strip()
            start_date = normalize_iso_date(rec.get("start_date"))
            end_date = normalize_iso_date(rec.get("end_date"))
            if start_date and end_date and start_date > end_date:
                raise ValueError(f"Ngày bắt đầu ({start_date}) không được lớn hơn ngày kết thúc ({end_date})")

            dedup_key = (day, start, end, course.lower(), class_name.lower(), institution.lower(), start_date, end_date)
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            items.append({
                "day": day,
                "start": start,
                "end": end,
                "course": course[:200],
                "class_name": class_name[:100],
                "room": room[:100],
                "institution": institution[:200],
                "activity_type": activity_type,
                "color": color[:20],
                "note": note[:500],
                "start_date": start_date,
                "end_date": end_date,
            })
        except Exception as exc:
            errors.append({"row": row_idx, "message": str(exc)})

    return {
        "items": items,
        "errors": errors,
        "can_import": bool(items) and not errors,
    }
