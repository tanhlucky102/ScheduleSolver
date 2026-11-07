from copy import deepcopy
from io import BytesIO
import json
import os
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import Field, ValidationError
from typing import Literal

from .auth import Principal, principal, staff, head
from .domain import (Model, State, Config, Department, Teacher, Offering, Placement,
    External, Room, Reservation, Slot, SchedulingConflict, room_errors, split, eligible, assignment_errors, solve, evaluate, publish, add_external)
from .models import AuditLog, Publication
from . import storage

app = FastAPI(title="ScheduleSolver Web API", version="1.0.0")
app.add_middleware(CORSMiddleware,
    allow_origins=os.environ.get("FRONTEND_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])


@app.exception_handler(SchedulingConflict)
async def scheduling_error(request, exc):
    return JSONResponse(status_code=409, content={"detail": str(exc), "status": exc.status, "violations": exc.violations})


@app.exception_handler(ValueError)
async def domain_error(request, exc):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(LookupError)
async def missing(request, exc):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


class Command(Model):
    revision: int = Field(ge=0)
    payload: dict = Field(default_factory=dict)


class Catalog(Model):
    departments: list[Department]
    teachers: list[Teacher]


class Assign(Model):
    session: str
    teacher: str


class TeacherUpdate(Model):
    teacher: str
    assistant: bool
    capabilities: dict[str, list[str]]


class Return(Model):
    note: str = Field(min_length=1, max_length=1000)


class Run(Model):
    iterations: int = Field(default=500, ge=1, le=5000)
    seed: int = 42


def identity_valid(p, state):
    if p.role in ("HEAD", "TEACHER"):
        t = next((t for t in state.teachers if t.id == p.teacher), None)
        if t is None or (p.role == "HEAD" and t.department != p.department):
            raise HTTPException(403, "Profile must reference a real teacher in its department")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/me")
def me(p: Principal = Depends(principal)):
    return p.model_dump()


def visible(state, revision, p):
    identity_valid(p, state)
    if p.role == "STAFF":
        body = state.model_dump()
        body.pop("external")
        return {"has_publication": bool(state.published), "revision": revision, "state": body, "evaluation": evaluate(state, state.draft)}
    if p.role == "HEAD":
        body = state.model_dump()
        for key in ("departments", "teachers"):
            body[key] = [x for x in body[key] if x.get("department", x.get("id")) == p.department]
        body["sessions"] = [x for x in body["sessions"] if x["department"] == p.department]
        body["offerings"] = [x for x in body["offerings"] if x["department"] == p.department]
        body["draft"] = []
        body["published"] = [r for r in body["published"] if r["teacher"] == p.teacher]
        body["external"] = [r for r in body["external"] if r["teacher"] == p.teacher]
        return {"has_publication": bool(state.published), "revision": revision, "state": body}
    return {"has_publication": bool(state.published), "revision": revision, "state": {
        "published": [r for r in state.published if r["teacher"] == p.teacher],
        "external": [r.model_dump() for r in state.external if r.teacher == p.teacher]}}


@app.get("/api/workspace")
def workspace(p: Principal = Depends(principal)):
    state, revision = storage.read(p.workspace_id)
    return visible(state, revision, p)


def apply(state, action, data, p):
    identity_valid(p, state)
    # Staff mutations always require an explicit role check.
    if action in (
        "catalog", "config", "offerings", "plan-reset", "send", "send-all", "return", "solve", "placement", "publish",
        "rooms", "rooms-delete", "reservation", "reservation-delete", "requirements", "published-room",
        "department-save", "department-delete", "teacher-save", "teacher-delete", "rooms-preset"
    ):
        staff(p)
    if action == "catalog":
        catalog = Catalog.model_validate(data)
        if state.offerings or state.sessions:
            new_dept_ids = {d.id for d in catalog.departments}
            new_teacher_ids = {t.id for t in catalog.teachers}
            for s in state.sessions:
                if s.department not in new_dept_ids:
                    raise ValueError(f"Không thể xóa bộ môn '{s.department}' đang có lớp học phần trực thuộc")
            for t in catalog.teachers:
                if t.department not in new_dept_ids:
                    raise ValueError(f"Giảng viên '{t.name or t.id}' thuộc bộ môn không tồn tại '{t.department}'")
            for s in state.sessions:
                if s.teacher and s.teacher not in new_teacher_ids:
                    raise ValueError(f"Không thể xóa giảng viên '{s.teacher}' đang được phân công phụ trách lớp học phần")
            for ev in state.published:
                if ev.get("teacher") and ev.get("teacher") not in new_teacher_ids:
                    raise ValueError(f"Không thể xóa giảng viên '{ev['teacher']}' đang có lịch đã công bố")
            dept_map = {d.id: d for d in state.departments}
            for d in catalog.departments:
                if d.id in dept_map:
                    d.status = dept_map[d.id].status
                    d.note = dept_map[d.id].note
                else:
                    d.status = "UNSENT"
                    d.note = ""
        else:
            if any(d.status != "UNSENT" or d.note for d in catalog.departments):
                raise ValueError("New departments must be unsent")
        seed_caps = {}
        seed_path = Path(__file__).resolve().parents[2] / "data/fall2026/catalog_seed.json"
        if seed_path.exists():
            try:
                seed_caps = {t["id"]: t.get("capabilities", {}) for t in json.loads(seed_path.read_text(encoding="utf-8")).get("teachers", [])}
            except Exception:
                pass
        for t in catalog.teachers:
            if not t.capabilities:
                existing = next((et for et in state.teachers if et.id == t.id), None)
                if existing and existing.capabilities:
                    t.capabilities = existing.capabilities
                elif t.id in seed_caps:
                    t.capabilities = seed_caps[t.id]
        state.departments, state.teachers = catalog.departments, catalog.teachers
    elif action == "department-save":
        dept_id = str(data.get("id", "")).strip()
        name = str(data.get("name", "")).strip()
        if not dept_id:
            raise ValueError("Mã bộ môn không được để trống")
        existing = next((d for d in state.departments if d.id == dept_id), None)
        if existing:
            existing.name = name or existing.name
        else:
            state.departments.append(Department(id=dept_id, name=name or dept_id, status="UNSENT", note=""))
    elif action == "department-delete":
        dept_id = str(data.get("id", "")).strip()
        target = next((d for d in state.departments if d.id == dept_id), None)
        if not target:
            raise ValueError(f"Không tìm thấy bộ môn {dept_id}")
        if any(t.department == dept_id for t in state.teachers):
            raise ValueError(f"Không thể xóa bộ môn '{dept_id}' vì vẫn còn giảng viên trực thuộc")
        if any(s.department == dept_id for s in state.sessions):
            raise ValueError(f"Không thể xóa bộ môn '{dept_id}' vì đang có lớp học phần trực thuộc")
        state.departments = [d for d in state.departments if d.id != dept_id]
    elif action == "teacher-save":
        teacher_id = str(data.get("id", "")).strip()
        name = str(data.get("name", "")).strip()
        department = str(data.get("department", "")).strip()
        assistant = bool(data.get("assistant", False))
        capabilities = data.get("capabilities", {})
        if not teacher_id:
            raise ValueError("Mã giảng viên không được để trống")
        if not department or not any(d.id == department for d in state.departments):
            raise ValueError(f"Bộ môn '{department}' không tồn tại")
        existing = next((t for t in state.teachers if t.id == teacher_id), None)
        seed_caps = {}
        seed_path = Path(__file__).resolve().parents[2] / "data/fall2026/catalog_seed.json"
        if seed_path.exists():
            try:
                seed_caps = {t["id"]: t.get("capabilities", {}) for t in json.loads(seed_path.read_text(encoding="utf-8")).get("teachers", [])}
            except Exception:
                pass
        if existing:
            existing.name = name or existing.name
            existing.department = department
            existing.assistant = assistant
            if capabilities:
                existing.capabilities = capabilities
            elif not existing.capabilities and teacher_id in seed_caps:
                existing.capabilities = seed_caps[teacher_id]
        else:
            state.teachers.append(Teacher(
                id=teacher_id, name=name or teacher_id, department=department,
                assistant=assistant, capabilities=capabilities or seed_caps.get(teacher_id, {})
            ))
    elif action == "teacher-delete":
        teacher_id = str(data.get("id", "")).strip()
        target = next((t for t in state.teachers if t.id == teacher_id), None)
        if not target:
            raise ValueError(f"Không tìm thấy giảng viên {teacher_id}")
        if any(s.teacher == teacher_id for s in state.sessions):
            raise ValueError(f"Không thể xóa giảng viên '{teacher_id}' vì đang được phân công giảng dạy")
        if any(ev.get("teacher") == teacher_id for ev in state.published):
            raise ValueError(f"Không thể xóa giảng viên '{teacher_id}' vì đang có lịch công bố")
        state.teachers = [t for t in state.teachers if t.id != teacher_id]
    elif action == "rooms-preset":
        import csv
        default_avail = [
            Slot(day=d, start=420, end=1080, evening=False) for d in range(2, 8)
        ]
        csv_path = Path(__file__).resolve().parents[2] / "resources" / "so_phong.csv"
        preset_rooms = []
        if csv_path.exists():
            with open(csv_path, encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    ten = (row.get("ten_phong") or row.get("id") or "").strip()
                    if not ten:
                        continue
                    tinh_chat = (row.get("tinh_chat_phong") or row.get("room_type") or "").strip()
                    cap_str = (row.get("suc_chua") or "").strip()
                    if "máy tính" in tinh_chat and "máy chiếu" in tinh_chat:
                        rtype = "COMPUTER"
                        equip = ["COMPUTER", "PROJECTOR"]
                        cap = int(cap_str) if cap_str else 100
                        note = f"Phòng {ten} đa năng (máy tính & máy chiếu)"
                    elif "máy tính" in tinh_chat or tinh_chat == "COMPUTER":
                        rtype = "COMPUTER"
                        equip = ["COMPUTER", "PROJECTOR"]
                        cap = int(cap_str) if cap_str else 45
                        note = f"Phòng máy tính {ten} phục vụ TUT"
                    else:
                        rtype = "PROJECTOR"
                        equip = ["PROJECTOR"]
                        cap = int(cap_str) if cap_str else 150
                        note = f"Phòng máy chiếu {ten} phục vụ LEC"
                    preset_rooms.append(Room(
                        id=ten, name=f"Phòng {ten}", capacity=cap,
                        room_type=rtype, equipment=equip,
                        availability=default_avail, active=True,
                        allowed_departments=[], allowed_programs=[], allowed_courses=[], note=note
                    ))
        if not preset_rooms:
            lec_200 = {"101C", "802C"}
            lec_150 = {"405E", "801C", "901C"}
            for r_id in ["101C", "405E", "409D2", "621C", "702C", "801C", "802C", "805C", "901C", "902C"]:
                cap = 200 if r_id in lec_200 else (150 if r_id in lec_150 else 100)
                preset_rooms.append(Room(
                    id=r_id, name=f"Phòng {r_id}", capacity=cap,
                    room_type="PROJECTOR", equipment=["PROJECTOR"],
                    availability=default_avail, active=True,
                    allowed_departments=[], allowed_programs=[], allowed_courses=[], note=f"Phòng máy chiếu {r_id} phục vụ LEC"
                ))
            preset_rooms.append(Room(
                id="206A1", name="Phòng 206A1", capacity=100,
                room_type="COMPUTER", equipment=["COMPUTER", "PROJECTOR"],
                availability=default_avail, active=True,
                allowed_departments=[], allowed_programs=[], allowed_courses=[], note="Phòng 206A1 đa năng (máy tính & máy chiếu)"
            ))
            for r_id in ["201A1", "203E", "205D1", "206D1", "207D1", "303E", "304E", "402C", "404C", "414C", "416C", "417C", "714C", "810C"]:
                preset_rooms.append(Room(
                    id=r_id, name=f"Phòng {r_id}", capacity=45,
                    room_type="COMPUTER", equipment=["COMPUTER", "PROJECTOR"],
                    availability=default_avail, active=True,
                    allowed_departments=[], allowed_programs=[], allowed_courses=[], note=f"Phòng máy tính {r_id} phục vụ TUT"
                ))
        state.rooms = preset_rooms
    elif action in ("rooms", "rooms-delete"):
        if action == "rooms-delete":
            delete_ids = set(data.get("ids", []))
            rooms = [r for r in state.rooms if r.id not in delete_ids]
        else:
            rooms = [Room.model_validate(r) for r in data["rooms"]]
        valid_room_ids = {r.id for r in rooms}
        candidate = State.model_validate(dict(state.model_dump(), rooms=[r.model_dump() for r in rooms]))
        indexed = {r.id: r for r in rooms}
        from .domain import Session
        for event in state.published:
            if not event.get("room_id"):
                continue
            room = indexed.get(event["room_id"])
            if room is None or room_errors(candidate, Session.model_validate({k:v for k,v in event.items() if k in Session.model_fields}), room, event):
                raise ValueError("Room change would invalidate published occupancy: " + event["id"])
        state.reservations = [res for res in state.reservations if res.room_id in valid_room_ids]
        state.rooms = rooms
    elif action == "published-room":
        class PublishedRoom(Model):
            session: str
            room_id: str
        item = PublishedRoom.model_validate(data)
        event = next(r for r in state.published if r["id"] == item.session)
        if event.get("room_id"):
            raise ValueError("Published room is already confirmed")
        room = next(r for r in state.rooms if r.id == item.room_id)
        from .domain import Session
        original = Session.model_validate({k:v for k,v in event.items() if k in Session.model_fields})
        errors = room_errors(state, original, room, event)
        if errors:
            raise ValueError("; ".join(errors))
        event["room_id"] = room.id
    elif action == "reservation":
        item = Reservation.model_validate(data)
        if item.room_id not in {r.id for r in state.rooms}:
            raise ValueError("Unknown reserved room")
        from .domain import overlap
        if any(r.get("room_id") == item.room_id and overlap(r, item.model_dump()) for r in state.published):
            raise ValueError("Reservation conflicts with published occupancy")
        if any(r.id == item.id for r in state.reservations):
            raise ValueError("Reservation already exists; release explicitly before changing")
        state.reservations.append(item)
    elif action == "reservation-delete":
        item = next(r for r in state.reservations if r.id == data["id"])
        state.reservations.remove(item)
    elif action == "requirements":
        session = next(s for s in state.sessions if s.id == data["session"])
        class Requirements(Model):
            session: str
            required_equipment: list[str]
            room: Literal["PROJECTOR", "COMPUTER"] | None = None
            required_room_type: str | None = None
        item = Requirements.model_validate(data)
        if item.room is not None:
            session.room = item.room
        session.required_equipment = item.required_equipment
        session.required_room_type = item.required_room_type
    elif action == "config":
        state.config = Config.model_validate(data)
        state.draft = []
    elif action in ("offerings", "plan-reset"):
        if action == "plan-reset":
            state.offerings = []
            state.sessions = []
            state.draft = []
            state.published = []
            for d in state.departments:
                d.status = "UNSENT"
                d.note = ""
            return {}
        items = [Offering.model_validate(o) for o in data["offerings"]]
        if not items:
            raise ValueError("Empty plan")
        state.offerings = items
        state.sessions = [s for o in items for s in split(o)]
        state.draft = []
        state.published = []
        for d in state.departments:
            d.status = "UNSENT"
            d.note = ""
    elif action in ("send", "send-all"):
        target_dept = data.get("department") if (data and isinstance(data, dict)) else None
        if target_dept:
            dep = next(d for d in state.departments if d.id == target_dept)
            if dep.status != "UNSENT" or not any(s.department == dep.id for s in state.sessions):
                raise ValueError("Department must have unsent classes")
            dep.status = "SENT"
        else:
            sent_any = False
            for dep in state.departments:
                if dep.status == "UNSENT" and any(s.department == dep.id for s in state.sessions):
                    dep.status = "SENT"
                    sent_any = True
            if not sent_any:
                raise ValueError("Không có bộ môn nào ở trạng thái chờ gửi có lớp học phần")
    elif action in ("assign", "balance", "teacher", "submit"):
        department = data["department"]
        head(p, department)
        dep = next(d for d in state.departments if d.id == department)
        if dep.status != "SENT":
            raise ValueError("Assignment editing requires a sent or returned department")
        sessions = [s for s in state.sessions if s.department == department]
        dept_courses = {s.course for s in sessions}
        teachers = [t for t in state.teachers if t.department == department or any(c in t.capabilities for c in dept_courses)]
        if action == "teacher":
            update = TeacherUpdate.model_validate({k:v for k,v in data.items() if k != "department"})
            t = next((t for t in state.teachers if t.id == update.teacher), None)
            if not t:
                raise ValueError(f"Không tìm thấy giảng viên {update.teacher}")
            candidate = Teacher.model_validate(dict(t.model_dump(), assistant=update.assistant, capabilities=update.capabilities))
            state.teachers[state.teachers.index(t)] = candidate
        elif action == "assign":
            item = Assign.model_validate({k:v for k,v in data.items() if k != "department"})
            s = next(s for s in sessions if s.id == item.session)
            t = next((t for t in teachers if t.id == item.teacher), None)
            if not t:
                raise ValueError(f"Không tìm thấy giảng viên {item.teacher}")
            if not eligible(s, t):
                raise ValueError("Teacher is not eligible for this class")
            s.teacher = t.id
        elif action == "balance":
            loads = {t.id: sum(s.periods for s in sessions if s.teacher == t.id) for t in teachers}
            assigned_count = 0
            for s in sessions:
                if s.teacher:
                    continue
                candidates = [t for t in teachers if eligible(s, t)]
                if not candidates:
                    continue
                t = min(candidates, key=lambda t: (loads[t.id], t.id))
                s.teacher = t.id
                loads[t.id] += s.periods
                assigned_count += 1
            if assigned_count == 0 and any(not s.teacher for s in sessions):
                raise ValueError(f"Không có giảng viên nào đủ năng lực cho các lớp còn trống của bộ môn {department}. Vui lòng đồng bộ hoặc cập nhật năng lực giảng viên.")
        else:
            errors = assignment_errors(state, department)
            if errors:
                raise ValueError("; ".join(errors))
            dep.status = "SUBMITTED"
            dep.note = ""
        state.draft = []
    elif action == "capabilities-preset":
        if p.role not in ("STAFF", "HEAD"):
            raise HTTPException(403, "Chỉ Giáo vụ hoặc Trưởng bộ môn mới có quyền đồng bộ năng lực")
        seed_path = Path(__file__).resolve().parents[2] / "data/fall2026/catalog_seed.json"
        if not seed_path.exists():
            raise ValueError("Không tìm thấy tệp năng lực giảng viên TKB gốc")
        seed_data = json.loads(seed_path.read_text(encoding="utf-8"))
        seed_caps = {t["id"]: t.get("capabilities", {}) for t in seed_data.get("teachers", [])}
        dept_filter = p.department if p.role == "HEAD" else data.get("department")
        updated = 0
        for t in state.teachers:
            if (not dept_filter or t.department == dept_filter) and t.id in seed_caps:
                t.capabilities = seed_caps[t.id]
                updated += 1
    elif action == "return":
        note = Return.model_validate({"note": data["note"]})
        dep = next(d for d in state.departments if d.id == data["department"])
        if dep.status != "SUBMITTED":
            raise ValueError("Only submitted assignments can be returned")
        dep.status, dep.note = "SENT", note.note
        state.draft = []
    elif action == "solve":
        run = Run.model_validate(data)
        state.draft, runs = solve(state, run.iterations, run.seed)
        return {"runs": runs, "evaluation": evaluate(state, state.draft)}
    elif action == "placement":
        placement = Placement.model_validate(data)
        if placement.session not in {s.id for s in state.sessions}:
            raise ValueError("Unknown session")
        if placement.room_id not in {r.id for r in state.rooms}:
            raise ValueError("Unknown room")
        state.draft = [x for x in state.draft if x.session != placement.session] + [placement]
        return {"evaluation": evaluate(state, state.draft)}
    elif action == "publish":
        publish(state)
    elif action == "external-delete":
        if p.role not in ("HEAD", "TEACHER") or not p.teacher:
            raise HTTPException(403, "Teacher identity required")
        item = next(e for e in state.external if e.id == data["id"] and e.teacher == p.teacher)
        state.external.remove(item)
    elif action == "external":
        if p.role not in ("HEAD", "TEACHER") or not p.teacher:
            raise HTTPException(403, "Teacher identity required")
        if "teacher" in data or "id" in data:
            raise HTTPException(422, "Teacher and identity are server assigned")
        external = External.model_validate(dict(data, id=str(uuid4()), teacher=p.teacher))
        add_external(state, external)
    else:
        raise HTTPException(404, "Unknown command")
    return {}


@app.post("/api/commands/{action}")
def command(action: str, request: Command, p: Principal = Depends(principal)):
    try:
        with storage.transaction(p.workspace_id, request.revision) as (state, revision, session):
            result = apply(state, action, request.payload, p)
            session.add(AuditLog(
                workspace_id=UUID(str(p.workspace_id)),
                actor=UUID(str(p.id)),
                action=action,
                revision=revision + 1,
            ))
            if action in ("publish", "published-room"):
                session.add(Publication(
                    workspace_id=UUID(str(p.workspace_id)),
                    actor=UUID(str(p.id)),
                    revision=revision + 1,
                    body=state.published,
                ))
        return {"revision": revision + 1, **result}
    except (StopIteration, KeyError):
        raise HTTPException(422, "Missing or unknown input reference")
    except ValidationError as exc:
        raise HTTPException(422, str(exc))


@app.post("/api/import/preview")
async def preview(file: UploadFile = File(...), p: Principal = Depends(principal)):
    """Strict canonical headers; preview only. Never infer an unknown workbook layout."""
    staff(p)
    from openpyxl import load_workbook
    raw = await file.read(5_000_001)
    if len(raw) > 5_000_000:
        raise HTTPException(413, "Workbook limit is 5 MB")
    try:
        from zipfile import ZipFile
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
    except (ValueError, StopIteration) as exc:
        raise HTTPException(422, str(exc))
    except Exception:
        raise HTTPException(422, "Unreadable workbook")


@app.get("/api/export/{source}")
def export(source: str, p: Principal = Depends(principal)):
    staff(p)
    if source not in ("draft", "published"):
        raise HTTPException(422, "Use draft or published")
    from .exporter import workbook
    state, revision = storage.read(p.workspace_id)
    return Response(workbook(state, source), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Timetable-{source}-r{revision}.xlsx"})
