from io import BytesIO
from openpyxl import Workbook
from test_api import api


def test_preview_diagnostics_and_no_mutation(api):
    client,p=api
    book=Workbook()
    from app.domain import Offering
    keys=list(Offering.model_fields)
    book.active.append(keys)
    row=dict(id="A",course="CS",name="Course",cohort="K",department="D",students=-1,
             lecture_periods=2,tutorial_periods=1,room="PROJECTOR",program="STANDARD")
    book.active.append([row.get(k) for k in keys])
    output=BytesIO();book.save(output)
    response=client.post("/api/import/preview",files={"file":("plan.xlsx",output.getvalue())})
    assert response.status_code==200
    assert response.json()["errors"][0]["row"]==2
    assert not response.json()["can_import"]
    assert client.get("/api/workspace").json()["revision"]==0
    p.role="TEACHER";p.teacher="t"
    assert client.post("/api/import/preview",files={"file":("plan.xlsx",output.getvalue())}).status_code==403


def test_preview_vietnamese_excel_headers(api):
    client, p = api
    p.role = "STAFF"; p.teacher = None
    from pathlib import Path
    ke_hoach_path = Path(__file__).resolve().parents[2] / "resources/ke_hoach_mo_lop_HK1_2026.xlsx"
    with open(ke_hoach_path, "rb") as f:
        res = client.post("/api/import/preview", files={"file": ("ke_hoach.xlsx", f.read())})
    assert res.status_code == 200
    data = res.json()
    assert data["can_import"] is True
    assert len(data["errors"]) == 0
    assert len(data["offerings"]) == 67
