"""Convert the user-approved 67-row plan, without inspecting the reference timetable."""
import csv
import json
from pathlib import Path
import sys
from math import ceil
from openpyxl import load_workbook, Workbook
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"backend"))
from app.domain import Offering, State, split
ROOMS={"Phòng máy chiếu":"PROJECTOR","Phòng máy tính":"COMPUTER","":None}
PREFIX={"61FIT":"STANDARD","61MME":"STANDARD","62FIT":"CLC","66FIT":"TT"}
OUT=ROOT/"data/fall2026"


def convert():
    book=load_workbook(ROOT/"resources/ke_hoach_mo_lop_HK1_2026.xlsx",data_only=True)
    records=[]; provenance=[]
    for number,row in enumerate(book.active.iter_rows(min_row=2,values_only=True),2):
        course,name,cohort,department,students,lec,tut,flag,lr,tr,lc,tc=row
        if not course:
            continue
        program=next((v for k,v in PREFIX.items() if course.startswith(k)),None)
        if program is None or flag not in ("",None,"x"):
            raise ValueError(f"Unknown program/combined flag at row {number}")
        combined=flag=="x"
        # Advanced class sizes from original Program.java; standard defaults retained from current domain.
        advanced=program in ("CLC","TT")
        lecture_count=int(lc) if lc is not None else (ceil(students/40) if advanced and lec and not combined else None)
        tutorial_count=int(tc) if tc is not None else (ceil(students/40) if advanced and tut else None)
        lecture_room=ROOMS[lr or ""]; tutorial_room=ROOMS[tr or ""]
        if (lec and not combined and not lecture_room) or (tut and not tutorial_room):
            raise ValueError(f"Missing room requirement at row {number}")
        record=Offering(id=f"{course}-{int(cohort)}",course=course,name=name,cohort=str(int(cohort)),
            department=department,students=int(students),lecture_periods=int(lec),tutorial_periods=int(tut),
            room=tutorial_room if combined or not lec else lecture_room, program=program,
            combined=combined,lecture_room=lecture_room,tutorial_room=tutorial_room,
            lecture_count=lecture_count,tutorial_count=tutorial_count)
        records.append(record.model_dump())
        provenance.append({"id":record.id,"source_sheet":book.active.title,"source_row":number,
            "custom_counts_in_source":[lc,tc],
            "count_policy":"explicit source counts take precedence; advanced default 40 per original Program.java; standard uses existing Python defaults",
            "program_evidence":"ScheduleSolver_main/model/Program.java",
            "combined_source":flag})
    catalog=json.loads((OUT/"catalog_seed.json").read_text())
    state=State.model_validate({**catalog,"offerings":records,"sessions":[s.model_dump() for r in records for s in split(Offering.model_validate(r))]})
    assert len(records)==67
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"approved_plan.json").write_text(json.dumps({"offerings":records},ensure_ascii=False,indent=2),encoding="utf-8")
    (OUT/"approved_plan_provenance.json").write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding="utf-8")
    output=Workbook(); ws=output.active; ws.title="Approved plan"
    headers=list(Offering.model_fields)
    ws.append(headers)
    for record in records:
        ws.append([",".join(record[k]) if isinstance(record[k],list) else record[k] for k in headers])
    output.save(OUT/"approved_plan.xlsx")
    (OUT/"approved_sessions.json").write_text(json.dumps([s.model_dump() for s in state.sessions],ensure_ascii=False,indent=2),encoding="utf-8")
    report={"offerings":len(records),"sessions":len(state.sessions),"combined_offerings":sum(r["combined"] for r in records),
            "programs":{p:sum(r["program"]==p for r in records) for p in set(r["program"] for r in records)},
            "rooms_declared":0,"source":"ke_hoach_mo_lop_HK1_2026.xlsx","approved_by_user":True}
    (OUT/"approved_plan_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    book.close()
    print(json.dumps(report))
    return records


if __name__=="__main__":
    convert()
