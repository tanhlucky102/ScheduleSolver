from typing import Literal
from pydantic import Field
from ..timetable.models import Model


class Run(Model):
    iterations: int = Field(default=500, ge=1, le=5000)
    seed: int = 42
    algorithm: Literal["PORTFOLIO", "HC", "SA", "TABU"] = "PORTFOLIO"
    threads: int = Field(default=3, ge=1, le=16)
