from unittest.mock import patch
from fastapi.testclient import TestClient
import httpx
import pytest

@pytest.fixture(autouse=True)
def configured(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL","https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY","test-public-key")
from app.main import app

def test_bad_and_expired_tokens_never_reach_database():
    with patch("app.auth.httpx.get",return_value=httpx.Response(401)), patch("app.auth.connect") as db:
        with TestClient(app) as client:
            assert client.get("/api/workspace",headers={"Authorization":"Bearer expired"}).status_code==401
        db.assert_not_called()


def test_auth_outage_fails_closed():
    with patch("app.auth.httpx.get",side_effect=httpx.ConnectError("down")):
        with TestClient(app) as client:
            assert client.get("/api/workspace",headers={"Authorization":"Bearer anything"}).status_code==503
