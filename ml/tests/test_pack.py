"""Smoke tests for context packing (hashing embedder — no MiniLM download)."""

from __future__ import annotations

import os

os.environ["ADCE_EMBEDDER"] = "hashing"

from adce_ml.pack import pack_brief  # noqa: E402


def test_pack_reorders_by_task_similarity() -> None:
    body = {
        "task": "fix openapi schema drift",
        "brief": {
            "mustRead": [
                {
                    "id": "a1",
                    "path": "README.md",
                    "name": "README.md",
                    "type": "DOCUMENTATION",
                    "score": 10,
                    "reason": "docs",
                },
                {
                    "id": "a2",
                    "path": "openapi.yaml",
                    "name": "openapi.yaml",
                    "type": "API_SPEC",
                    "score": 8,
                    "reason": "spec",
                },
            ],
            "caution": [
                {
                    "conflictId": "c1",
                    "severity": "LOW",
                    "category": "TEMPORAL_MISMATCH",
                    "summary": "old",
                    "artifactIds": [],
                },
                {
                    "conflictId": "c2",
                    "severity": "HIGH",
                    "category": "SCHEMA_MISMATCH",
                    "summary": "schema",
                    "artifactIds": [],
                },
            ],
            "trustOrder": [],
            "alsoRelevant": [],
        },
    }
    out = pack_brief(body)
    assert out["engine"] == "pack"
    assert out["embedder"] == "hashing"
    caution = out["brief"]["caution"]
    assert caution[0]["severity"] == "HIGH"
    must = out["brief"]["mustRead"]
    assert len(must) == 2
    assert "packScore" in must[0]
