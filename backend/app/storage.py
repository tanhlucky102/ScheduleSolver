"""Postgres aggregate repository using SQLAlchemy ORM. Row locks serialize every workspace mutation."""
import os
from contextlib import contextmanager
from typing import Generator
from uuid import UUID

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session

from .domain_models import State
from .models import Workspace

_engine = None
_last_db_url = None
_SessionFactory = None


def get_engine():
    global _engine, _last_db_url, _SessionFactory
    raw_url = os.environ.get("DATABASE_URL", "")
    url = raw_url
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    elif url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]

    if _engine is None or _last_db_url != url:
        if _engine is not None:
            _engine.dispose()
        _last_db_url = url
        _engine = create_engine(url, pool_pre_ping=True, connect_args={"prepare_threshold": None})
        _SessionFactory = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine


def get_session_factory():
    get_engine()
    return _SessionFactory


@contextmanager
def get_session() -> Generator[Session, None, None]:
    factory = get_session_factory()
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def connect():
    """For compatibility with session-based execution."""
    return get_session()


@contextmanager
def transaction(workspace_id: str | UUID, expected_revision: int | None = None):
    wid = UUID(str(workspace_id))
    with get_session() as session:
        workspace = session.execute(
            select(Workspace).where(Workspace.id == wid).with_for_update()
        ).scalar_one_or_none()
        if workspace is None:
            raise LookupError("Workspace not found")
        if expected_revision is not None and workspace.revision != expected_revision:
            raise ValueError("Stale revision; refresh before retrying")
        state = State.model_validate(workspace.body)
        yield state, workspace.revision, session
        # Validate references even after in-place mutations.
        state = State.model_validate(state.model_dump())
        workspace.body = state.model_dump()
        workspace.revision = workspace.revision + 1


def read(workspace_id: str | UUID):
    wid = UUID(str(workspace_id))
    with get_session() as session:
        workspace = session.execute(
            select(Workspace).where(Workspace.id == wid)
        ).scalar_one_or_none()
        if workspace is None:
            raise LookupError("Workspace not found")
        return State.model_validate(workspace.body), workspace.revision
