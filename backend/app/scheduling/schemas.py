from pydantic import Field
from ..timetable.models import Model


class Run(Model):
    iterations: int = Field(default=500, ge=1, le=5000)
    seed: int = 42
