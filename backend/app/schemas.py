from pydantic import Field
from .domain_models import Model, Department, Teacher

class Command(Model):
    revision: int = Field(ge=0)
    payload: dict = Field(default_factory=dict)


class Catalog(Model):
    departments: list[Department]
    teachers: list[Teacher]


class Assign(Model):
    session: str
    teacher: str


class TeacherUpdate(Model):
    teacher: str
    assistant: bool
    capabilities: dict[str, list[str]]


class Return(Model):
    note: str = Field(min_length=1, max_length=1000)


class Run(Model):
    iterations: int = Field(default=500, ge=1, le=5000)
    seed: int = 42
