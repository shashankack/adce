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

# Deep mode: missing edges → relationship suggestions (type pair → edge type).
# Do NOT suggest BUILD/CONFIGURATION → every SOURCE (tsconfig fan-out);
# those files configure the project, not a specific source file.
_DEEP_TYPE_PAIRS = (
    ("DOCUMENTATION", "SOURCE", "DOCUMENTS"),
    ("DOCUMENTATION", "SCHEMA", "DOCUMENTS"),
    ("DOCUMENTATION", "API_SPEC", "DOCUMENTS"),
    ("SCHEMA", "CONFIGURATION", "CONFIGURES"),
    ("SCHEMA", "SOURCE", "SPECIFIES"),
    ("API_SPEC", "SOURCE", "SPECIFIES"),
    ("SPECIFICATION", "SOURCE", "SPECIFIES"),
    ("TEST", "SOURCE", "TESTS"),
)

_CONFIDENCE_MIN = 0.25
_DEEP_MIN = 0.42
_DEEP_MAX = 24
_META_DOC = frozenset(
    {"agents.md", "claude.md", "gemini.md", "license.md", "licence.md"}
)


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

        # Any existing edge (incl. REJECTED) suppresses re-suggestion.
        existing = {
            (r["sourceArtifactId"], r["targetArtifactId"], str(r.get("type") or ""))
            for r in req.get("relationships", [])
        }
        existing_pair = {
            (r["sourceArtifactId"], r["targetArtifactId"])
            for r in req.get("relationships", [])
        }
        existing_pair |= {(b, a) for a, b in list(existing_pair)}

        deep: list[dict[str, Any]] = []
        for left_t, right_t, rel_type in _DEEP_TYPE_PAIRS:
            for left in by_type.get(left_t, []):
                left_path = str(left.get("path") or left.get("name") or "").lower()
                left_base = left_path.rsplit("/", 1)[-1]
                if left_base in _META_DOC or left_base.endswith(".mdc"):
                    continue
                for right in by_type.get(right_t, []):
                    if left["id"] == right["id"]:
                        continue
                    if (left["id"], right["id"]) in existing_pair:
                        continue
                    if (left["id"], right["id"], rel_type) in existing:
                        continue
                    score, model = _similarity(left, right)
                    if score < _DEEP_MIN:
                        continue
                    deep.append(
                        {
                            "kind": "relationship",
                            "artifactId": left["id"],
                            "targetArtifactId": right["id"],
                            "relationshipType": rel_type,
                            "summary": (
                                f"{left.get('path')} --{rel_type}--> "
                                f"{right.get('path')}"
                            ),
                            "score": score,
                            "confidence": "LIKELY" if score >= 0.55 else "POTENTIAL",
                            "reason": (
                                f"ML {model} cosine={score:.2f} suggests "
                                f"{rel_type} ({left_t}→{right_t})"
                            ),
                            "source": "ml",
                        }
                    )

        deep.sort(key=lambda s: float(s.get("score") or 0), reverse=True)
        suggestions.extend(deep[:_DEEP_MAX])

    return rank_suggestions(suggestions)
