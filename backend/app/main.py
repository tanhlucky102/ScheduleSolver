import asyncio
import json
import os
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError

from .auth import Principal, principal, staff
from .timetable.rules import SchedulingConflict
from .models import AuditLog, Publication
from .workspace.schemas import Command
from .workspace.visibility import visible
from .identity.policies import RequestError, require_teacher_profile
from .workspace.commands import apply
from . import storage
from .realtime import hub
from .scheduling.schemas import Run
from .tcp_solver import solve_over_tcp
from .planning.api import router as import_router

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


@app.websocket("/ws")
async def realtime_socket(websocket: WebSocket):
    origin = websocket.headers.get("origin")
    allowed_origins = {
        value.strip().rstrip("/")
        for value in os.environ.get("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    }
    if origin and origin.rstrip("/") not in allowed_origins:
        await websocket.close(code=4403)
        return
    await websocket.accept()
    try:
        auth_message = await websocket.receive_text()
        if len(auth_message) > 8192:
            await websocket.close(code=4401)
            return
        auth_payload = json.loads(auth_message)
        if not isinstance(auth_payload, dict):
            await websocket.close(code=4401)
            return
        token = auth_payload.get("token")
        if not isinstance(token, str) or not token:
            await websocket.close(code=4401)
            return
    except WebSocketDisconnect:
        return
    except json.JSONDecodeError:
        await websocket.close(code=4401)
        return
    try:
        from fastapi.security import HTTPAuthorizationCredentials
        from .auth import principal as authenticate

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        p = await asyncio.to_thread(authenticate, credentials)
        state, _ = await asyncio.to_thread(storage.read, p.workspace_id)
        require_teacher_profile(p, state)
    except HTTPException as exc:
        await websocket.close(code=4401 if exc.status_code == 401 else 4403)
        return
    except RequestError:
        await websocket.close(code=4403)
        return
    except LookupError:
        await websocket.close(code=4403)
        return

    client = await hub.connect(websocket, p)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.disconnect(client)


@app.post("/api/commands/solve")
async def solve_command(request: Command, p: Principal = Depends(principal)):
    try:
        state, revision = await asyncio.to_thread(storage.read, p.workspace_id)
        if revision != request.revision:
            raise ValueError("Stale revision; refresh before retrying")
        require_teacher_profile(p, state)
        staff(p)
        run = Run.model_validate(request.payload)

        async def report_progress(update):
            await hub.broadcast(p.workspace_id, {
                **update,
                "type": "solver:progress",
            })

        try:
            placements, runs, evaluation, job_id = await solve_over_tcp(
                state,
                run.iterations,
                run.seed,
                report_progress,
                algorithm=run.algorithm,
                threads=run.threads,
            )
        except TypeError:
            placements, runs, evaluation, job_id = await solve_over_tcp(
                state,
                run.iterations,
                run.seed,
                report_progress,
            )

        def persist_result():
            with storage.transaction(p.workspace_id, request.revision) as (state, revision, session):
                state.draft = placements
                session.add(AuditLog(
                    workspace_id=UUID(str(p.workspace_id)),
                    actor=UUID(str(p.id)),
                    action="solve",
                    revision=revision + 1,
                ))
                return revision + 1

        new_revision = await asyncio.to_thread(persist_result)
        await hub.broadcast(p.workspace_id, {
            "type": "workspace:updated",
            "revision": new_revision,
            "actor": p.id,
        })
        return {
            "revision": new_revision,
            "runs": runs,
            "evaluation": evaluation,
            "job_id": job_id,
        }
    except (StopIteration, KeyError):
        raise HTTPException(422, "Missing or unknown input reference")
    except ValidationError as exc:
        raise HTTPException(422, str(exc))
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))


@app.post("/api/commands/{action}")
def command(action: str, request: Command, background_tasks: BackgroundTasks, p: Principal = Depends(principal)):
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
        background_tasks.add_task(hub.broadcast, p.workspace_id, {
            "type": "workspace:updated",
            "revision": revision + 1,
            "actor": p.id,
        })
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
    from .timetable.exporter import workbook
    state, revision = storage.read(p.workspace_id)
    return Response(workbook(state, source), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Timetable-{source}-r{revision}.xlsx"})
