from ..timetable.models import Model, Department, Teacher


class Catalog(Model):
    departments: list[Department]
    teachers: list[Teacher]
