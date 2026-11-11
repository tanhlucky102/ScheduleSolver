from ..identity.policies import require_teacher_profile
from ..timetable.rules import evaluate

_eval_cache: dict[tuple[str, int], dict] = {}
_online_teachers: dict[str, set[str]] = {}


def get_cached_evaluation(workspace_id: str, revision: int, state):
    cache_key = (str(workspace_id), revision)
    if cache_key not in _eval_cache:
        if len(_eval_cache) > 200:
            _eval_cache.clear()
        _eval_cache[cache_key] = evaluate(state, state.draft)
    return _eval_cache[cache_key]


def visible(state, revision, p):
    require_teacher_profile(p, state)
    ws_key = str(p.workspace_id)
    online_set = _online_teachers.setdefault(ws_key, set())
    if p.teacher:
        online_set.add(p.teacher)
    online_list = sorted(t_id for t_id in online_set if any(t.id == t_id for t in state.teachers))

    if p.role == "STAFF":
        body = state.model_dump()
        body.pop("external")
        return {
            "has_publication": bool(state.published),
            "revision": revision,
            "online_teachers": online_list,
            "state": body,
            "evaluation": get_cached_evaluation(str(p.workspace_id), revision, state),
        }
    teacher_obj = next((t for t in state.teachers if p.teacher and t.id == p.teacher), None)
    personal_color_rules = (
        [c.model_dump() for c in teacher_obj.color_rules]
        if teacher_obj is not None and teacher_obj.color_rules
        else [c.model_dump() for c in state.config.color_rules]
    )

    if p.role == "HEAD":
        body = state.model_dump()
        dept_courses = {
            x["course"] for x in body["sessions"] if x["department"] == p.department
        } | {
            x["course"] for x in body["offerings"] if x["department"] == p.department
        }
        body["departments"] = [x for x in body["departments"] if x["id"] == p.department]
        body["teachers"] = [
            x for x in body["teachers"]
            if x["department"] == p.department
            or any(c in x.get("capabilities", {}) for c in dept_courses)
        ]
        body["sessions"] = [x for x in body["sessions"] if x["department"] == p.department]
        body["offerings"] = [x for x in body["offerings"] if x["department"] == p.department]
        body["draft"] = []
        body["published"] = [r for r in body["published"] if r["teacher"] == p.teacher]
        body["external"] = [r for r in body["external"] if r["teacher"] == p.teacher]
        return {
            "has_publication": bool(state.published),
            "revision": revision,
            "online_teachers": online_list,
            "color_rules": personal_color_rules,
            "term_config": {
                "term_name": state.config.term_name,
                "term_start_date": state.config.term_start_date,
                "term_end_date": state.config.term_end_date,
                "holidays": [h.model_dump() for h in state.config.holidays],
            },
            "state": body,
        }
    return {
        "has_publication": bool(state.published),
        "revision": revision,
        "online_teachers": online_list,
        "color_rules": personal_color_rules,
        "shift_rules": [s.model_dump() for s in state.config.shift_rules],
        "term_config": {
            "term_name": state.config.term_name,
            "term_start_date": state.config.term_start_date,
            "term_end_date": state.config.term_end_date,
            "holidays": [h.model_dump() for h in state.config.holidays],
        },
        "period_config": {
            "period_minutes": state.config.period_minutes,
            "break_minutes": state.config.break_minutes,
            "include_break": state.config.include_break,
            "first_period_start": state.config.first_period_start,
        },
        "state": {
            "published": [r for r in state.published if r["teacher"] == p.teacher],
            "external": [r.model_dump() for r in state.external if r.teacher == p.teacher],
        },
    }
