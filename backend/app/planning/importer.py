"""Parse a bounded workbook preview without mutating workspace state."""
from collections import defaultdict
from datetime import date, timedelta
from io import BytesIO
from math import ceil
import re
from zipfile import ZipFile
from openpyxl import load_workbook
from ..timetable.models import Offering, normalize_iso_date

HANU_COURSE_SUFFIX_DEPT = {
    "ADC": "TTDPT", "AIN": "KHMT", "ATI": "HTTT", "B2B": "TTDPT",
    "CAL": "KHMT", "CCMA": "TTDPT", "CCO": "TTDPT", "CG2": "KHMT",
    "CGR": "KHMT", "COT": "TTDPT", "DBS": "HTTT", "DIM": "TTDPT",
    "DMA": "KHMT", "DSY": "KHMT", "EBU": "HTTT", "EIS": "HTTT",
    "JSD": "CNPM", "MLA": "KHMT", "MRE": "TTDPT", "MUL": "TTDPT",
    "NAD": "KHMT", "NPR": "KHMT", "PCO": "KHMT", "POP": "KHMT",
    "PR1": "CNPM", "PRC": "KHMT", "PRE": "TTDPT", "PRM": "TTDPT",
    "RES": "HTTT", "SAD": "HTTT", "SE1": "CNPM", "SEN": "CNPM",
    "SM1A": "TTDPT", "SPM": "CNPM", "SS1": "CNPM", "WDE": "TTDPT",
    "WPR": "CNPM", "OS1": "HTTT", "GD1": "TTDPT", "AI1": "KHMT",
}


def _infer_program(course_upper: str, raw_prog: str = "") -> str:
    p = raw_prog.strip().upper()
    if p in ("STANDARD", "CLC", "TT"):
        return p
    if "CLC" in course_upper or course_upper.startswith("62FIT"):
        return "CLC"
    if "TT" in course_upper or course_upper.startswith("66FIT"):
        return "TT"
    return "STANDARD"


def _infer_department(course_upper: str, raw_dept: str = "") -> str:
    d = raw_dept.strip()
    if d:
        return d
    suffix = course_upper[6:] if len(course_upper) > 6 else course_upper
    for key in (suffix, suffix.replace("CLC", "").replace("TT", "")):
        if key in HANU_COURSE_SUFFIX_DEPT:
            return HANU_COURSE_SUFFIX_DEPT[key]
    if "MME" in course_upper:
        return "TTDPT"
    return "KHMT"


def _parse_room_kind(val: object) -> str | None:
    s = str(val or "").strip()
    if not s:
        return None
    low = s.lower()
    if "chiếu" in low or "chieu" in low or "projector" in low:
        return "PROJECTOR"
    if "tính" in low or "tinh" in low or "computer" in low or "p.may" in low or "lab" in low:
        return "COMPUTER"
    return s.upper()


def _select_plan_sheet(book):
    if len(book.sheetnames) == 1:
        return book.active
    for name in book.sheetnames:
        norm = name.strip().lower()
        if "kế hoạch mở lớp" in norm or "ke hoach mo lop" in norm or norm in ("kehoachdaotao", "approved plan", "plan"):
            return book[name]
    raise ValueError("Workbook nhiều sheet phải có sheet 'Kế hoạch mở lớp' hoặc chỉ để 1 sheet kế hoạch duy nhất")


def _find_header_row(ws) -> tuple[int, list[str]]:
    for idx, row in enumerate(ws.iter_rows(min_row=1, max_row=10, values_only=True), start=1):
        cells = [str(x).strip() if x is not None else "" for x in row]
        lowered = {c.lower() for c in cells if c}
        if {"id", "course", "students"}.issubset(lowered) or (
            any(k in lowered for k in ("mã môn", "ma mon", "mã học phần", "ma hoc phan"))
            and any(k in lowered for k in ("sĩ số", "si so"))
        ):
            return idx, cells
    first = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), ())
    return 1, [str(x).strip() if x is not None else "" for x in first]


def _mode_int(nums: list[int]) -> int:
    counts: dict[int, int] = {}
    for n in nums:
        counts[n] = counts.get(n, 0) + 1
    return max(counts.items(), key=lambda kv: (kv[1], kv[0]))[0]


def _extract_hanu_sheet_dates(book) -> dict[tuple[str, str], tuple[str, str]]:
    """Extract official HANU base course (start_date, end_date) from Edusoft TKBT1..TKBT70 sheets ('Đại trà', 'CLC', 'TT')."""
    # Default HANU academic year 2026-2027 Week 1 Monday = 2026-08-03 (TKBT3 = 17/08/2026, TKBT15 = 09/11/2026)
    week1_monday = date(2026, 8, 3)
    for name in book.sheetnames:
        if "timetable" in name.lower():
            t_ws = book[name]
            for r in t_ws.iter_rows(min_row=1, max_row=6, values_only=True):
                joined = " ".join(str(x) for x in r if x)
                m_dt = re.search(r"Start time[^:]*:\s*(\d{1,2})/(\d{1,2})/(\d{4})", joined, re.I)
                if m_dt:
                    d0 = date(int(m_dt.group(3)), int(m_dt.group(2)), int(m_dt.group(1)))
                    d0_mon = d0 - timedelta(days=d0.weekday())
                    # In HANU Fall workbook, upper cohorts start at TKBT3
                    week1_monday = d0_mon - timedelta(days=14)
                    break

    spans_by_key: dict[tuple[str, str], list[tuple[int, int]]] = defaultdict(list)
    spans_by_course: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for sh_name in book.sheetnames:
        if sh_name.strip().lower() not in ("đại trà", "dai tra", "clc", "tt"):
            continue
        sh = book[sh_name]
        rows_iter = sh.iter_rows(min_row=2, max_row=600, values_only=True)
        hdr = next(rows_iter, None)
        if not hdr:
            continue
        wk_cols = []
        for idx, val in enumerate(hdr):
            m = re.match(r"TKBT(\d+)", str(val or "").strip(), re.I)
            if m:
                wk_cols.append((idx, int(m.group(1))))
        if not wk_cols:
            continue
        for r in rows_iter:
            if not r or len(r) < 14 or not r[13]:
                continue
            c_code = str(r[13]).strip().upper()
            nhom = str(r[1] or "")
            m_coh = re.search(r"20\d\d", nhom)
            coh = m_coh.group(0) if m_coh else ""
            active = [w for idx, w in wk_cols if idx < len(r) and r[idx] not in (None, "", 0, "0", False)]
            if active:
                entry = (min(active), len(active))
                spans_by_key[(c_code, coh)].append(entry)
                spans_by_course[c_code].append(entry)

    out: dict[tuple[str, str], tuple[str, str]] = {}
    for (c_code, coh), entries in spans_by_key.items():
        lo = min(s for s, _ in entries)
        base_weeks = max(1, _mode_int([cnt for _, cnt in entries]))
        sd = (week1_monday + timedelta(days=(lo - 1) * 7)).isoformat()
        ed = (week1_monday + timedelta(days=(lo + base_weeks - 2) * 7 + 6)).isoformat()
        out[(c_code, coh)] = (sd, ed)
    for c_code, entries in spans_by_course.items():
        if (c_code, "") not in out:
            lo = min(s for s, _ in entries)
            base_weeks = max(1, _mode_int([cnt for _, cnt in entries]))
            sd = (week1_monday + timedelta(days=(lo - 1) * 7)).isoformat()
            ed = (week1_monday + timedelta(days=(lo + base_weeks - 2) * 7 + 6)).isoformat()
            out[(c_code, "")] = (sd, ed)
    if out:
        out[("__HANU_WEEK1__", "")] = (week1_monday.isoformat(), "")
    return out


def _parse_hanu_session_plan_rows(ws, header_row_idx: int, norm_headers: list[str], sheet_dates: dict[tuple[str, str], tuple[str, str]] | None = None) -> dict:
    """Aggregate HANU raw 'Kế hoạch mở lớp' session rows (e.g. FIT Time table Fall2026 V5.2.xlsx) into Offering records."""
    groups: dict[tuple[str, str], list[tuple[int, dict]]] = defaultdict(list)
    errors = []
    for row_num, values in enumerate(ws.iter_rows(min_row=header_row_idx + 1, values_only=True), start=header_row_idx + 1):
        if row_num > 3000:
            raise ValueError("Plan limit exceeded")
        if all(v is None or str(v).strip() == "" for v in values):
            continue
        rec = dict(zip(norm_headers, values))
        raw_course = str(rec.get("course") or "").strip()
        if not raw_course:
            continue
        c_up = raw_course.upper()
        cohort_val = rec.get("cohort")
        try:
            cohort = str(int(float(cohort_val))) if cohort_val is not None and str(cohort_val).strip() != "" else ""
            students = int(float(rec.get("students") or 0))
            classes = int(float(rec.get("class_count") or 1))
            periods = float(rec.get("periods") or 2)
        except Exception as exc:
            errors.append({"row": row_num, "message": str(exc)})
            continue
        room_kind = _parse_room_kind(rec.get("room_text")) or "PROJECTOR"
        groups[(c_up, cohort)].append((
            row_num,
            {
                "name": str(rec.get("name") or "").strip(),
                "department": str(rec.get("department") or "").strip(),
                "program": str(rec.get("program") or "").strip(),
                "students": students,
                "classes": max(1, classes),
                "periods": periods,
                "room": room_kind,
                "start_date": normalize_iso_date(rec.get("start_date")),
                "end_date": normalize_iso_date(rec.get("end_date")),
            },
        ))

    offerings = []
    for (c_up, cohort), items in groups.items():
        first_row_num, first = items[0]
        try:
            prog = _infer_program(c_up, first["program"])
            dept = _infer_department(c_up, first["department"])
            explicit_sd = next((it["start_date"] for _, it in items if it.get("start_date")), "")
            explicit_ed = next((it["end_date"] for _, it in items if it.get("end_date")), "")
            inferred_sd, inferred_ed = ("", "")
            if sheet_dates:
                inferred_sd, inferred_ed = sheet_dates.get((c_up, cohort)) or sheet_dates.get((c_up, "")) or ("", "")
                if not inferred_sd and ("__HANU_WEEK1__", "") in sheet_dates:
                    w1 = date.fromisoformat(sheet_dates[("__HANU_WEEK1__", "")][0])
                    start_wk = 6 if cohort == "2025" else 3
                    inferred_sd = (w1 + timedelta(days=(start_wk - 1) * 7)).isoformat()
                    inferred_ed = (w1 + timedelta(days=(start_wk + 12 - 2) * 7 + 6)).isoformat()
            final_sd = explicit_sd or inferred_sd
            final_ed = explicit_ed or inferred_ed
            expanded = []
            for _, it in items:
                for _ in range(it["classes"]):
                    expanded.append(it)

            if all(it["periods"] >= 4 for it in expanded):
                # Combined Lec+Tut session (4 periods = 2 Lec + 2 Tut)
                half = expanded[0]["periods"] / 2.0
                tut_room = expanded[0]["room"]
                tc = len(expanded)
                total_students = sum(it["students"] for it in expanded)
                record = {
                    "id": f"{c_up}-{cohort}",
                    "course": c_up,
                    "name": first["name"],
                    "cohort": cohort,
                    "department": dept,
                    "students": total_students,
                    "lecture_periods": half,
                    "tutorial_periods": half,
                    "room": tut_room,
                    "program": prog,
                    "combined": True,
                    "lecture_room": None,
                    "tutorial_room": tut_room,
                    "lecture_count": None,
                    "tutorial_count": tc if prog in ("CLC", "TT") else None,
                    "required_equipment": [],
                    "required_room_type": None,
                }
            elif prog in ("CLC", "TT"):
                n = len(expanded)
                if n == 1:
                    only = expanded[0]
                    is_tut_only = only["room"] == "COMPUTER"
                    record = {
                        "id": f"{c_up}-{cohort}",
                        "course": c_up,
                        "name": first["name"],
                        "cohort": cohort,
                        "department": dept,
                        "students": max(40, only["students"]) if only["students"] == 30 else only["students"],
                        "lecture_periods": 0.0 if is_tut_only else only["periods"],
                        "tutorial_periods": only["periods"] if is_tut_only else 0.0,
                        "room": only["room"],
                        "program": prog,
                        "combined": False,
                        "lecture_room": None if is_tut_only else only["room"],
                        "tutorial_room": only["room"] if is_tut_only else None,
                        "lecture_count": None if is_tut_only else 1,
                        "tutorial_count": 1 if is_tut_only else None,
                        "required_equipment": [],
                        "required_room_type": None,
                    }
                elif n % 2 == 1 and len({it["room"] for it in expanded}) == 1 and expanded[0]["room"] == "PROJECTOR":
                    # Lecture-only multi-group TT/CLC course (e.g. 66FIT2RES: 3 lecture groups)
                    record = {
                        "id": f"{c_up}-{cohort}",
                        "course": c_up,
                        "name": first["name"],
                        "cohort": cohort,
                        "department": dept,
                        "students": n * 40,
                        "lecture_periods": expanded[0]["periods"],
                        "tutorial_periods": 0.0,
                        "room": "PROJECTOR",
                        "program": prog,
                        "combined": False,
                        "lecture_room": "PROJECTOR",
                        "tutorial_room": None,
                        "lecture_count": n,
                        "tutorial_count": None,
                        "required_equipment": [],
                        "required_room_type": None,
                    }
                else:
                    groups_k = max(1, n // 2)
                    lec_rooms = [it["room"] for it in expanded if it["room"] == "PROJECTOR"]
                    tut_rooms = [it["room"] for it in expanded if it["room"] == "COMPUTER"]
                    l_room = lec_rooms[0] if lec_rooms else expanded[0]["room"]
                    t_room = tut_rooms[0] if tut_rooms else expanded[-1]["room"]
                    record = {
                        "id": f"{c_up}-{cohort}",
                        "course": c_up,
                        "name": first["name"],
                        "cohort": cohort,
                        "department": dept,
                        "students": groups_k * 40,
                        "lecture_periods": expanded[0]["periods"],
                        "tutorial_periods": expanded[-1]["periods"],
                        "room": l_room,
                        "program": prog,
                        "combined": False,
                        "lecture_room": l_room,
                        "tutorial_room": t_room,
                        "lecture_count": groups_k,
                        "tutorial_count": groups_k,
                        "required_equipment": [],
                        "required_room_type": None,
                    }
            else:
                # STANDARD (Đại trà: 61FIT / 61MME)
                lec_rows = [it for it in expanded if it["students"] >= 60]
                tut_rows = [it for it in expanded if it["students"] < 60]
                if not lec_rows and tut_rows:
                    lec_rows = [tut_rows[0]]
                    tut_rows = tut_rows[1:]
                lc = len(lec_rows)
                tc = len(tut_rows)
                lec_p = lec_rows[0]["periods"] if lec_rows else 0.0
                tut_p = tut_rows[0]["periods"] if tut_rows else 0.0
                l_room = lec_rows[0]["room"] if lec_rows else None
                t_room = Counter_mode([it["room"] for it in tut_rows]) if tut_rows else None
                if tc == 0:
                    total_students = sum(it["students"] for it in lec_rows)
                elif lc > 1:
                    total_students = max(tc * 30, sum(it["students"] for it in lec_rows))
                else:
                    total_students = tc * 30
                expected_lc = ceil(total_students / 200) if lec_p else None
                expected_tc = ceil(total_students / 30) if tut_p else None
                record = {
                    "id": f"{c_up}-{cohort}",
                    "course": c_up,
                    "name": first["name"],
                    "cohort": cohort,
                    "department": dept,
                    "students": total_students,
                    "lecture_periods": lec_p,
                    "tutorial_periods": tut_p,
                    "room": l_room or t_room or "PROJECTOR",
                    "program": prog,
                    "combined": False,
                    "lecture_room": l_room,
                    "tutorial_room": t_room,
                    "lecture_count": lc if (lec_p and lc != expected_lc) else None,
                    "tutorial_count": tc if (tut_p and tc != expected_tc) else None,
                    "required_equipment": [],
                    "required_room_type": None,
                }
            record["start_date"] = final_sd
            record["end_date"] = final_ed
            offerings.append(Offering.model_validate(record).model_dump())
        except Exception as exc:
            errors.append({"row": first_row_num, "message": str(exc)})
    return {"offerings": offerings, "errors": errors, "can_import": bool(offerings) and not errors}


def Counter_mode(items: list[str]) -> str | None:
    if not items:
        return None
    counts: dict[str, int] = {}
    for x in items:
        counts[x] = counts.get(x, 0) + 1
    return max(counts, key=counts.get)


def preview_workbook(raw: bytes):
    with ZipFile(BytesIO(raw)) as archive:
        if sum(info.file_size for info in archive.infolist()) > 25_000_000:
            raise ValueError("Expanded workbook limit is 25 MB")
    book = load_workbook(BytesIO(raw), read_only=True, data_only=True)
    ws = _select_plan_sheet(book)
    if ws.max_column and ws.max_column > 60:
        book.close()
        raise ValueError("Workbook has too many columns")

    header_row_idx, raw_headers = _find_header_row(ws)
    required_en = {"id", "course", "name", "cohort", "department", "students", "lecture_periods", "tutorial_periods", "room", "program"}
    non_empty_headers = [h for h in raw_headers if h]
    is_canonical = (
        required_en.issubset(raw_headers)
        and not (set(non_empty_headers) - set(Offering.model_fields))
        and len(set(non_empty_headers)) == len(non_empty_headers)
    )

    vn_map = {
        "mã môn": "course", "ma mon": "course", "mã học phần": "course", "ma hoc phan": "course",
        "tên học phần": "name", "ten hoc phan": "name", "tên môn": "name", "ten mon": "name",
        "khóa": "cohort", "khoa": "cohort",
        "bộ môn": "department", "bo mon": "department",
        "sĩ số": "students", "si so": "students",
        "số tiết lec": "lecture_periods", "so tiet lec": "lecture_periods", "tiết lec": "lecture_periods", "tiet lec": "lecture_periods",
        "số tiết tut": "tutorial_periods", "so tiet tut": "tutorial_periods", "tiết tut": "tutorial_periods", "tiet tut": "tutorial_periods",
        "lec+tut liền": "combined", "lec+tut lien": "combined", "liền": "combined",
        "phòng lec": "lecture_room", "phong lec": "lecture_room",
        "phòng tut": "tutorial_room", "phong tut": "tutorial_room",
        "số lớp lec": "lecture_count", "so lop lec": "lecture_count",
        "số lớp tut": "tutorial_count", "so lop tut": "tutorial_count",
        "hệ đào tạo": "program", "he dao tao": "program", "hệ": "program",
        "ngày bắt đầu": "start_date", "ngay bat dau": "start_date",
        "thời gian bắt đầu": "start_date", "thoi gian bat dau": "start_date", "từ ngày": "start_date",
        "ngày kết thúc": "end_date", "ngay ket thuc": "end_date",
        "thời gian kết thúc": "end_date", "thoi gian ket thuc": "end_date", "đến ngày": "end_date",
        # Raw HANU 'Kế hoạch mở lớp' session-row columns (e.g. FIT Time table Fall2026 V5.2.xlsx)
        "số lớp mở": "class_count", "so lop mo": "class_count",
        "số tiết": "periods", "so tiet": "periods",
        "tính chất phòng học": "room_text", "tinh chat phong hoc": "room_text",
    }
    norm_headers = [vn_map.get(h.lower().strip(), h) for h in raw_headers]
    required_vn = {"course", "name", "cohort", "department", "students", "lecture_periods", "tutorial_periods"}
    is_vn = required_vn.issubset(norm_headers)
    is_hanu_session_sheet = {"course", "name", "cohort", "students", "periods", "room_text"}.issubset(norm_headers) and not is_vn

    if is_hanu_session_sheet:
        sheet_dates = _extract_hanu_sheet_dates(book)
        result = _parse_hanu_session_plan_rows(ws, header_row_idx, norm_headers, sheet_dates=sheet_dates)
        book.close()
        return result

    if not is_canonical and not is_vn:
        book.close()
        raise ValueError("Required exact headers: " + ", ".join(Offering.model_fields))

    active_headers = raw_headers if is_canonical else norm_headers
    offerings, errors = [], []
    for number, values in enumerate(ws.iter_rows(min_row=header_row_idx + 1, values_only=True), start=header_row_idx + 1):
        if number > 2001:
            book.close()
            raise ValueError("Plan limit is 2000 rows")
        if all(v is None for v in values):
            continue
        try:
            record = {k: v for k, v in zip(active_headers, values) if k}
            if is_vn:
                c = str(record.get("course") or "").strip()
                if not c:
                    continue
                cohort_val = record.get("cohort")
                cohort = str(int(cohort_val)) if isinstance(cohort_val, (int, float)) else str(cohort_val or "").strip()
                c_up = c.upper()
                prog = _infer_program(c_up, str(record.get("program") or ""))
                students = int(record.get("students") or 0)
                lec = float(record.get("lecture_periods") or 0)
                tut = float(record.get("tutorial_periods") or 0)
                comb_raw = record.get("combined")
                combined = bool(comb_raw and str(comb_raw).strip().lower() in ("x", "1", "true", "có", "co")) if comb_raw is not None and str(comb_raw).strip() != "" else False

                lr_parsed = _parse_room_kind(record.get("lecture_room"))
                tr_parsed = _parse_room_kind(record.get("tutorial_room"))
                lecture_room = lr_parsed if lr_parsed is not None else ("PROJECTOR" if (lec and not combined) else None)
                tutorial_room = tr_parsed if tr_parsed is not None else ("COMPUTER" if tut else None)

                lc_raw = record.get("lecture_count")
                tc_raw = record.get("tutorial_count")
                advanced = prog in ("CLC", "TT")
                lecture_count = int(lc_raw) if lc_raw not in (None, "") else (ceil(students / 40) if advanced and lec and not combined else None)
                tutorial_count = int(tc_raw) if tc_raw not in (None, "") else (ceil(students / 40) if advanced and tut else None)

                record["course"] = c
                record["cohort"] = cohort
                record["id"] = record.get("id") or f"{c}-{cohort}"
                record["program"] = prog
                record["combined"] = combined
                record["lecture_room"] = lecture_room
                record["tutorial_room"] = tutorial_room
                record["room"] = record.get("room") or (tutorial_room if (combined or not lec) else lecture_room) or "PROJECTOR"
                record["students"] = students
                record["lecture_periods"] = lec
                record["tutorial_periods"] = tut
                record["lecture_count"] = lecture_count
                record["tutorial_count"] = tutorial_count
                record["required_equipment"] = []
                record["required_room_type"] = None
                record["start_date"] = normalize_iso_date(record.get("start_date"))
                record["end_date"] = normalize_iso_date(record.get("end_date"))

            if record.get("name") is None:
                record["name"] = ""
            if "required_equipment" in record and isinstance(record["required_equipment"], str):
                record["required_equipment"] = [v.strip() for v in record["required_equipment"].split(",") if v.strip()]
            record["start_date"] = normalize_iso_date(record.get("start_date"))
            record["end_date"] = normalize_iso_date(record.get("end_date"))
            offerings.append(Offering.model_validate(record).model_dump())
        except Exception as exc:
            errors.append({"row": number, "message": str(exc)})
    book.close()
    return {"offerings": offerings, "errors": errors, "can_import": bool(offerings) and not errors}
