from test_api import api
from io import BytesIO
from openpyxl import load_workbook


def test_review_return_resubmit_solve_publish_and_external(api):
    client,p=api
    def run(action,payload=None,status=200):
        revision=client.get("/api/workspace").json()["revision"]
        response=client.post("/api/commands/"+action,json={"revision":revision,"payload":payload or {}})
        assert response.status_code==status,response.text
        return response
    # Return one department with feedback; head can teach their own classes.
    run("return",{"department":"D","note":"Review capabilities"})
    p.role="HEAD";p.department="D";p.teacher="t"
    run("teacher",{"department":"D","teacher":"t","assistant":False,"capabilities":{"CS":["LEC","TUT"]}})
    sessions=client.get("/api/workspace").json()["state"]["sessions"]
    run("assign",{"department":"D","session":sessions[0]["id"],"teacher":"t"})
    run("submit",{"department":"D"})
    p.role="STAFF";p.department=None;p.teacher=None
    run("solve",{"iterations":100,"seed":11})
    run("publish")
    res=client.get("/api/export/published")
    assert res.status_code==200
    assert load_workbook(BytesIO(res.content))["Danh sách lớp"].max_row==4
    p.role="TEACHER";p.teacher="t"
    run("publish",status=403)
    assert client.get("/api/export/published").status_code==403
    state=client.get("/api/workspace").json()["state"]
    event=state["published"][0]
    data={"institution":"School","course":"Math","class_name":"A","day":event["day"],
          "start":event["start"],"end":event["end"],"room":""}
    run("external",data,status=409)
    # Sunday late evening cannot conflict with this weekday faculty fixture.
    data.update(day=8,start=1200,end=1260)
    run("external",data)
    run("external",data,status=409)
    outside=client.get("/api/workspace").json()["state"]["external"]
    assert len(outside)==1 and outside[0]["teacher"]=="t"
    run("external-delete",{"id":outside[0]["id"]})
    assert not client.get("/api/workspace").json()["state"]["external"]


def test_head_balance_and_capabilities_preset(api):
    client, p = api
    def run(action, payload=None, status=200):
        revision = client.get("/api/workspace").json()["revision"]
        response = client.post("/api/commands/" + action, json={"revision": revision, "payload": payload or {}})
        assert response.status_code == status, response.text
        return response

    # 1. Capabilities preset as staff
    run("capabilities-preset")

    # 2. Return department D to SENT status
    run("return", {"department": "D", "note": "Re-balance"})
    p.role = "HEAD"; p.department = "D"; p.teacher = "t"

    # 3. Balance department D
    res = run("balance", {"department": "D"})
    assert res.status_code == 200
    updated_sessions = client.get("/api/workspace").json()["state"]["sessions"]
    for s in updated_sessions:
        if s["department"] == "D":
            assert s["teacher"] is not None
