"""Provision an isolated demonstration workspace and all three Supabase roles.
Default: write a reviewable manifest only. --apply requires backend DB/admin env.
No email delivery, legacy passwords, existing account edits, or auth bypass.
"""
import argparse
import json
import os
from pathlib import Path
import secrets
import sys
from uuid import UUID, uuid4
import httpx
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_args, **_kwargs):
        return False
from app.domain import State, Department, Teacher, Offering, split
from app.models import Workspace, Profile
from app import storage


def demo_state(seed_capabilities: bool | None = None):
    use_seed = ("--seed-capabilities" in sys.argv) if seed_capabilities is None else bool(seed_capabilities)
    offering = Offering(id="DEMO-COURSE", course="DEMO101", name="Demonstration course",
                        cohort="DEMO", department="DEMO", students=30,
                        lecture_periods=2, tutorial_periods=1, room="PROJECTOR")
    caps = {"DEMO101": ["LEC", "TUT"]} if use_seed else {}
    return State(departments=[Department(id="DEMO", name="Demonstration department", status="UNSENT")],
                 teachers=[Teacher(id=code, name=name, department="DEMO",
                                   capabilities=dict(caps))
                           for code, name in [("DEMO-HEAD", "Demo head"), ("DEMO-TEACHER", "Demo teacher")]],
                 offerings=[offering], sessions=split(offering))
    # Rooms deliberately absent: staff must supply confirmed room configuration.


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--approved-plan", action="store_true", help="Use approved 67-row plan and one head per department")
    parser.add_argument("--seed-capabilities", action="store_true", help="Optionally populate capabilities from catalog_seed.json")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--manifest", type=Path, default=Path("../data/demo/manifest.json"))
    parser.add_argument("--credentials", type=Path, help="New private credentials file, required with --apply")
    args = parser.parse_args()
    load_dotenv(Path(__file__).with_name(".env"))
    suffix = secrets.token_hex(4)
    accounts = [{"email": f"schedule-demo-{role.lower()}-{suffix}@example.com", "role": role,
                 "teacher": teacher, "department": department}
                for role, teacher, department in [("STAFF", None, None), ("HEAD", "DEMO-HEAD", "DEMO"), ("TEACHER", "DEMO-TEACHER", None)]]
    state = demo_state(seed_capabilities=args.seed_capabilities)
    if args.approved_plan:
        root = Path(__file__).resolve().parents[1]
        data = root / "data/fall2026"
        catalog_raw = json.loads((data / "catalog_seed.json").read_text(encoding="utf-8"))
        plan_raw = json.loads((data / "approved_plan.json").read_text(encoding="utf-8"))
        sessions_raw = json.loads((data / "approved_sessions.json").read_text(encoding="utf-8"))
        if not args.seed_capabilities:
            for t_item in catalog_raw.get("teachers", []):
                t_item["capabilities"] = {}
        unsent_depts = {
            d["id"] for d in catalog_raw.get("departments", [])
            if d.get("status", "UNSENT") == "UNSENT"
        }
        for s_item in sessions_raw:
            if s_item.get("department") in unsent_depts:
                s_item["teacher"] = None
        state = State.model_validate({
            **catalog_raw,
            **plan_raw,
            "sessions": sessions_raw,
        })
        import csv
        with (root / "resources/bo_mon.csv").open(encoding="utf-8-sig") as stream:
            heads = list(csv.DictReader(stream))
        accounts = [{"email": f"schedule-demo-staff-{suffix}@example.com", "role": "STAFF", "teacher": None, "department": None}]
        accounts.extend({"email": f"schedule-demo-head-{r['ma_bm'].lower()}-{suffix}@example.com",
                         "role": "HEAD", "teacher": r["truong_bo_mon"], "department": r["ma_bm"]} for r in heads)
        accounts.append({"email": f"schedule-demo-teacher-{suffix}@example.com", "role": "TEACHER", "teacher": "KhoaTN", "department": None})
    manifest = {"mode": "APPROVED_PLAN_DEMO" if args.approved_plan else "DEMO_ONLY", "accounts_created": False, "workspace_name": "Demo " + suffix,
                "accounts": accounts, "state": state.model_dump()}
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    if args.apply:
        required = ("DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
        if not all(os.environ.get(k) for k in required) or not args.credentials:
            parser.error("--apply requires DB, Supabase admin environment and --credentials")
        # Reserve the new private output before any remote mutation.
        fd = os.open(args.credentials, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        created = []
        try:
            base = os.environ["SUPABASE_URL"].rstrip("/") + "/auth/v1/admin/users"
            key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
            with httpx.Client(headers={"apikey": key, "Authorization": "Bearer " + key}, timeout=20) as client:
                try:
                    for account in accounts:
                        password = secrets.token_urlsafe(24)
                        response = client.post(base, json={"email": account["email"], "password": password, "email_confirm": True})
                        response.raise_for_status()
                        uid = response.json()["id"]
                        created.append({"id": uid, **account, "password": password})
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
            os.write(fd, json.dumps({"workspace_id": manifest["workspace_id"], "accounts": created}, indent=2).encode())
        finally:
            os.close(fd)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Manifest:", args.manifest, "Accounts created:", manifest["accounts_created"])


if __name__ == "__main__":
    main()
