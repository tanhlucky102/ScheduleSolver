"""Lossless, source-addressed extraction; no guessing enrollment, session kind or room inventory."""
import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path
from openpyxl import load_workbook, Workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources"
OUT = ROOT / "data" / "fall2026"


def extract():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {str(p.relative_to(SOURCE)): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(SOURCE.rglob("*")) if p.is_file()}
    (OUT / "resource_sha256.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    path = SOURCE / "FIT Time table Fall2026 V5.2.xlsx"
    book = load_workbook(path, data_only=True)
    formula_book = load_workbook(path, data_only=False)
    # Exact source cells, including separate revision sheets. Never merge revisions by guess.
    cells = {}
    for sheet in formula_book:
        cached = book[sheet.title]
        cells[sheet.title] = [{"cell": c.coordinate, "value": c.value,
                              "cached": cached[c.coordinate].value}
                             for row in sheet for c in row if c.value is not None]
    (OUT / "workbook_cells.json").write_text(json.dumps(cells, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    sheet = book["Kế hoạch mở lớp "]
    records = []
    groups = defaultdict(list)
    for row in sheet.iter_rows(min_row=4):
        if row[1].value is None:
            continue
        r = {"source_sheet": sheet.title, "source_row": row[0].row,
             "sequence": row[0].value, "course": row[1].value, "name": row[2].value,
             "students_in_source_row": row[3].value, "cohort": row[4].value,
             "classes_in_source_row": row[5].value, "start_period": row[6].value,
             "periods": row[7].value, "unlabelled_column_I": row[8].value,
             **{"day_" + str(i+2): row[i+9].value for i in range(7)},
             "room_requirement_text": row[16].value, "start_date": row[17].value,
             "end_date": row[18].value, "rooms_needed_in_source": row[19].value}
        records.append(r)
        groups[str(r["course"]), str(r["cohort"])].append(r)
    with (OUT / "plan_source_rows.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(records[0]))
        writer.writeheader(); writer.writerows(records)
    review = Workbook()
    ws = review.active; ws.title = "Source rows"
    ws.append(list(records[0]))
    for r in records:
        ws.append([r[k] for k in records[0]])
    summary = []
    ws = review.create_sheet("Review offerings")
    ws.append(["course", "cohort", "names", "source_rows", "observed_students", "observed_periods",
               "department_CONFIRM", "enrollment_CONFIRM", "lecture_periods_CONFIRM",
               "tutorial_periods_CONFIRM", "program_CONFIRM", "room_by_kind_CONFIRM"])
    for (course, cohort), rows in sorted(groups.items()):
        item = {"course": course, "cohort": cohort,
                "names": sorted({str(r["name"]) for r in rows}),
                "source_rows": [r["source_row"] for r in rows],
                "observed_students": sorted({str(r["students_in_source_row"]) for r in rows}),
                "observed_periods": sorted({str(r["periods"]) for r in rows}),
                "unresolved": ["department", "enrollment_without_double_counting", "lecture_vs_tutorial_periods",
                               "program", "per_kind_room_requirements"]}
        summary.append(item)
        ws.append([course, cohort, " | ".join(item["names"]), ",".join(map(str,item["source_rows"])),
                   ",".join(item["observed_students"]), ",".join(item["observed_periods"])])
    review.save(OUT / "plan_review.xlsx")
    (OUT / "offering_review.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    structured = {}
    for sheet in book:
        if sheet.max_column != 84:
            continue
        headers = [c.value for c in sheet[2]]
        structured[sheet.title] = [{"source_row": n, "fields": dict(zip(headers, row))}
                                  for n, row in enumerate(sheet.iter_rows(min_row=3, values_only=True), 3)
                                  if row[13] is not None]
    (OUT / "timetable_reference.json").write_text(json.dumps(structured, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    def read_csv(name):
        with (SOURCE / name).open(encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))
    departments = [{"id": r["ma_bm"], "name": r["ten_bm"]} for r in read_csv("bo_mon.csv")]
    teachers = [{"id": r["ma_gv"], "name": r["ho_ten"] or r["ma_gv"],
                 "department": r["bo_mon"], "assistant": r["tro_giang"].strip().lower()=="x",
                 "capabilities": {}} for r in read_csv("giang_vien.csv")]
    indexed = {t["id"]: t for t in teachers}
    for r in read_csv("quy_uoc_phan_cong.csv"):
        indexed[r["ma_gv"]]["capabilities"][r["ma_mon"]] = [kind for field, kind in
            [("day_lec","LEC"),("day_tut","TUT")] if r[field].strip().lower()=="x"]
    (OUT / "catalog_seed.json").write_text(json.dumps({"departments": departments, "teachers": teachers}, ensure_ascii=False, indent=2), encoding="utf-8")
    result = {"plan_rows": len(records), "course_cohort_groups": len(summary),
              "reference_rows_by_sheet": {k: len(v) for k,v in structured.items()},
              "room_inventory": "Requires staff declaration; source capacity/equipment/availability not inferred",
              "accounts": "Original CSV preserved only; no legacy password import"}
    (OUT / "extraction_report.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))
    book.close(); formula_book.close()
    return result


if __name__ == "__main__":
    extract()
