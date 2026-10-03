"""Privacy-locked analytics ingest for /v1/analytics."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

FORBIDDEN_KEYS = frozenset(
    {
        "files",
        "repoArchive",
        "fullTree",
        "content",
        "excerpt",
        "source",
        "body",
        "diff",
        "evidence",
        "patch",
        "code",
        "text",
        "repo",
        "archive",
    }
)

# Absolute / home-dir style paths in string values
_ABS_PATH = (
    r"(?:[A-Za-z]:\\|/(?:Users|home|var|tmp|private)/)"
)

MAX_BODY_BYTES = 2_000_000
MAX_SUMMARY_LEN = 240


def analytics_log_path() -> Path:
    raw = os.environ.get("ADCE_ANALYTICS_PATH")
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent.parent / "data" / "analytics" / "ingest.jsonl"


def find_forbidden_key(value: Any, path: str = "") -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        for i, item in enumerate(value):
            hit = find_forbidden_key(item, f"{path}[{i}]")
            if hit:
                return hit
        return None
    if isinstance(value, dict):
        for k, v in value.items():
            if k in FORBIDDEN_KEYS:
                return f"{path}.{k}" if path else k
            hit = find_forbidden_key(v, f"{path}.{k}" if path else k)
            if hit:
                return hit
    return None


def _looks_like_abs_path(s: str) -> bool:
    import re

    if re.search(_ABS_PATH, s):
        return True
    # Multi-segment relative file paths with extensions (raw path leak)
    if re.search(r"(?:^|[\s])(?:[\w.-]+/){2,}[\w.-]+\.[a-zA-Z0-9]{1,8}\b", s):
        return True
    return False


def find_path_leak(value: Any, path: str = "") -> str | None:
    """Reject string values that look like absolute or deep relative file paths."""
    if isinstance(value, str):
        # Allowed coarse patterns: top/**/*.ext or *.ext
        if "/**/*" in value or value.startswith("*."):
            return None
        if _looks_like_abs_path(value):
            return path or "(string)"
        return None
    if isinstance(value, list):
        for i, item in enumerate(value):
            hit = find_path_leak(item, f"{path}[{i}]")
            if hit:
                return hit
        return None
    if isinstance(value, dict):
        for k, v in value.items():
            # projectId / ids / enums are fine
            if k in {
                "projectId",
                "conflictId",
                "schemaVersion",
                "sentAt",
                "ts",
                "action",
                "category",
                "severity",
                "confidence",
                "lifecycle",
                "embedder",
                "estimator",
                "kind",
                "sourceType",
                "targetType",
            }:
                continue
            if k in {"summary"} and isinstance(v, str):
                if len(v) > MAX_SUMMARY_LEN:
                    return f"{path}.{k}" if path else k
                if _looks_like_abs_path(v):
                    return f"{path}.{k}" if path else k
                continue
            if k.endswith("PathPattern") and isinstance(v, str):
                if "/**/*" in v or v.startswith("*") or v == "*":
                    continue
                return f"{path}.{k}" if path else k
            hit = find_path_leak(v, f"{path}.{k}" if path else k)
            if hit:
                return hit
    return None


def validate_analytics_bundle(body: dict[str, Any]) -> None:
    if body.get("files") or body.get("repoArchive") or body.get("fullTree"):
        raise ValueError("Full repository payloads are forbidden")

    raw = json.dumps(body, ensure_ascii=False)
    if len(raw.encode("utf-8")) > MAX_BODY_BYTES:
        raise ValueError("Analytics payload too large")

    if body.get("schemaVersion") != 1:
        raise ValueError("schemaVersion must be 1")

    if not isinstance(body.get("projectId"), str) or len(body["projectId"]) < 8:
        raise ValueError("projectId required")

    for key in ("metrics", "feedback", "events"):
        if key not in body or not isinstance(body[key], list):
            raise ValueError(f"{key} must be a list")

    forbidden = find_forbidden_key(body)
    if forbidden:
        raise ValueError(f"Forbidden key in payload: {forbidden}")

    leak = find_path_leak(body)
    if leak:
        raise ValueError(f"Possible path/content leak at {leak}")


def append_analytics_ingest(body: dict[str, Any]) -> Path:
    path = analytics_log_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "projectId": body.get("projectId"),
        "metrics": len(body.get("metrics") or []),
        "feedback": len(body.get("feedback") or []),
        "events": len(body.get("events") or []),
        "bundle": body,
    }
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return path
