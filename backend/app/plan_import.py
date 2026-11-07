"""Parse a bounded workbook preview without mutating workspace state."""
from io import BytesIO
from zipfile import ZipFile
from openpyxl import load_workbook
from .domain_models import Offering


def preview_workbook(raw: bytes):
    with ZipFile(BytesIO(raw)) as archive:
        if sum(info.file_size for info in archive.infolist()) > 25_000_000:
            raise ValueError("Expanded workbook limit is 25 MB")
    book = load_workbook(BytesIO(raw), read_only=True, data_only=True)
    if book.active.max_column > 60:
        raise ValueError("Workbook has too many columns")
    if len(book.sheetnames) != 1:
        raise ValueError("Use a workbook with one explicitly selected plan sheet")
    rows = book.active.iter_rows(values_only=True)
    raw_headers = [str(x).strip() if x is not None else "" for x in next(rows)]
    required_en = {"id","course","name","cohort","department","students","lecture_periods","tutorial_periods","room","program"}
    is_canonical = required_en.issubset(raw_headers) and not (set(raw_headers) - set(Offering.model_fields)) and len(set(raw_headers)) == len(raw_headers)

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
    }
    norm_headers = [vn_map.get(h.lower().strip(), h) for h in raw_headers]
    required_vn = {"course", "name", "cohort", "department", "students", "lecture_periods", "tutorial_periods"}
    is_vn = required_vn.issubset(norm_headers)

    if not is_canonical and not is_vn:
        raise ValueError("Required exact headers: " + ", ".join(Offering.model_fields))

    active_headers = raw_headers if is_canonical else norm_headers
    offerings, errors = [], []
    for number, values in enumerate(rows, start=2):
        if number > 2001:
            raise ValueError("Plan limit is 2000 rows")
        if all(v is None for v in values):
            continue
        try:
            record = dict(zip(active_headers, values))
            if is_vn:
                c = str(record.get("course") or "").strip()
                if not c:
                    continue
                cohort_val = record.get("cohort")
                cohort = str(int(cohort_val)) if isinstance(cohort_val, (int, float)) else str(cohort_val or "").strip()
                record["course"] = c
                record["cohort"] = cohort
                record["id"] = record.get("id") or f"{c}-{cohort}"
                record["program"] = record.get("program") or ("CLC" if "CLC" in c else ("TT" if "TT" in c else "STANDARD"))

                comb = record.get("combined")
                record["combined"] = bool(comb and str(comb).strip().lower() in ("x", "1", "true", "có", "co")) if comb is not None and str(comb).strip() != "" else False

                lr = str(record.get("lecture_room") or "").strip()
                record["lecture_room"] = "PROJECTOR" if ("chiếu" in lr.lower() or "projector" in lr.lower()) else ("COMPUTER" if "tính" in lr.lower() else (lr or "PROJECTOR"))

                tr = str(record.get("tutorial_room") or "").strip()
                record["tutorial_room"] = "COMPUTER" if ("tính" in tr.lower() or "computer" in tr.lower()) else ("PROJECTOR" if "chiếu" in tr.lower() else (tr or "COMPUTER"))

                record["room"] = record.get("room") or record["lecture_room"]
                record["students"] = int(record.get("students") or 0)
                record["lecture_periods"] = int(record.get("lecture_periods") or 0)
                record["tutorial_periods"] = int(record.get("tutorial_periods") or 0)
                record["lecture_count"] = int(record["lecture_count"]) if record.get("lecture_count") else None
                record["tutorial_count"] = int(record["tutorial_count"]) if record.get("tutorial_count") else None
                record["required_equipment"] = []
                record["required_room_type"] = None

            if record.get("name") is None:
                record["name"] = ""
            if "required_equipment" in record and isinstance(record["required_equipment"], str):
                record["required_equipment"] = [v.strip() for v in record["required_equipment"].split(",") if v.strip()]
            offerings.append(Offering.model_validate(record).model_dump())
        except Exception as exc:
            errors.append({"row": number, "message": str(exc)})
    book.close()
    return {"offerings": offerings, "errors": errors, "can_import": bool(offerings) and not errors}
