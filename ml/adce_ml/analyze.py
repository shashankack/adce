"""Shared suggestion logic for HTTP and stdin CLI — MiniLM (or hashing) similarity."""

from __future__ import annotations

from typing import Any

from adce_ml.bandit import rank_suggestions
from adce_ml.embedder import artifact_text, cosine, get_embedder

# Deterministic detectors already found these; ML re-ranks / confirms.
_CONFIDENCE_CATEGORIES = frozenset(
    {
        "DOCUMENTATION_MISMATCH",
        "STRUCTURAL_MISMATCH",
        "SCHEMA_MISMATCH",
        "CONFIGURATION_MISMATCH",
        "TEMPORAL_MISMATCH",
        "SEMANTIC_CONFLICT",
    }
)

# Deep mode: look for missing semantic edges between these type pairs.
_DEEP_TYPE_PAIRS = (
    ("DOCUMENTATION", "SOURCE"),
    ("DOCUMENTATION", "SCHEMA"),
    ("SCHEMA", "CONFIGURATION"),
    ("SCHEMA", "SOURCE"),
    ("SPEC", "SOURCE"),
)

_CONFIDENCE_MIN = 0.25
_DEEP_MIN = 0.40
_DEEP_MAX = 12


def _similarity(a: dict[str, Any], b: dict[str, Any]) -> tuple[float, str]:
    emb = get_embedder()
    score = cosine(emb.embed(artifact_text(a)), emb.embed(artifact_text(b)))
    return score, emb.name


def _conflict_similarity(
    src: dict[str, Any],
    tgt: dict[str, Any],
    conflict: dict[str, Any],
) -> tuple[float, str]:
    """Blend artifact paths with conflict summary for stronger path-only signal."""
    emb = get_embedder()
    summary = str(conflict.get("summary") or "")
    left = f"{artifact_text(src)} {summary}".strip()
    right = f"{artifact_text(tgt)} {summary}".strip()
    score = cosine(emb.embed(left), emb.embed(right))
    return score, emb.name


def analyze_request(req: dict[str, Any]) -> list[dict[str, Any]]:
    """Accept AnalyzeRequest-shaped JSON; return suggestion dicts."""
    arts = {a["id"]: a for a in req.get("artifacts", [])}
    suggestions: list[dict[str, Any]] = []

    for c in req.get("conflicts", []):
        if c.get("category") not in _CONFIDENCE_CATEGORIES:
            continue
        src = arts.get(c.get("sourceArtifactId") or "")
        tgt = arts.get(c.get("targetArtifactId") or "")
        if not src or not tgt:
            continue
        score, model = _conflict_similarity(src, tgt, c)
        if score >= _CONFIDENCE_MIN:
            suggestions.append(
                {
                    "kind": "conflict_confidence",
                    "conflictId": c["id"],
                    "confidence": "LIKELY" if score > 0.55 else "POTENTIAL",
                    "category": c.get("category"),
                    "score": score,
                    "reason": (
                        f"ML {model} embedding cosine={score:.2f} "
                        f"on {c.get('category')} pair"
                    ),
                    "source": "ml",
                }
            )

    if req.get("mode") == "deep":
        by_type: dict[str, list[dict[str, Any]]] = {}
        for a in req.get("artifacts", []):
            by_type.setdefault(str(a.get("type") or ""), []).append(a)

        existing = {
            (r["sourceArtifactId"], r["targetArtifactId"])
            for r in req.get("relationships", [])
        }
        existing |= {(b, a) for a, b in list(existing)}

        deep: list[dict[str, Any]] = []
        for left_t, right_t in _DEEP_TYPE_PAIRS:
            for left in by_type.get(left_t, []):
                for right in by_type.get(right_t, []):
                    if left["id"] == right["id"]:
                        continue
                    if (left["id"], right["id"]) in existing:
                        continue
                    score, model = _similarity(left, right)
                    if score < _DEEP_MIN:
                        continue
                    deep.append(
                        {
                            "kind": "semantic_conflict",
                            "artifactId": left["id"],
                            "targetArtifactId": right["id"],
                            "category": "SEMANTIC_CONFLICT",
                            "summary": (
                                f"Possible semantic link/conflict: "
                                f"{left.get('path')} ↔ {right.get('path')}"
                            ),
                            "score": score,
                            "confidence": "POTENTIAL",
                            "severity": "LOW",
                            "reason": (
                                f"ML {model} embedding cosine={score:.2f} "
                                f"({left_t}↔{right_t}) without relationship"
                            ),
                            "source": "ml",
                        }
                    )

        deep.sort(key=lambda s: float(s.get("score") or 0), reverse=True)
        suggestions.extend(deep[:_DEEP_MAX])

    return rank_suggestions(suggestions)
