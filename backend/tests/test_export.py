from io import BytesIO
from openpyxl import load_workbook
from app.exporter import workbook
from app.domain import Placement, publish
from test_domain import ready

def test_export_sheets_and_snapshot():
    state=ready()
    state.draft=[Placement(session=s.id,slot=i,room_id="R1") for i,s in enumerate(state.sessions)]
    publish(state)
    state.sessions[0].teacher="changed"
    book=load_workbook(BytesIO(workbook(state,"published")))
    assert book.sheetnames==["Danh sách lớp","IT + MME","IT CLC + TT","Đánh giá"]
    assert book["Danh sách lớp"].cell(2,9).value=="t"
