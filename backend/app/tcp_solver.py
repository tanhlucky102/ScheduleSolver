"""Length-prefixed JSON TCP bridge to an isolated solver worker process."""
import asyncio
import atexit
import hmac
import json
import logging
import os
import secrets
import struct
import subprocess
import sys
import threading
from pathlib import Path
from uuid import uuid4

from .timetable.models import Placement, State
from .timetable.rules import SchedulingConflict, evaluate
from .timetable.solver import solve

logger = logging.getLogger(__name__)
_HOST = "127.0.0.1"
_PORT = 9009
_MAX_FRAME = 32 * 1024 * 1024
_process: subprocess.Popen | None = None
_process_lock = threading.Lock()
_worker_token: str | None = None


async def _read_frame(reader: asyncio.StreamReader):
    length = struct.unpack("!I", await reader.readexactly(4))[0]
    if length == 0 or length > _MAX_FRAME:
        raise ValueError("Invalid TCP frame length")
    return json.loads(await reader.readexactly(length))


async def _write_frame(writer: asyncio.StreamWriter, value: dict):
    payload = json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    if not payload or len(payload) > _MAX_FRAME:
        raise ValueError("TCP frame exceeds the configured limit")
    writer.write(struct.pack("!I", len(payload)) + payload)
    await writer.drain()


async def _handle_connection(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    request = {}
    try:
        decoded = await _read_frame(reader)
        if not isinstance(decoded, dict):
            raise ValueError("TCP solver request must be a JSON object")
        request = decoded
        expected_token = os.environ.get("SCHEDULE_SOLVER_WORKER_TOKEN", "")
        received_token = request.pop("auth", "")
        if not expected_token or not isinstance(received_token, str) or not hmac.compare_digest(received_token, expected_token):
            raise PermissionError("Unauthorized solver worker request")
        if request.get("type") != "SOLVE_REQ":
            raise ValueError("Unsupported TCP solver request")
        if not isinstance(request.get("job_id"), str):
            raise ValueError("Solver job ID is required")

        loop = asyncio.get_running_loop()
        updates: asyncio.Queue = asyncio.Queue()

        def report_progress(update):
            message = {
                "type": "SOLVE_PROGRESS",
                "job_id": request["job_id"],
                **update,
            }
            loop.call_soon_threadsafe(updates.put_nowait, message)

        async def run_solver():
            state = State.model_validate(request["state"])
            placements, runs = await asyncio.to_thread(
                solve,
                state,
                request["iterations"],
                request["seed"],
                report_progress,
            )
            state.draft = placements
            return {
                "type": "SOLVE_RESULT",
                "job_id": request["job_id"],
                "placements": [placement.model_dump(mode="json") for placement in placements],
                "runs": runs,
                "evaluation": evaluate(state, placements),
            }

        task = asyncio.create_task(run_solver())
        while not task.done() or not updates.empty():
            if not updates.empty():
                await _write_frame(writer, await updates.get())
                continue
            update_task = asyncio.create_task(updates.get())
            done, _ = await asyncio.wait(
                (task, update_task),
                return_when=asyncio.FIRST_COMPLETED,
            )
            if update_task in done:
                await _write_frame(writer, update_task.result())
            else:
                update_task.cancel()
                try:
                    await update_task
                except asyncio.CancelledError:
                    pass
        await _write_frame(writer, await task)
    except asyncio.IncompleteReadError:
        pass
    except PermissionError:
        await _write_frame(writer, {
            "type": "ERROR",
            "job_id": request.get("job_id"),
            "kind": "INTERNAL_ERROR",
            "detail": "Solver worker request rejected",
        })
    except SchedulingConflict as exc:
        await _write_frame(writer, {
            "type": "ERROR",
            "job_id": request.get("job_id"),
            "kind": "SCHEDULING_CONFLICT",
            "status": exc.status,
            "violations": exc.violations,
        })
    except ValueError as exc:
        await _write_frame(writer, {
            "type": "ERROR",
            "job_id": request.get("job_id"),
            "kind": "VALUE_ERROR",
            "detail": str(exc),
        })
    except Exception:
        logger.exception("Solver worker failed while handling a TCP request")
        try:
            await _write_frame(writer, {
                "type": "ERROR",
                "job_id": request.get("job_id"),
                "kind": "INTERNAL_ERROR",
                "detail": "Solver worker failed",
            })
        except (ConnectionError, OSError):
            pass
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except (ConnectionError, OSError):
            pass


async def _serve():
    server = await asyncio.start_server(_handle_connection, _HOST, _PORT, limit=_MAX_FRAME + 4)
    async with server:
        await server.serve_forever()


def _worker_entry():
    asyncio.run(_serve())


def _ensure_worker_process():
    global _process, _worker_token
    with _process_lock:
        if _process is not None and _process.poll() is None:
            return
        if _worker_token is None:
            _worker_token = secrets.token_urlsafe(32)
        module_root = Path(__file__).resolve().parents[1]
        env = os.environ.copy()
        env["SCHEDULE_SOLVER_WORKER_TOKEN"] = _worker_token
        existing_path = env.get("PYTHONPATH")
        env["PYTHONPATH"] = str(module_root) + (os.pathsep + existing_path if existing_path else "")
        _process = subprocess.Popen(
            [sys.executable, "-m", "app.tcp_solver", "--serve"],
            cwd=module_root,
            env=env,
        )


def _stop_worker_process():
    global _process
    with _process_lock:
        if _process is not None and _process.poll() is None:
            _process.terminate()
            try:
                _process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                _process.kill()
                _process.wait(timeout=3)
        _process = None


atexit.register(_stop_worker_process)


async def _ensure_worker_ready():
    await asyncio.to_thread(_ensure_worker_process)
    for _ in range(50):
        process = _process
        if process is not None and process.poll() is not None:
            raise RuntimeError("Solver worker process exited during startup")
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(_HOST, _PORT),
                timeout=0.2,
            )
            writer.close()
            await writer.wait_closed()
            return
        except (OSError, asyncio.TimeoutError):
            await asyncio.sleep(0.1)
    raise RuntimeError("Solver worker did not listen on TCP port 9009")


async def solve_over_tcp(state: State, iterations: int, seed: int, on_progress):
    try:
        await _ensure_worker_ready()
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(_HOST, _PORT),
            timeout=3,
        )
    except (OSError, asyncio.TimeoutError, RuntimeError) as exc:
        raise RuntimeError(f"Solver worker unavailable: {exc}") from exc

    job_id = str(uuid4())
    try:
        await _write_frame(writer, {
            "type": "SOLVE_REQ",
            "auth": _worker_token,
            "job_id": job_id,
            "state": state.model_dump(mode="json"),
            "iterations": iterations,
            "seed": seed,
        })
        while True:
            response = await _read_frame(reader)
            if response.get("job_id") != job_id:
                raise RuntimeError("Solver worker returned a mismatched job")
            if response.get("type") == "SOLVE_PROGRESS":
                await on_progress(response)
            elif response.get("type") == "SOLVE_RESULT":
                return (
                    [Placement.model_validate(item) for item in response["placements"]],
                    response["runs"],
                    response["evaluation"],
                    job_id,
                )
            elif response.get("type") == "ERROR":
                if response.get("kind") == "SCHEDULING_CONFLICT":
                    raise SchedulingConflict(response["status"], response["violations"])
                if response.get("kind") == "VALUE_ERROR":
                    raise ValueError(response["detail"])
                raise RuntimeError(response.get("detail", "Solver worker failed"))
            else:
                raise RuntimeError("Solver worker returned an invalid response")
    except (ConnectionError, OSError, asyncio.IncompleteReadError) as exc:
        raise RuntimeError(f"Solver worker connection failed: {exc}") from exc
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except (ConnectionError, OSError):
            pass


if __name__ == "__main__" and sys.argv[1:] == ["--serve"]:
    _worker_entry()
