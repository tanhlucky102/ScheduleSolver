"""Provision an isolated demonstration workspace and all three Supabase roles.
Default: write a reviewable manifest only. --apply requires backend DB/admin env.
No email delivery, legacy passwords, existing account edits, or auth bypass.
"""
import argparse
import json
import os
from pathlib import Path
import secrets
from uuid import UUID, uuid4
import httpx
from dotenv import load_dotenv
from app.domain import State, Department, Teacher, Offering, split
from app.models import Workspace, Profile
from app import storage


def demo_state():
    offering = Offering(id="DEMO-COURSE", course="DEMO101", name="Demonstration course",
                        cohort="DEMO", department="DEMO", students=30,
                        lecture_periods=2, tutorial_periods=1, room="PROJECTOR")
    return State(departments=[Department(id="DEMO", name="Demonstration department")],
                 teachers=[Teacher(id=code, name=name, department="DEMO",
                                   capabilities={"DEMO101": ["LEC","TUT"]})
                           for code, name in [("DEMO-HEAD","Demo head"),("DEMO-TEACHER","Demo teacher")]],
                 offerings=[offering], sessions=split(offering))
    # Rooms deliberately absent: staff must supply confirmed room configuration.


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--approved-plan", action="store_true", help="Use approved 67-row plan and one head per department")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--manifest", type=Path, default=Path("../data/demo/manifest.json"))
    parser.add_argument("--credentials", type=Path, help="New private credentials file, required with --apply")
    args = parser.parse_args()
    load_dotenv(Path(__file__).with_name(".env"))
    suffix = secrets.token_hex(4)
    accounts = [{"email": f"schedule-demo-{role.lower()}-{suffix}@example.com", "role": role,
                 "teacher": teacher, "department": department}
                for role, teacher, department in [("STAFF",None,None),("HEAD","DEMO-HEAD","DEMO"),("TEACHER","DEMO-TEACHER",None)]]
    state = demo_state()
    if args.approved_plan:
        root = Path(__file__).resolve().parents[1]
        data = root / "data/fall2026"
        state = State.model_validate({**json.loads((data/"catalog_seed.json").read_text()),
                                      **json.loads((data/"approved_plan.json").read_text()),
                                      "sessions":json.loads((data/"approved_sessions.json").read_text())})
        import csv
        with (root/"resources/bo_mon.csv").open(encoding="utf-8-sig") as stream:
            heads = list(csv.DictReader(stream))
        accounts = [{"email":f"schedule-demo-staff-{suffix}@example.com","role":"STAFF","teacher":None,"department":None}]
        accounts.extend({"email":f"schedule-demo-head-{r['ma_bm'].lower()}-{suffix}@example.com",
                         "role":"HEAD","teacher":r["truong_bo_mon"],"department":r["ma_bm"]} for r in heads)
        accounts.append({"email":f"schedule-demo-teacher-{suffix}@example.com","role":"TEACHER","teacher":"KhoaTN","department":None})
    manifest = {"mode": "APPROVED_PLAN_DEMO" if args.approved_plan else "DEMO_ONLY", "accounts_created": False, "workspace_name": "Demo " + suffix,
                "accounts": accounts, "state": state.model_dump()}
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    if args.apply:
        required = ("DATABASE_URL","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY")
        if not all(os.environ.get(k) for k in required) or not args.credentials:
            parser.error("--apply requires DB, Supabase admin environment and --credentials")
        # Reserve the new private output before any remote mutation.
        fd = os.open(args.credentials, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        created = []
        try:
            base = os.environ["SUPABASE_URL"].rstrip("/") + "/auth/v1/admin/users"
            key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
            with httpx.Client(headers={"apikey":key,"Authorization":"Bearer "+key}, timeout=20) as client:
                try:
                    for account in accounts:
                        password = secrets.token_urlsafe(24)
                        response = client.post(base, json={"email":account["email"],"password":password,"email_confirm":True})
                        response.raise_for_status()
                        uid = response.json()["id"]
                        created.append({"id":uid, **account, "password":password})
                    with storage.get_session() as session:
                        workspace = Workspace(id=uuid4(), name=manifest["workspace_name"],
                                              revision=0, body=manifest["state"])
                        session.add(workspace); session.flush()
                        for user in created:
                            session.add(Profile(id=UUID(user["id"]), workspace_id=workspace.id, role=user["role"],
                                                teacher=user["teacher"], department=user["department"]))
                        manifest["workspace_id"] = str(workspace.id)
                    manifest["accounts_created"] = True
                except Exception:
                    # Delete only accounts newly created by this invocation.
                    for user in created:
                        client.delete(base + "/" + user["id"])
                    raise
            os.write(fd, json.dumps({"workspace_id":manifest["workspace_id"],"accounts":created}, indent=2).encode())
        finally:
            os.close(fd)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Manifest:", args.manifest, "Accounts created:", manifest["accounts_created"])


if __name__ == "__main__":
    main()
