"""Ephemeral Docker Postgres integration; no remote database touched."""
import os
from pathlib import Path
import secrets
import subprocess
import time
import uuid
import psycopg
from sqlalchemy import select, func, update
from app.domain import State
from app.models import Workspace, Profile, Publication, AuditLog
from app import storage

name = "schedule-web-test-" + secrets.token_hex(4)
password = secrets.token_urlsafe(24)
try:
    subprocess.run(["docker", "run", "--rm", "-d", "--name", name, "-e", "POSTGRES_PASSWORD=" + password,
                    "-p", "127.0.0.1::5432", "postgres:17-alpine"], check=True, capture_output=True)
    port = subprocess.check_output(["docker", "port", name, "5432/tcp"], text=True).strip().rsplit(":", 1)[1]
    dsn = f"postgresql://postgres:{password}@127.0.0.1:{port}/postgres"
    for attempt in range(60):
        try:
            conn = psycopg.connect(dsn)
            conn.close()
            break
        except psycopg.OperationalError:
            time.sleep(.5)
    os.environ["DATABASE_URL"] = dsn
    migration = Path("../supabase/migrations/001_schedule_web.sql").read_text()

    # Initial DDL migration on fresh test database
    with psycopg.connect(dsn) as raw_conn:
        raw_conn.execute("create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated")
        raw_conn.execute(migration)
        raw_conn.execute(Path("../supabase/migrations/002_room_constraints.sql").read_text())
        raw_conn.commit()

    user_id = uuid.uuid4()
    with psycopg.connect(dsn) as raw_conn:
        raw_conn.execute("insert into auth.users values(%s)", (user_id,))
        raw_conn.commit()

    # ORM Workspace and Profile creation
    with storage.get_session() as session:
        ws = Workspace(name="Integration", body=State().model_dump(), revision=0)
        session.add(ws)
        session.flush()
        wid = ws.id
        prof = Profile(id=user_id, workspace_id=wid, role="STAFF")
        session.add(prof)

    # Test transaction using ORM
    with storage.transaction(wid, 0) as (state, rev, session):
        assert rev == 0
        state.config.max_periods = 7
    assert storage.read(wid)[1] == 1

    try:
        with storage.transaction(wid, 0):
            raise AssertionError("Stale revision accepted")
    except ValueError:
        pass

    try:
        with storage.transaction(wid, 1) as (state, rev, session):
            state.config.max_periods = 2
            raise RuntimeError("rollback")
    except RuntimeError:
        pass

    assert storage.read(wid)[0].config.max_periods == 7
    assert storage.read(wid)[1] == 1

    with psycopg.connect(dsn) as raw_conn:
        with raw_conn.cursor() as cur:
            cur.execute("select has_schema_privilege('authenticated','schedule_web','usage') as allowed")
            assert not cur.fetchone()[0]
            cur.execute("select has_table_privilege('anon','schedule_web.workspaces','select') as allowed")
            assert not cur.fetchone()[0]

    # Concurrent edits based on the same revision: exactly one commits.
    from concurrent.futures import ThreadPoolExecutor
    def edit():
        try:
            with storage.transaction(wid, 1) as (state, rev, session):
                state.config.max_periods = 6
            return "committed"
        except ValueError:
            return "stale"

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: edit(), range(2)))
    assert sorted(results) == ["committed", "stale"]
    assert storage.read(wid)[1] == 2

    # Trigger test: SQL validate_workspace trigger rejects invalid teacher department
    invalid = State().model_dump()
    invalid["teachers"] = [{"id": "bad", "department": "missing"}]
    try:
        with storage.get_session() as session:
            session.execute(
                update(Workspace).where(Workspace.id == wid).values(body=invalid)
            )
        raise AssertionError("SQL accepted invalid teacher department")
    except psycopg.Error:
        pass
    except Exception as exc:
        from sqlalchemy.exc import DBAPIError
        if not isinstance(exc, DBAPIError):
            raise
    assert storage.read(wid)[1] == 2

    # New aggregate SQL trigger rejects malformed room data independently of Python.
    from sqlalchemy.exc import DBAPIError
    invalid_room = State().model_dump()
    invalid_room["rooms"] = [{"id":"R","capacity":0,"room_type":"LAB","equipment":[],"availability":[]}]
    try:
        with storage.get_session() as session:
            session.execute(update(Workspace).where(Workspace.id == wid).values(body=invalid_room))
    except DBAPIError:
        pass
    else:
        raise AssertionError("SQL accepted a room with zero capacity")
    assert storage.read(wid)[1] == 2

    # Real FastAPI -> repository -> Postgres with ORM.
    from tests.test_domain import ready
    from app.main import app
    from app.auth import Principal, principal
    from fastapi.testclient import TestClient

    with storage.get_session() as session:
        api_ws = Workspace(name="API integration", body=ready().model_dump(), revision=0)
        session.add(api_ws)
        session.flush()
        api_wid = api_ws.id
        profile_obj = session.get(Profile, user_id)
        profile_obj.workspace_id = api_wid

    app.dependency_overrides[principal] = lambda: Principal(id=str(user_id), workspace_id=str(api_wid), role="STAFF")
    try:
        with TestClient(app) as client:
            result = client.post("/api/commands/solve", json={"revision": 0, "payload": {"iterations": 100, "seed": 11}})
            assert result.status_code == 200, result.text
            assert client.post("/api/commands/publish", json={"revision": 0, "payload": {}}).status_code == 409
            result = client.post("/api/commands/publish", json={"revision": 1, "payload": {}})
            assert result.status_code == 200, result.text

            # Verify publications and audit log via ORM
            with storage.get_session() as session:
                pub_count = session.scalar(select(func.count()).select_from(Publication).where(Publication.workspace_id == api_wid))
                audit_count = session.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.workspace_id == api_wid))
                assert pub_count == 1
                assert audit_count == 2
            assert client.get("/api/export/published").status_code == 200
    finally:
        app.dependency_overrides.clear()
    print("PASS: SQL migration, FK/profile bootstrap, row transaction, stale revision, rollback, concurrent edit, SQL reference trigger, browser role isolation, real API/Postgres solve-publication-audit-export (SQLAlchemy ORM)")
finally:
    subprocess.run(["docker", "rm", "-f", name], capture_output=True)
