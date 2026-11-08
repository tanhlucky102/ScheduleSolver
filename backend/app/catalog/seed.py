"""Read optional teacher capabilities from the bundled catalog seed."""
import json
from pathlib import Path

SEED_PATH = Path(__file__).resolve().parents[3] / "data/fall2026/catalog_seed.json"


def teacher_capabilities(required: bool = False):
    if not SEED_PATH.exists():
        if required:
            raise ValueError("Không tìm thấy tệp năng lực giảng viên TKB gốc")
        return {}
    try:
        data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
        return {teacher["id"]: teacher.get("capabilities", {}) for teacher in data.get("teachers", [])}
    except Exception:
        if required:
            raise
        return {}
