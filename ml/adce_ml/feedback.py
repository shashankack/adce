from __future__ import annotations

import json, os

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ALLOWED_ACTIONS = frozenset({"confirm", "reject", "resolve", "ignore"})

REWARDS = {
    "confirm": 1.0,
    "resolve": 0.5,
    "reject": -1.0,
    "ignore": -0.5,
}


def feedback_log_path() -> Path:
    raw = os.environ.get("ADCE_FEEDBACK_PATH")
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent.parent / "data" / "feedback.jsonl"


def append_feedback(event: dict[str, Any]) -> dict[str, Any]:
    action = str(event.get("action") or "").strip().lower()
    if action not in ALLOWED_ACTIONS:
        raise ValueError(f"Action must be one of {sorted(ALLOWED_ACTIONS)}")

    score = event.get("score")
    if score is not None:
        try:
            score = float(score)
        except (TypeError, ValueError):
            score = None

    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "event": event,
        "reward": REWARDS[action],
        "conflictId": event.get("conflictId"),
        "category": event.get("category"),
        "severity": event.get("severity"),
        "confidence": event.get("confidence"),
        "summary": event.get("summary"),
        "sourceArtifactId": event.get("sourceArtifactId"),
        "targetArtifactId": event.get("targetArtifactId"),
        "projectHash": event.get("projectHash"),
        "embedder": event.get("embedder"),
        "score": score,
    }

    path = feedback_log_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record
