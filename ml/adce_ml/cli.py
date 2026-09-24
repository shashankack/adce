#!/usr/bin/env python3
"""ADCE optional ML analyzer — stdin AnalyzeRequest JSON → stdout suggestions JSON."""

from __future__ import annotations

import json
import re
import sys
from typing import Any


def tokens(s: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", s.lower()) if len(t) >= 3}


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def label(art: dict[str, Any]) -> str:
    return art.get("path") or art.get("name") or ""


def main() -> None:
    req = json.load(sys.stdin)
    arts = {a["id"]: a for a in req.get("artifacts", [])}
    suggestions: list[dict[str, Any]] = []

    for c in req.get("conflicts", []):
        if c.get("category") != "DOCUMENTATION_MISMATCH":
            continue
        src = arts.get(c.get("sourceArtifactId") or "")
        tgt = arts.get(c.get("targetArtifactId") or "")
        if not src or not tgt:
            continue
        score = jaccard(tokens(label(src)), tokens(label(tgt)))
        if score >= 0.2:
            suggestions.append(
                {
                    "kind": "conflict_confidence",
                    "conflictId": c["id"],
                    "confidence": "LIKELY" if score > 0.45 else "POTENTIAL",
                    "score": score,
                    "reason": f"ML token similarity={score:.2f} between related artifacts",
                    "source": "ml",
                }
            )

    if req.get("mode") == "deep":
        docs = [a for a in req.get("artifacts", []) if a.get("type") == "DOCUMENTATION"]
        sources = [a for a in req.get("artifacts", []) if a.get("type") == "SOURCE"]
        existing = {
            (r["sourceArtifactId"], r["targetArtifactId"])
            for r in req.get("relationships", [])
        }
        for d in docs:
            for s in sources:
                if (d["id"], s["id"]) in existing:
                    continue
                score = jaccard(tokens(label(d)), tokens(label(s)))
                if score >= 0.5:
                    suggestions.append(
                        {
                            "kind": "semantic_conflict",
                            "artifactId": d["id"],
                            "targetArtifactId": s["id"],
                            "summary": (
                                f"Possible semantic link/conflict: "
                                f"{d.get('path')} ↔ {s.get('path')}"
                            ),
                            "score": score,
                            "confidence": "POTENTIAL",
                            "severity": "LOW",
                            "reason": "High path/name similarity without relationship",
                            "source": "ml",
                        }
                    )

    json.dump({"suggestions": suggestions}, sys.stdout)


if __name__ == "__main__":
    main()
