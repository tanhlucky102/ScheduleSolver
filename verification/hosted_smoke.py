"""Verify provisioned demo with real Supabase Auth/DB, optionally through Chromium."""
import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.request
import httpx
from dotenv import dotenv_values
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"backend"))
from app.main import app
from fastapi.testclient import TestClient


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--credentials",type=Path,default=Path("/tmp/schedule-demo-credentials.json"))
    parser.add_argument("--browser",action="store_true")
    args=parser.parse_args()
    env={k:v for k,v in dotenv_values(ROOT/"backend/.env").items() if v is not None}
    os.environ.update(env)
    credentials=json.loads(args.credentials.read_text())
    verified=[]
    with httpx.Client(timeout=20) as auth, TestClient(app) as api:
        for account in credentials["accounts"]:
            response=auth.post(env["SUPABASE_URL"].rstrip("/")+"/auth/v1/token?grant_type=password",
                headers={"apikey":env["SUPABASE_PUBLISHABLE_KEY"]},
                json={"email":account["email"],"password":account["password"]})
            assert response.status_code==200, "Real Supabase password login failed"
            headers={"Authorization":"Bearer "+response.json()["access_token"]}
            me=api.get("/api/me",headers=headers)
            assert me.status_code==200
            assert me.json()["role"]==account["role"]
            assert me.json()["workspace_id"]==credentials["workspace_id"]
            response=api.get("/api/workspace",headers=headers)
            assert response.status_code==200
            workspace=response.json(); state=workspace["state"]
            if account["role"]=="STAFF":
                assert len(state["offerings"])==67 and len(state["sessions"])==290
                assert not state["rooms"] and "external" not in state
            elif account["role"]=="HEAD":
                assert len(state["departments"])==1
                assert all(s["department"]==account["department"] for s in state["sessions"])
                assert api.post("/api/commands/rooms",headers=headers,
                    json={"revision":workspace["revision"],"payload":{"rooms":[]}}).status_code==403
            else:
                assert set(state)=={"published","external"}
                assert api.post("/api/commands/rooms",headers=headers,
                    json={"revision":workspace["revision"],"payload":{"rooms":[]}}).status_code==403
            verified.append({"role":account["role"],"department":account["department"],"login":True,"scope":True})
    result={"auth":"Supabase hosted real","database":"Supabase PostgreSQL real","accounts":verified,"browser":False}
    if args.browser:
        from playwright.sync_api import sync_playwright
        api_env=dict(os.environ,**env)
        api_env["FRONTEND_ORIGINS"]="http://127.0.0.1:3199"
        front_env=dict(os.environ,NEXT_PUBLIC_SUPABASE_URL=env["SUPABASE_URL"],
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=env["SUPABASE_PUBLISHABLE_KEY"],
            NEXT_PUBLIC_API_URL="http://127.0.0.1:5198",SCHEDULE_NEXT_DIST_DIR=".next-smoke",
            NEXT_TELEMETRY_DISABLED="1")
        processes=[]; logs=[]
        try:
            for name,cmd,cwd,process_env,url in [
                ("api",[sys.executable,"-m","uvicorn","app.main:app","--host","127.0.0.1","--port","5198"],ROOT/"backend",api_env,"http://127.0.0.1:5198/health"),
                ("frontend",["npm","run","dev","--","--hostname","127.0.0.1","--port","3199"],ROOT/"frontend",front_env,"http://127.0.0.1:3199")]:
                log=(ROOT/"verification"/f"hosted-{name}.log").open("w");logs.append(log)
                process=subprocess.Popen(cmd,cwd=cwd,env=process_env,stdout=log,stderr=log,start_new_session=True);processes.append(process)
                for _ in range(60):
                    try:
                        urllib.request.urlopen(url,timeout=2)
                        break
                    except Exception:
                        if process.poll() is not None:
                            raise RuntimeError(name+" server exited; inspect log")
                        time.sleep(.5)
                else:
                    raise RuntimeError(name+" startup timed out")
            with sync_playwright() as p:
                browser=p.chromium.launch()
                for role in ("STAFF","HEAD","TEACHER"):
                    account=next(a for a in credentials["accounts"] if a["role"]==role)
                    page=browser.new_page(viewport={"width":1440,"height":1000})
                    page.goto("http://127.0.0.1:3199")
                    page.get_by_label("Email",exact=True).fill(account["email"])
                    page.get_by_label("Mật khẩu",exact=True).fill(account["password"])
                    page.get_by_role("button",name="Đăng nhập",exact=True).click()
                    page.get_by_role("button",name="Đăng xuất",exact=True).wait_for()
                    if role=="STAFF":
                        page.get_by_role("button",name="Phòng học",exact=True).click()
                        page.get_by_role("heading",name="Phòng học & lịch chiếm dụng",exact=True).wait_for()
                    else:
                        assert page.get_by_role("button",name="Phòng học",exact=True).count()==0
                        page.get_by_role("button",name="Lịch của tôi",exact=True).click()
                        page.get_by_role("heading",name="Lịch giảng dạy chính thức",exact=True).wait_for()
                    page.screenshot(path=str(ROOT/"verification"/f"ui-hosted-{role.lower()}.png"),full_page=True)
                    page.close()
                browser.close()
            result["browser"]=True
        finally:
            for process in reversed(processes):
                if process.poll() is None:
                    os.killpg(process.pid,signal.SIGTERM);process.wait(timeout=15)
            for log in logs:log.close()
    (ROOT/"verification/hosted-results.json").write_text(json.dumps(result,indent=2))
    print("PASS: real hosted Auth login/profile/workspace/RBAC for",len(verified),"accounts; Chromium:",result["browser"])


if __name__=="__main__":
    main()
