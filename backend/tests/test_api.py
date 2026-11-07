from contextlib import contextmanager
from copy import deepcopy
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.auth import Principal, principal
from app import storage
from test_domain import ready

class FakeSession:
    def add(self, item):
        pass
    def execute(self, *args, **kwargs):
        pass

@pytest.fixture
def api(monkeypatch):
    state=ready()
    revision=0
    identity=Principal(id="00000000-0000-0000-0000-000000000001",workspace_id="00000000-0000-0000-0000-000000000002",role="STAFF")
    @contextmanager
    def transaction(workspace,expected=None):
        nonlocal state,revision
        if expected is not None and expected!=revision:
            raise ValueError("Stale revision")
        candidate=deepcopy(state)
        yield candidate,revision,FakeSession()
        state=candidate
        revision+=1
    monkeypatch.setattr(storage,"read",lambda _: (deepcopy(state),revision))
    monkeypatch.setattr(storage,"transaction",transaction)
    app.dependency_overrides[principal]=lambda: identity
    yield TestClient(app),identity
    app.dependency_overrides.clear()


def post(client,action,payload=None,revision=0):
    return client.post("/api/commands/"+action,json={"revision":revision,"payload":payload or {}})


def test_unauthenticated():
    with TestClient(app) as client:
        assert client.get("/api/workspace").status_code==401


def test_teacher_cannot_mutate_or_read_other_teachers(api):
    client,p=api
    p.role="TEACHER";p.teacher="t"
    data=client.get("/api/workspace").json()["state"]
    assert set(data)=={"published","external"}
    for action in ("catalog","config","offerings","send","solve","placement","publish"):
        assert post(client,action).status_code==403


def test_head_scoped_and_real_teacher(api):
    client,p=api
    p.role="HEAD";p.department="OTHER";p.teacher="t"
    assert client.get("/api/workspace").status_code==403
    p.department="D"
    assert post(client,"assign",{"department":"OTHER","session":"o-LEC-0","teacher":"t"}).status_code==403


def test_solve_publish_stale_revision(api):
    client,p=api
    assert post(client,"solve",{"iterations":100,"seed":11}).status_code==200
    assert post(client,"publish").status_code==409
    assert post(client,"publish",revision=1).status_code==200
    assert len(client.get("/api/workspace").json()["state"]["published"])>0


def test_readiness_and_no_partial_write(api):
    client,p=api
    response=post(client,"config",{"rooms":{"PROJECTOR":-1,"COMPUTER":2}})
    assert response.status_code==422
    assert client.get("/api/workspace").json()["revision"]==0


def test_return_requires_note_and_reopens_department(api):
    client,p=api
    assert post(client,"return",{"department":"D","note":"Review"}).status_code==200
    dep=client.get("/api/workspace").json()["state"]["departments"][0]
    assert dep["status"]=="SENT" and dep["note"]=="Review"


def test_input_cannot_choose_role(api):
    client,p=api
    assert client.post("/api/commands/publish",json={"revision":0,"role":"STAFF","payload":{}}).status_code==422
