"""Create an empty term and bind one EXISTING Supabase Auth staff user using SQLAlchemy ORM.
Usage: python bootstrap.py --staff-user UUID --name Fall2026
Run after migration with private DATABASE_URL in the environment.
Other profiles must be provisioned by the database operator after catalog import.
"""
import argparse
from uuid import UUID
from app.domain import State
from app.models import Workspace, Profile
from app import storage

parser = argparse.ArgumentParser()
parser.add_argument("--staff-user", type=UUID, required=True)
parser.add_argument("--name", required=True)
args = parser.parse_args()

with storage.get_session() as session:
    workspace = Workspace(name=args.name, body=State().model_dump(), revision=0)
    session.add(workspace)
    session.flush()
    profile = Profile(id=args.staff_user, workspace_id=workspace.id, role="STAFF")
    session.add(profile)
    session.commit()
    print("Workspace:", workspace.id)
