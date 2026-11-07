import os
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError

from .auth import Principal, principal, staff
from .domain_rules import SchedulingConflict
from .models import AuditLog, Publication
from .schemas import Command
from .visibility import visible
from .policies import RequestError
from .commands import apply
from . import storage
from .import_preview import router as import_router

app = FastAPI(title="ScheduleSolver Web API", version="1.0.0")
app.add_middleware(CORSMiddleware,
    allow_origins=os.environ.get("FRONTEND_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
app.include_router(import_router)


@app.exception_handler(SchedulingConflict)
async def scheduling_error(request, exc):
    return JSONResponse(status_code=409, content={"detail": str(exc), "status": exc.status, "violations": exc.violations})


@app.exception_handler(RequestError)
async def request_error(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(ValueError)
async def domain_error(request, exc):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(LookupError)
async def missing(request, exc):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/me")
def me(p: Principal = Depends(principal)):
    return p.model_dump()


@app.get("/api/workspace")
def workspace(p: Principal = Depends(principal)):
    state, revision = storage.read(p.workspace_id)
    return visible(state, revision, p)


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


@app.get("/api/export/{source}")
def export(source: str, p: Principal = Depends(principal)):
    staff(p)
    if source not in ("draft", "published"):
        raise HTTPException(422, "Use draft or published")
    from .exporter import workbook
    state, revision = storage.read(p.workspace_id)
    return Response(workbook(state, source), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Timetable-{source}-r{revision}.xlsx"})
