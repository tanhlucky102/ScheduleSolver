"""Excel grid based on TimetableTemplate.java block/day layout; explicit room assignment."""
from datetime import date, timedelta
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from .models import State, ColorRule, HolidayRule
from .rules import events, evaluate


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
    if prog == "TT" or course.startswith("66FIT") or "TT" in sec:
        return "TT"
    if course.startswith("61MME") or "MME" in cid or dept == "TTDPT":
        return "MME"
    return "STANDARD"


def _hex(color: str, fallback: str) -> str:
    cleaned = (color or "").strip().lstrip("#").upper()
    if len(cleaned) == 6 and all(c in "0123456789ABCDEF" for c in cleaned):
        return cleaned
    return fallback


def workbook(state: State, source: str):
    rows = state.published if source == "published" else events(state, state.draft)[0]
    if not rows:
        raise ValueError("No timetable to export")
    book = Workbook()

    prog_rules = {
        c.key.upper(): c
        for c in state.config.color_rules
        if c.category == "PROGRAM"
    }
    kind_rules = {
        c.key.upper(): c
        for c in state.config.color_rules
        if c.category == "KIND"
    }

    # 1. Danh sách lớp
    listing = book.active
    listing.title = "Danh sách lớp"
    listing.append(["Mã lớp","Mã môn","Khóa","Nhóm","Loại","Số SV","Tính chất phòng","Bộ môn","Giảng viên","Thứ","Bắt đầu","Kết thúc","Mã phòng","Hệ CT","Ghi chú màu","Ngày bắt đầu","Ngày kết thúc"])
    time = lambda m: f"{m//60:02d}:{m%60:02d}"
    for r in rows:
        ptype = program_type(r)
        p_note = prog_rules[ptype].note if ptype in prog_rules else ""
        k_note = kind_rules[str(r.get("kind", "")).upper()].note if str(r.get("kind", "")).upper() in kind_rules else ""
        note_combined = " | ".join(x for x in (p_note, k_note) if x)
        listing.append([safe(v) for v in [
            r["id"], r["course"], r["cohort"], r["section"], r["kind"],
            r["students"], r["room"], r["department"], r["teacher"], r["day"],
            time(r["start"]), time(r["end"]), r.get("room_id", ""), ptype, note_combined,
            r.get("start_date", ""), r.get("end_date", "")
        ]])

    # Color fills and borders (customizable via state.config.color_rules)
    clc_bg = _hex(prog_rules["CLC"].bg_color, "DBEAFE") if "CLC" in prog_rules else "DBEAFE"
    clc_fg = _hex(prog_rules["CLC"].text_color, "1E3A8A") if "CLC" in prog_rules else "1E3A8A"
    tt_bg = _hex(prog_rules["TT"].bg_color, "D1FAE5") if "TT" in prog_rules else "D1FAE5"
    tt_fg = _hex(prog_rules["TT"].text_color, "065F46") if "TT" in prog_rules else "065F46"
    mme_bg = _hex(prog_rules["MME"].bg_color, "FFEDD5") if "MME" in prog_rules else "FFEDD5"
    mme_fg = _hex(prog_rules["MME"].text_color, "7C2D12") if "MME" in prog_rules else "7C2D12"
    std_bg = _hex(prog_rules["STANDARD"].bg_color, "FFFFFF") if "STANDARD" in prog_rules else "FFFFFF"
    std_fg = _hex(prog_rules["STANDARD"].text_color, "0F172A") if "STANDARD" in prog_rules else "0F172A"

    fill_clc = PatternFill("solid", fgColor=clc_bg)
    font_clc = Font(color=clc_fg, bold=True, size=10)
    fill_tt = PatternFill("solid", fgColor=tt_bg)
    font_tt = Font(color=tt_fg, bold=True, size=10)
    fill_mme = PatternFill("solid", fgColor=mme_bg)
    font_mme = Font(color=mme_fg, bold=True, size=10)
    fill_std = PatternFill("solid", fgColor=std_bg)
    font_std = Font(color=std_fg, size=10)
    thin = Side(border_style="thin", color="CBD5E1")
    cell_border = Border(top=thin, left=thin, right=thin, bottom=thin)

    # 2. IT + MME and IT CLC + TT
    for title, advanced in [("IT + MME", False), ("IT CLC + TT", True)]:
        sheet = book.create_sheet(title)
        legend_text = "[Xanh dương] Lớp CLC  |  [Xanh ngọc] Tiên tiến TT" if advanced else "[Cam đào] Lớp MME  |  [Trắng] Đại trà IT"
        sheet.append([f"Thời khóa biểu ({source}) - Chú thích: {legend_text}"])
        sheet.append(["Khối", "Giờ"] + [f"Thứ {d}" for d in range(2, 9)])
        subset = [r for r in rows if (program_type(r) in ("CLC", "TT") or r["program"] in ("CLC", "TT")) == advanced]

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
                        elif "TT" in types:
                            cell.fill = fill_tt
                            cell.font = font_tt
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


def _format_vn_date(iso_str: str) -> str:
    if not iso_str or len(iso_str) < 10:
        return iso_str or ""
    parts = iso_str[:10].split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return iso_str


def _format_short_vn(iso_str: str) -> str:
    if not iso_str or len(iso_str) < 10:
        return ""
    parts = iso_str[:10].split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}"
    return iso_str


def _find_holiday_on_date(iso_str: str, holidays: list[HolidayRule]) -> HolidayRule | None:
    if not iso_str or len(iso_str) < 10:
        return None
    d = iso_str[:10]
    for h in holidays:
        if h.start_date <= d <= h.end_date:
            return h
    return None


def _evaluate_holiday_occurrence(item: dict, monday: date | None, holidays: list[HolidayRule]) -> dict:
    """Evaluate a class/event against academic holidays with automatic same-weekday next-week makeup shifting."""
    day_num = int(item.get("day") or 2)
    target_wkday = 6 if day_num == 8 else day_num - 2  # Python weekday: Mon=0 .. Sun=6
    sd_raw = str(item.get("start_date") or "")[:10]
    ed_raw = str(item.get("end_date") or "")[:10]
    act_up = str(item.get("activity_type") or "").upper()
    is_single_makeup = act_up == "MAKEUP" and sd_raw and sd_raw == ed_raw

    target_iso = (monday + timedelta(days=day_num - 2)).isoformat() if monday is not None else ""

    if sd_raw and ed_raw:
        try:
            sd_dt = date.fromisoformat(sd_raw)
            ed_dt = date.fromisoformat(ed_raw)
        except ValueError:
            sd_dt = ed_dt = None
    else:
        sd_dt = ed_dt = None

    if sd_dt is not None and ed_dt is not None and sd_dt <= ed_dt:
        offset = (target_wkday - sd_dt.weekday()) % 7
        first_occ = sd_dt + timedelta(days=offset)
        if first_occ > ed_dt:
            return {
                "visible": False,
                "status": "OUT_OF_RANGE",
                "holiday_name": "",
                "makeup_next_date": "",
                "shifted_from_date": "",
                "session_number": None,
                "total_sessions": 0,
                "effective_start_date": sd_raw,
                "effective_end_date": ed_raw,
                "extra_weeks": 0,
            }
        base_sessions = ((ed_dt - first_occ).days // 7) + 1
        timeline: list[dict] = []
        completed = 0
        pending_holidays: list[tuple[str, str]] = []
        skipped_names: list[str] = []
        cur = first_occ
        for _ in range(104):
            if completed >= base_sessions:
                break
            cur_iso = cur.isoformat()
            hit = None if is_single_makeup else _find_holiday_on_date(cur_iso, holidays)
            if hit is not None:
                pending_holidays.append((cur_iso, hit.name))
                if hit.name not in skipped_names:
                    skipped_names.append(hit.name)
                timeline.append({
                    "date": cur_iso,
                    "status": "HOLIDAY_OFF",
                    "holiday_name": hit.name,
                    "shifted_from_date": "",
                    "session_number": None,
                })
            else:
                completed += 1
                if pending_holidays:
                    h_names = ", ".join(dict.fromkeys(nm for _, nm in pending_holidays))
                    from_dt = pending_holidays[0][0]
                    pending_holidays = []
                    st = "SHIFTED_NEXT_WEEK"
                elif cur > ed_dt and skipped_names:
                    h_names = ", ".join(skipped_names)
                    from_dt = ""
                    st = "MAKEUP_EXTENSION"
                else:
                    h_names = ""
                    from_dt = ""
                    st = "NORMAL"
                timeline.append({
                    "date": cur_iso,
                    "status": st,
                    "holiday_name": h_names,
                    "shifted_from_date": from_dt,
                    "session_number": completed,
                })
            cur += timedelta(days=7)

        # Backfill makeup_next_date for HOLIDAY_OFF entries (exact next non-holiday same weekday)
        next_teaching = ""
        for entry in reversed(timeline):
            if entry["status"] != "HOLIDAY_OFF":
                next_teaching = entry["date"]
                entry["makeup_next_date"] = ""
            else:
                entry["makeup_next_date"] = next_teaching

        teaching_dates = [x["date"] for x in timeline if x["status"] != "HOLIDAY_OFF"]
        eff_start = teaching_dates[0] if teaching_dates else first_occ.isoformat()
        eff_end = teaching_dates[-1] if teaching_dates else ed_raw
        extra_weeks = sum(1 for x in timeline if x["status"] == "HOLIDAY_OFF")

        if monday is None:
            return {
                "visible": True,
                "status": "NORMAL",
                "holiday_name": ", ".join(skipped_names),
                "makeup_next_date": "",
                "shifted_from_date": "",
                "session_number": None,
                "total_sessions": base_sessions,
                "effective_start_date": eff_start,
                "effective_end_date": eff_end,
                "extra_weeks": extra_weeks,
            }

        matched = next((x for x in timeline if x["date"] == target_iso), None)
        if matched is None:
            return {
                "visible": False,
                "status": "OUT_OF_RANGE",
                "holiday_name": "",
                "makeup_next_date": "",
                "shifted_from_date": "",
                "session_number": None,
                "total_sessions": base_sessions,
                "effective_start_date": eff_start,
                "effective_end_date": eff_end,
                "extra_weeks": extra_weeks,
            }
        return {
            "visible": True,
            "status": matched["status"],
            "holiday_name": matched["holiday_name"],
            "makeup_next_date": matched["makeup_next_date"],
            "shifted_from_date": matched["shifted_from_date"],
            "session_number": matched["session_number"],
            "total_sessions": base_sessions,
            "effective_start_date": eff_start,
            "effective_end_date": eff_end,
            "extra_weeks": extra_weeks,
        }

    # Open-ended or single-bound date items
    if monday is not None:
        if sd_raw and target_iso < sd_raw:
            return {
                "visible": False, "status": "OUT_OF_RANGE", "holiday_name": "",
                "makeup_next_date": "", "shifted_from_date": "", "session_number": None,
                "total_sessions": None, "effective_start_date": sd_raw, "effective_end_date": ed_raw, "extra_weeks": 0,
            }
        if ed_raw and target_iso > ed_raw:
            return {
                "visible": False, "status": "OUT_OF_RANGE", "holiday_name": "",
                "makeup_next_date": "", "shifted_from_date": "", "session_number": None,
                "total_sessions": None, "effective_start_date": sd_raw, "effective_end_date": ed_raw, "extra_weeks": 0,
            }
        hit_now = None if is_single_makeup else _find_holiday_on_date(target_iso, holidays)
        if hit_now is not None:
            probe = date.fromisoformat(target_iso) + timedelta(days=7)
            for _ in range(12):
                if _find_holiday_on_date(probe.isoformat(), holidays) is None:
                    break
                probe += timedelta(days=7)
            return {
                "visible": True,
                "status": "HOLIDAY_OFF",
                "holiday_name": hit_now.name,
                "makeup_next_date": probe.isoformat(),
                "shifted_from_date": "",
                "session_number": None,
                "total_sessions": None,
                "effective_start_date": sd_raw,
                "effective_end_date": ed_raw,
                "extra_weeks": 1,
            }
        prev_iso = (date.fromisoformat(target_iso) - timedelta(days=7)).isoformat()
        if not sd_raw or prev_iso >= sd_raw:
            hit_prev = None if is_single_makeup else _find_holiday_on_date(prev_iso, holidays)
            if hit_prev is not None:
                return {
                    "visible": True,
                    "status": "SHIFTED_NEXT_WEEK",
                    "holiday_name": hit_prev.name,
                    "makeup_next_date": "",
                    "shifted_from_date": prev_iso,
                    "session_number": None,
                    "total_sessions": None,
                    "effective_start_date": sd_raw,
                    "effective_end_date": ed_raw,
                    "extra_weeks": 1,
                }

    return {
        "visible": True,
        "status": "NORMAL",
        "holiday_name": "",
        "makeup_next_date": "",
        "shifted_from_date": "",
        "session_number": None,
        "total_sessions": None,
        "effective_start_date": sd_raw,
        "effective_end_date": ed_raw,
        "extra_weeks": 0,
    }


def _resolve_teacher_item_colors(item: dict, rules: list[ColorRule]) -> tuple[str, str]:
    course_up = str(item.get("course") or "").upper()
    inst_up = str(item.get("institution") or "").upper()
    kind_up = str(item.get("kind") or "").upper()
    act_up = str(item.get("activity_type") or "EXTERNAL_TEACHING").upper()
    is_ext = bool(item.get("_is_external"))

    for r in rules:
        key_up = r.key.upper()
        if r.category == "CUSTOM" and key_up and key_up in course_up:
            return _hex(r.bg_color, "F8FAFC"), _hex(r.text_color, "0F172A")
        if is_ext and r.category == "INSTITUTION" and key_up and key_up in inst_up:
            return _hex(r.bg_color, "FEF3C7"), _hex(r.text_color, "713F12")
        if not is_ext and r.category == "KIND" and key_up == kind_up:
            return _hex(r.bg_color, "EFF6FF"), _hex(r.text_color, "1D4ED8")
        if not is_ext and r.category == "PROGRAM" and key_up and key_up in course_up:
            return _hex(r.bg_color, "DBEAFE"), _hex(r.text_color, "1E3A8A")

    if is_ext:
        for r in rules:
            if r.category == "STATUS" and r.key.upper() == act_up:
                return _hex(r.bg_color, "FEF9C3"), _hex(r.text_color, "713F12")
        raw_c = str(item.get("color") or "")
        if raw_c.startswith("#"):
            return _hex(raw_c, "FEF9C3"), "0F172A"
        if act_up == "STUDYING":
            return "DCFCE7", "14532D"
        if act_up == "MAKEUP":
            return "F3E8FF", "581C87"
        return "FEF9C3", "713F12"

    if item.get("evening") or int(item.get("start", 0)) >= 1020:
        for r in rules:
            if r.category == "STATUS" and r.key.upper() == "EVENING":
                return _hex(r.bg_color, "E0F2FE"), _hex(r.text_color, "0C4A6E")
        return "E0F2FE", "0C4A6E"

    for r in rules:
        if r.category == "STATUS" and r.key.upper() == "FACULTY":
            return _hex(r.bg_color, "DBEAFE"), _hex(r.text_color, "1E3A8A")
    return "DBEAFE", "1E3A8A"


def teacher_workbook(
    state: State,
    teacher_id: str,
    include_external: bool = True,
    source: str = "published",
    week_start: str | None = None,
    week_label: str | None = None,
) -> bytes:
    """Export a lecturer's weekly/semester timetable (.xlsx) with HANU shifts, dates, and personal color rules."""
    teacher_obj = next((t for t in state.teachers if t.id == teacher_id), None)
    if teacher_obj is None:
        raise LookupError(f"Không tìm thấy giảng viên: {teacher_id}")

    rules = teacher_obj.color_rules if teacher_obj.color_rules else state.config.color_rules
    course_names = {o.course: o.name for o in state.offerings if o.name}

    base_rows = state.published if source == "published" else events(state, state.draft)[0]
    fac_items = [dict(r, _is_external=False) for r in base_rows if r.get("teacher") == teacher_id]
    ext_items = (
        [dict(e.model_dump(), _is_external=True) for e in state.external if e.teacher == teacher_id]
        if include_external
        else []
    )
    all_items = fac_items + ext_items

    monday: date | None = None
    if week_start and len(week_start) >= 10:
        try:
            monday = date.fromisoformat(week_start[:10])
        except ValueError:
            monday = None

    holidays = state.config.holidays or []
    filtered: list[dict] = []
    for it in all_items:
        occ = _evaluate_holiday_occurrence(it, monday, holidays)
        if occ["visible"]:
            filtered.append({**it, "_occ": occ})
    filtered.sort(key=lambda x: (int(x["day"]), int(x["start"]), str(x.get("id", ""))))

    book = Workbook()
    grid = book.active
    grid.title = f"TKB Tuần - {teacher_id}"[:31]

    title_scope = week_label or (
        f"Tuần từ {_format_vn_date(monday.isoformat())} đến {_format_vn_date((monday + timedelta(days=6)).isoformat())}"
        if monday
        else state.config.term_name
    )
    grid.append([f"THỜI KHÓA BIỂU CÁ NHÂN — {teacher_obj.name} ({teacher_obj.id}) · Bộ môn {teacher_obj.department} · {title_scope}"])

    day_headers = []
    for d in range(2, 9):
        d_label = "Chủ nhật" if d == 8 else f"Thứ {d}"
        if monday is not None:
            d_dt = monday + timedelta(days=d - 2)
            hol = _find_holiday_on_date(d_dt.isoformat(), holidays)
            d_label = f"{d_label} ({d_dt.strftime('%d/%m')})" + (f"\n🎌 {hol.name}" if hol else "")
        day_headers.append(d_label)
    grid.append(["Ca / Tiết", "Khung giờ", *day_headers])

    time_fmt = lambda m: f"{int(m)//60:02d}:{int(m)%60:02d}"
    default_shifts = state.config.shift_rules or []
    shift_bands = [
        (
            f"{s.label}" + (f" ({s.periods_label})" if s.periods_label else ""),
            s.start,
            s.end,
        )
        for s in default_shifts
    ] or [
        ("Ca 1 (Tiết 3 – 4)", 430, 555),
        ("Ca 2 (Tiết 5 – 6)", 570, 695),
        ("Ca 3 (Tiết 7 – 8)", 740, 865),
        ("Ca 4 (Tiết 9 – 10)", 880, 1005),
        ("Ca 5 (Tiết 11 – 12)", 1030, 1155),
        ("Ca 6 (Tiết 13 – 14)", 1170, 1295),
    ]

    thin = Side(border_style="thin", color="CBD5E1")
    cell_border = Border(top=thin, left=thin, right=thin, bottom=thin)

    placed_ids: set[str] = set()
    for band_label, b_start, b_end in shift_bands:
        row_vals = [band_label, f"{time_fmt(b_start)} – {time_fmt(b_end)}"]
        row_styles: list[tuple[str, str] | None] = []
        for d in range(2, 9):
            matched = [
                it for it in filtered
                if int(it["day"]) == d and int(it["start"]) < b_end and b_start < int(it["end"])
            ]
            if matched:
                lines = []
                for it in matched:
                    placed_ids.add(str(it.get("id")))
                    occ = it.get("_occ") or {}
                    occ_status = occ.get("status", "NORMAL")
                    d_txt = "CN" if d == 8 else f"Thứ {d}"
                    occ_note = ""
                    if occ_status == "HOLIDAY_OFF":
                        mk_dt = _format_short_vn(occ.get("makeup_next_date", ""))
                        occ_note = f"\n🎌 NGHỈ LỄ: {occ.get('holiday_name', '')}" + (
                            f" → Học bù {d_txt} tuần sau ({mk_dt})" if mk_dt else ""
                        )
                    elif occ_status in ("SHIFTED_NEXT_WEEK", "MAKEUP_EXTENSION"):
                        occ_note = f"\n🔄 HỌC BÙ LỄ: {occ.get('holiday_name', '')}"

                    if it.get("_is_external"):
                        lines.append(
                            f"[{it.get('institution', 'Ngoài')}] {it.get('course', '')}\n"
                            f"Lớp: {it.get('class_name', '')} · P: {it.get('room') or '-'}\n"
                            f"🕒 {time_fmt(it['start'])}–{time_fmt(it['end'])}{occ_note}"
                        )
                    else:
                        c_code = str(it.get("course") or "")
                        c_name = course_names.get(c_code, "")
                        head_txt = f"{c_name} ({c_code})" if c_name else c_code
                        lines.append(
                            f"{head_txt}\n"
                            f"{it.get('kind', '')} · Nhóm {it.get('section', '')} · P: {it.get('room_id') or '-'}\n"
                            f"🕒 {time_fmt(it['start'])}–{time_fmt(it['end'])}{occ_note}"
                        )
                row_vals.append(safe("\n---\n".join(lines)))
                top_occ = (matched[0].get("_occ") or {}).get("status", "NORMAL")
                if top_occ == "HOLIDAY_OFF":
                    row_styles.append(("FFF1F2", "9F1239"))
                elif top_occ in ("SHIFTED_NEXT_WEEK", "MAKEUP_EXTENSION"):
                    row_styles.append(("F3E8FF", "581C87"))
                else:
                    row_styles.append(_resolve_teacher_item_colors(matched[0], rules))
            else:
                row_vals.append("")
                row_styles.append(None)
        grid.append(row_vals)
        r_idx = grid.max_row
        for c_offset, st_pair in enumerate(row_styles, start=3):
            cell = grid.cell(row=r_idx, column=c_offset)
            cell.border = cell_border
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            if st_pair:
                cell.fill = PatternFill("solid", fgColor=st_pair[0])
                cell.font = Font(color=st_pair[1], bold=True, size=9.5)

    # Sheet 2: Danh sách chi tiết
    detail = book.create_sheet("Danh sách chi tiết")
    detail.append([
        "Nguồn lịch", "Mã lớp / ID", "Mã môn / Hoạt động", "Tên học phần / Đơn vị",
        "Nhóm / Lớp", "Loại", "Thứ", "Bắt đầu", "Kết thúc", "Phòng",
        "Ngày bắt đầu", "Ngày kết thúc (sau bù lễ)", "Ghi chú",
    ])
    act_map = {
        "EXTERNAL_TEACHING": "Dạy trường ngoài",
        "STUDYING": "Đi học / NCS",
        "MAKEUP": "Dạy bù",
        "PERSONAL_BUSY": "Lịch bận cá nhân",
    }
    for it in filtered:
        is_ext = bool(it.get("_is_external"))
        occ = it.get("_occ") or {}
        d_num = int(it["day"])
        d_txt = "Chủ nhật" if d_num == 8 else f"Thứ {d_num}"
        if is_ext:
            src_txt = act_map.get(str(it.get("activity_type") or ""), "Lịch ngoài")
            c_code = str(it.get("course") or "")
            c_title = str(it.get("institution") or "")
            grp = str(it.get("class_name") or "")
            kind_txt = str(it.get("activity_type") or "")
            rm = str(it.get("room") or "")
            base_note = str(it.get("note") or "")
        else:
            src_txt = "Lịch Khoa"
            c_code = str(it.get("course") or "")
            c_title = course_names.get(c_code, f"Bộ môn {it.get('department', '')}")
            grp = f"K{it.get('cohort', '')} - N{it.get('section', '')}"
            kind_txt = str(it.get("kind") or "")
            rm = str(it.get("room_id") or "")
            base_note = ""

        extra_notes = [base_note] if base_note else []
        occ_st = occ.get("status", "NORMAL")
        if occ_st == "HOLIDAY_OFF":
            mk = _format_vn_date(occ.get("makeup_next_date", ""))
            extra_notes.append(f"Nghỉ lễ {occ.get('holiday_name', '')} -> Học bù {d_txt} tuần sau ({mk})")
        elif occ_st in ("SHIFTED_NEXT_WEEK", "MAKEUP_EXTENSION"):
            extra_notes.append(f"Học bù lễ {occ.get('holiday_name', '')}")
        elif occ.get("extra_weeks", 0) > 0:
            extra_notes.append(f"Đã cộng +{occ['extra_weeks']} tuần học bù lễ ({occ.get('holiday_name', '')})")

        eff_sd = occ.get("effective_start_date") or str(it.get("start_date") or "")
        eff_ed = occ.get("effective_end_date") or str(it.get("end_date") or "")
        detail.append([safe(v) for v in [
            src_txt,
            it.get("id", ""),
            c_code,
            c_title,
            grp,
            kind_txt,
            d_txt,
            time_fmt(it["start"]),
            time_fmt(it["end"]),
            rm,
            _format_vn_date(eff_sd),
            _format_vn_date(eff_ed),
            " · ".join(extra_notes),
        ]])

    for cell in grid[2]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="126759")
    grid["A1"].font = Font(bold=True, size=11, color="0F172A")
    for cell in detail[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1E3A8A")

    for sh in (grid, detail):
        for r in sh.iter_rows():
            for cell in r:
                if not cell.alignment.wrap_text:
                    cell.alignment = Alignment(vertical="top", wrap_text=True)
        for col in sh.columns:
            sh.column_dimensions[col[0].column_letter].width = 24
    grid.freeze_panes = "C3"
    detail.freeze_panes = "A2"

    output = BytesIO()
    book.save(output)
    return output.getvalue()
