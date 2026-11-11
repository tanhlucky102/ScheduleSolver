from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from ..auth import Principal, principal, staff
from .. import storage
from .importer import preview_workbook
from ..timetable.exporter import teacher_workbook
from ..templates import (
    build_plan_template_xlsx,
    build_external_template_xlsx,
    build_teachers_template_csv,
    build_rooms_template_csv,
    preview_external_file,
)

router = APIRouter()


@router.get("/api/templates/{kind}")
def download_template(kind: str):
    """Download sample Excel/CSV templates for training plan, external/study schedule, personnel, or rooms."""
    xlsx_mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    csv_mime = "text/csv; charset=utf-8"
    if kind == "plan":
        return Response(
            build_plan_template_xlsx(),
            media_type=xlsx_mime,
            headers={"Content-Disposition": "attachment; filename=Mau_Ke_Hoach_Dao_Tao_HANU.xlsx"},
        )
    if kind == "external":
        return Response(
            build_external_template_xlsx(),
            media_type=xlsx_mime,
            headers={"Content-Disposition": "attachment; filename=Mau_Lich_Ngoai_Va_Di_Hoc.xlsx"},
        )
    if kind == "teachers":
        return Response(
            build_teachers_template_csv(),
            media_type=csv_mime,
            headers={"Content-Disposition": "attachment; filename=Mau_Nhan_Su_Giang_Vien.csv"},
        )
    if kind == "rooms":
        return Response(
            build_rooms_template_csv(),
            media_type=csv_mime,
            headers={"Content-Disposition": "attachment; filename=Mau_Danh_Sach_Phong_Hoc.csv"},
        )
    raise HTTPException(404, f"Unknown template kind: {kind}")


@router.post("/api/import/preview")
async def preview(file: UploadFile = File(...), p: Principal = Depends(principal)):
    """Strict canonical headers; preview only. Never infer an unknown workbook layout."""
    staff(p)
    raw = await file.read(5_000_001)
    if len(raw) > 5_000_000:
        raise HTTPException(413, "Workbook limit is 5 MB")
    try:
        return preview_workbook(raw)
    except (ValueError, StopIteration) as exc:
        raise HTTPException(422, str(exc))
    except Exception:
        raise HTTPException(422, "Unreadable workbook")


@router.post("/api/import/external-preview")
async def preview_external(file: UploadFile = File(...), p: Principal = Depends(principal)):
    """Parse external teaching / study / makeup schedule (.xlsx or .csv) without mutating workspace state."""
    raw = await file.read(5_000_001)
    if len(raw) > 5_000_000:
        raise HTTPException(413, "File limit is 5 MB")
    try:
        state, _ = storage.read(p.workspace_id)
        cfg = state.config
        return preview_external_file(
            filename=file.filename or "external.xlsx",
            raw=raw,
            first_period_start=cfg.first_period_start,
            period_minutes=cfg.period_minutes,
            break_minutes=cfg.break_minutes,
            include_break=cfg.include_break,
            teacher_filter=p.teacher,
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except Exception:
        raise HTTPException(422, "Unreadable external schedule file")


@router.get("/api/export-teacher")
def export_teacher_schedule(
    teacher_id: str | None = Query(default=None),
    source: str = Query(default="published"),
    week_start: str | None = Query(default=None),
    week_label: str | None = Query(default=None),
    p: Principal = Depends(principal),
):
    """Export a lecturer's personal weekly/semester timetable (.xlsx).
    - TEACHER: exports own published + external/study schedule with personal colors.
    - HEAD: exports own schedule (with external) or a department teacher's faculty schedule.
    - STAFF: exports any specified teacher's faculty schedule (draft or published).
    """
    if source not in ("draft", "published"):
        raise HTTPException(422, "Use draft or published")
    state, revision = storage.read(p.workspace_id)

    if p.role == "TEACHER":
        if not p.teacher:
            raise HTTPException(403, "Teacher identity required")
        target_id = p.teacher
        include_ext = True
        use_source = "published"
    elif p.role == "HEAD":
        target_id = teacher_id or p.teacher
        if not target_id:
            raise HTTPException(403, "Teacher identity required")
        include_ext = (target_id == p.teacher)
        if not include_ext:
            t_obj = next((t for t in state.teachers if t.id == target_id), None)
            if t_obj is None or t_obj.department != p.department:
                raise HTTPException(403, "Chỉ được xuất lịch của giảng viên thuộc bộ môn quản lý")
        use_source = "published"
    else:
        # STAFF
        if not teacher_id:
            raise HTTPException(422, "Vui lòng chọn mã giảng viên cần xuất lịch")
        target_id = teacher_id
        include_ext = False
        use_source = source

    try:
        raw = teacher_workbook(
            state=state,
            teacher_id=target_id,
            include_external=include_ext,
            source=use_source,
            week_start=week_start,
            week_label=week_label,
        )
    except LookupError as exc:
        raise HTTPException(404, str(exc))
    wk_suffix = f"-{week_start[:10]}" if week_start else ""
    fname = f"TKB-GiangVien-{target_id}{wk_suffix}-r{revision}.xlsx"
    return Response(
        raw,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
