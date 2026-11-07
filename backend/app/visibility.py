from .policies import require_teacher_profile
from .domain_rules import evaluate

_eval_cache: dict[tuple[str, int], dict] = {}


def get_cached_evaluation(workspace_id: str, revision: int, state):
    cache_key = (str(workspace_id), revision)
    if cache_key not in _eval_cache:
        if len(_eval_cache) > 200:
            _eval_cache.clear()
        _eval_cache[cache_key] = evaluate(state, state.draft)
    return _eval_cache[cache_key]


def visible(state, revision, p):
    require_teacher_profile(p, state)
    if p.role == "STAFF":
        body = state.model_dump()
        body.pop("external")
        return {
            "has_publication": bool(state.published),
            "revision": revision,
            "state": body,
            "evaluation": get_cached_evaluation(str(p.workspace_id), revision, state),
        }
    if p.role == "HEAD":
        body = state.model_dump()
        for key in ("departments", "teachers"):
            body[key] = [x for x in body[key] if x.get("department", x.get("id")) == p.department]
        body["sessions"] = [x for x in body["sessions"] if x["department"] == p.department]
        body["offerings"] = [x for x in body["offerings"] if x["department"] == p.department]
        body["draft"] = []
        body["published"] = [r for r in body["published"] if r["teacher"] == p.teacher]
        body["external"] = [r for r in body["external"] if r["teacher"] == p.teacher]
        return {"has_publication": bool(state.published), "revision": revision, "state": body}
    return {"has_publication": bool(state.published), "revision": revision, "state": {
        "published": [r for r in state.published if r["teacher"] == p.teacher],
        "external": [r.model_dump() for r in state.external if r.teacher == p.teacher]}}
