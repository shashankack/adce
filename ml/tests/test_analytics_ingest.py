"""Privacy tests for /v1/analytics ingest validation."""

from __future__ import annotations

import pytest

from adce_ml.analytics_ingest import (
    find_forbidden_key,
    validate_analytics_bundle,
)


def _ok_bundle(**overrides):
    base = {
        "schemaVersion": 1,
        "projectId": "a" * 32,
        "sentAt": "2026-01-01T00:00:00Z",
        "metrics": [
            {
                "projectId": "a" * 32,
                "ts": "2026-01-01T00:00:00Z",
                "tokensFull": 10,
                "taskPresent": False,
            }
        ],
        "feedback": [
            {
                "projectId": "a" * 32,
                "ts": "2026-01-01T00:00:00Z",
                "action": "confirm",
                "conflictId": "c1",
                "summary": "temporal drift",
            }
        ],
        "events": [
            {
                "kind": "conflict",
                "projectId": "a" * 32,
                "category": "TEMPORAL_MISMATCH",
                "sourcePathPattern": "src/**/*.ts",
                "summary": "old vs new",
            }
        ],
    }
    base.update(overrides)
    return base


def test_accepts_clean_bundle() -> None:
    validate_analytics_bundle(_ok_bundle())


def test_rejects_files_key() -> None:
    with pytest.raises(ValueError, match="Full repository|Forbidden"):
        validate_analytics_bundle(_ok_bundle(files=[{"path": "x.ts"}]))


def test_rejects_excerpt_nested() -> None:
    bad = _ok_bundle()
    bad["metrics"][0]["excerpt"] = "export const secret = 1"
    assert find_forbidden_key(bad) == "metrics[0].excerpt"
    with pytest.raises(ValueError, match="Forbidden key"):
        validate_analytics_bundle(bad)


def test_rejects_absolute_path_in_summary() -> None:
    bad = _ok_bundle()
    bad["feedback"][0]["summary"] = r"See C:\Users\alice\proj\src\x.ts"
    with pytest.raises(ValueError, match="path/content leak"):
        validate_analytics_bundle(bad)


def test_rejects_raw_relative_path_pattern() -> None:
    bad = _ok_bundle()
    bad["events"][0]["sourcePathPattern"] = "src/auth/login.ts"
    with pytest.raises(ValueError, match="path/content leak"):
        validate_analytics_bundle(bad)
