import csv
from test_api import api
import hashlib
import importlib.util
import json
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]


def test_resource_snapshot_and_catalog():
    # Verify the copied snapshot, without re-analysing the reference FIT workbook.
    manifest = json.loads((ROOT / "data/fall2026/resource_sha256.json").read_text())
    for name, digest in manifest.items():
        path = ROOT / "resources" / name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
    from app.domain import State
    catalog = json.loads((ROOT / "data/fall2026/catalog_seed.json").read_text())
    state = State.model_validate(catalog)
    assert len(state.teachers) == 35 and len(state.departments) == 4
    assert not state.rooms


def test_approved_67_rows_import_without_losing_rules(api):
    from app.domain import Offering, split
    from test_api import post
    client, _ = api
    # Preview validates every optional count/combined/room field without writes.
    with (ROOT / "data/fall2026/approved_plan.xlsx").open("rb") as f:
        response = client.post("/api/import/preview", files={"file": ("plan.xlsx", f.read())})
    assert response.status_code == 200
    preview = response.json()
    assert preview["can_import"] and not preview["errors"]
    assert len(preview["offerings"]) == 67
    sessions = [s for row in preview["offerings"] for s in split(Offering.model_validate(row))]
    assert len(sessions) == 290
    for row in preview["offerings"]:
        generated = split(Offering.model_validate(row))
        if row["combined"]:
            assert {s.kind for s in generated} == {"COMBINED"}
            assert sum(s.students for s in generated) == row["students"]
        else:
            for kind, field in [("LEC","lecture_periods"),("TUT","tutorial_periods")]:
                subset = [s for s in generated if s.kind == kind]
                assert sum(s.students for s in subset) == (row["students"] if row[field] else 0)
                expected_room = row["lecture_room"] if kind == "LEC" else row["tutorial_room"]
                assert all(s.room == expected_room for s in subset)
        if row["course"] in ("61FIT3SAD","61MME4ADC"):
            assert sum(s.kind=="LEC" for s in generated) == 2
            assert sum(s.kind=="TUT" for s in generated) == 5
    assert client.get("/api/workspace").json()["revision"] == 0
