from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from .auth import Principal, principal, staff
from .plan_import import preview_workbook

router = APIRouter()


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
