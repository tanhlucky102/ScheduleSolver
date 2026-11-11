from pydantic import Field
from ..timetable.models import Model


class Assign(Model):
    session: str
    teacher: str


class TeacherUpdate(Model):
    teacher: str
    assistant: bool
    active: bool | None = None
    capabilities: dict[str, list[str]]


class Return(Model):
    note: str = Field(min_length=1, max_length=1000)
