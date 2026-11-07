"""Excel grid based on TimetableTemplate.java block/day layout; explicit room assignment."""
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from .domain_models import State
from .domain_rules import events, evaluate


def safe(value):
    # Text only: prevent spreadsheet formula injection in user supplied cells.
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def program_type(r: dict) -> str:
    course = str(r.get("course", "")).upper()
    sec = str(r.get("section", "")).upper()
    cid = str(r.get("id", "")).upper()
    prog = str(r.get("program", "")).upper()
    dept = str(r.get("department", "")).upper()
    if prog == "CLC" or "CLC" in course or "CLC" in sec or "CLC" in cid:
        return "CLC"
    if course.startswith("61MME") or "MME" in cid or dept == "TTDPT":
        return "MME"
    return "STANDARD"


def workbook(state: State, source: str):
    rows = state.published if source == "published" else events(state, state.draft)[0]
    if not rows:
        raise ValueError("No timetable to export")
    book = Workbook()

    # 1. Danh sách lớp
    listing = book.active
    listing.title = "Danh sách lớp"
    listing.append(["Mã lớp","Mã môn","Khóa","Nhóm","Loại","Số SV","Tính chất phòng","Bộ môn","Giảng viên","Thứ","Bắt đầu","Kết thúc","Mã phòng"])
    time = lambda m: f"{m//60:02d}:{m%60:02d}"
    for r in rows:
        listing.append([safe(v) for v in [
            r["id"], r["course"], r["cohort"], r["section"], r["kind"],
            r["students"], r["room"], r["department"], r["teacher"], r["day"],
            time(r["start"]), time(r["end"]), r.get("room_id", "")
        ]])

    # Color fills and borders
    fill_clc = PatternFill("solid", fgColor="DBEAFE")  # Soft sky blue
    font_clc = Font(color="1E3A8A", bold=True, size=10)
    fill_mme = PatternFill("solid", fgColor="FFEDD5")  # Soft peach / orange
    font_mme = Font(color="7C2D12", bold=True, size=10)
    fill_std = PatternFill("solid", fgColor="FFFFFF")  # White
    font_std = Font(color="0F172A", size=10)
    thin = Side(border_style="thin", color="CBD5E1")
    cell_border = Border(top=thin, left=thin, right=thin, bottom=thin)

    # 2. IT + MME and IT CLC + TT
    for title, advanced in [("IT + MME", False), ("IT CLC + TT", True)]:
        sheet = book.create_sheet(title)
        legend_text = "[Xanh dương] Lớp CLC" if advanced else "[Cam đào] Lớp MME  |  [Trắng] Đại trà IT"
        sheet.append([f"Thời khóa biểu ({source}) - Chú thích: {legend_text}"])
        sheet.append(["Khối", "Giờ"] + [f"Thứ {d}" for d in range(2, 9)])
        subset = [r for r in rows if (r["program"] in ("CLC", "TT")) == advanced]

        for block in ("LEC", "TUT", "COMBINED"):
            starts = sorted({r["start"] for r in subset if r["kind"] == block})
            for minute in starts:
                row_vals = [block, time(minute)]
                row_matched = []
                for day in range(2, 9):
                    matched = [
                        r for r in subset
                        if r["kind"] == block and r["start"] == minute and r["day"] == day
                    ]
                    row_matched.append(matched)
                    if matched:
                        lines = []
                        for r in matched:
                            c_code = r.get("course") or r.get("id")
                            sec = f" - {r['section']}" if r.get("section") else ""
                            tch = r.get("teacher") or "Chưa gán"
                            rm = r.get("room_id") or ""
                            lines.append(f"{c_code}{sec}\n{tch} - {rm} ({time(r['start'])}–{time(r['end'])})")
                        row_vals.append("\n---\n".join(lines))
                    else:
                        row_vals.append("")

                sheet.append(row_vals)
                current_row_idx = sheet.max_row
                for col_idx, matched in enumerate(row_matched, start=3):
                    cell = sheet.cell(row=current_row_idx, column=col_idx)
                    cell.border = cell_border
                    cell.alignment = Alignment(vertical="top", wrap_text=True)
                    if matched:
                        types = {program_type(r) for r in matched}
                        if "CLC" in types:
                            cell.fill = fill_clc
                            cell.font = font_clc
                        elif "MME" in types:
                            cell.fill = fill_mme
                            cell.font = font_mme
                        else:
                            cell.fill = fill_std
                            cell.font = font_std

        sheet.freeze_panes = "C3"

    # 3. Đánh giá
    report = book.create_sheet("Đánh giá")
    if source == "draft":
        score = evaluate(state, state.draft)
        report.append(["Lỗi cứng", score["hard"]])
        report.append(["Phạt mềm", score["soft_total"]])
        for violation in score["violations"]:
            report.append([safe(violation)])
    else:
        report.append(["Bản công bố đã qua kiểm tra 0 lỗi cứng tại thời điểm công bố"])

    # Global column styling
    for sheet in book:
        for cell in sheet[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="126759")
        for row in sheet:
            for cell in row:
                if not cell.alignment.wrap_text:
                    cell.alignment = Alignment(vertical="top", wrap_text=True)
        for col in sheet.columns:
            sheet.column_dimensions[col[0].column_letter].width = 24

    output = BytesIO()
    book.save(output)
    return output.getvalue()
