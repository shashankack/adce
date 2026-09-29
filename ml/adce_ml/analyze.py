"""Shared suggestion logic for HTTP and stdin CLI — MiniLM (or hashing) similarity."""

from __future__ import annotations

from typing import Any

from adce_ml.embedder import artifact_text, cosine, get_embedder
from adce_ml.bandit import rank_suggestions


def _similarity(a: dict[str, Any], b: dict[str, Any]) -> tuple[float, str]:
    emb = get_embedder()
    score = cosine(emb.embed(artifact_text(a)), emb.embed(artifact_text(b)))
    return score, emb.name


def analyze_request(req: dict[str, Any]) -> list[dict[str, Any]]:
    """Accept AnalyzeRequest-shaped JSON; return suggestion dicts."""
    arts = {a["id"]: a for a in req.get("artifacts", [])}
    suggestions: list[dict[str, Any]] = []

    for c in req.get("conflicts", []):
        if c.get("category") != "DOCUMENTATION_MISMATCH":
            continue
        src = arts.get(c.get("sourceArtifactId") or "")
        tgt = arts.get(c.get("targetArtifactId") or "")
        if not src or not tgt:
            continue
        score, model = _similarity(src, tgt)
        if score >= 0.25:
            suggestions.append(
                {
                    "kind": "conflict_confidence",
                    "conflictId": c["id"],
                    "confidence": "LIKELY" if score > 0.55 else "POTENTIAL",
                    "category": c.get("category"),
                    "score": score,
                    "reason": (
                        f"ML {model} embedding cosine={score:.2f} "
                        "between related artifacts"
                    ),
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
                score, model = _similarity(d, s)
                if score >= 0.55:
                    suggestions.append(
                        {
                            "kind": "semantic_conflict",
                            "artifactId": d["id"],
                            "targetArtifactId": s["id"],
                            "category": "SEMANTIC_CONFLICT",
                            "summary": (
                                f"Possible semantic link/conflict: "
                                f"{d.get('path')} ↔ {s.get('path')}"
                            ),
                            "score": score,
                            "confidence": "POTENTIAL",
                            "severity": "LOW",
                            "reason": (
                                f"ML {model} embedding cosine={score:.2f} "
                                "without relationship"
                            ),
                            "source": "ml",
                        }
                    )

    return rank_suggestions(suggestions)
