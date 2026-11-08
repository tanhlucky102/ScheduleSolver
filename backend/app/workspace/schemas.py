from pydantic import Field
from ..timetable.models import Model


class Command(Model):
    revision: int = Field(ge=0)
    payload: dict = Field(default_factory=dict)
