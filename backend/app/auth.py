import os
from uuid import UUID
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import select

from .models import Profile
from . import storage

bearer = HTTPBearer(auto_error=False)


def connect():
    """Alias for backwards compatibility and mocking in tests."""
    return storage.get_session()


class Principal(BaseModel):
    id: str
    role: str
    workspace_id: str
    department: str | None = None
    teacher: str | None = None


def principal(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Bearer token required")
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_PUBLISHABLE_KEY"):
        raise HTTPException(503, "Server authentication is not configured")
    try:
        response = httpx.get(os.environ["SUPABASE_URL"].rstrip("/") + "/auth/v1/user",
            headers={"apikey": os.environ["SUPABASE_PUBLISHABLE_KEY"],
                     "Authorization": "Bearer " + credentials.credentials}, timeout=10)
    except httpx.HTTPError:
        raise HTTPException(503, "Authentication service unavailable")
    if response.status_code != 200:
        raise HTTPException(401, "Invalid or expired session")
    try:
        user_id = str(UUID(response.json()["id"]))
    except (ValueError, KeyError, TypeError):
        raise HTTPException(401, "Invalid identity")
    with connect() as session:
        profile = session.execute(
            select(Profile).where(Profile.id == UUID(user_id), Profile.active.is_(True))
        ).scalar_one_or_none()
    if profile is None:
        raise HTTPException(403, "Account has no active application role")
    return Principal(
        id=str(profile.id),
        role=profile.role,
        workspace_id=str(profile.workspace_id),
        department=profile.department,
        teacher=profile.teacher,
    )


def staff(p: Principal):
    if p.role != "STAFF":
        raise HTTPException(403, "Staff role required")


def head(p: Principal, department: str):
    if p.role != "HEAD" or p.department != department:
        raise HTTPException(403, "Department head scope required")
