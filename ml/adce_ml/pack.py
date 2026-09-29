"""Context packing — reorder / annotate a local ContextBrief for agents."""

from __future__ import annotations

import re
from typing import Any

from adce_ml.embedder import cosine, get_embedder

_SEV = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}


def _item_text(item: dict[str, Any]) -> str:
    return " ".join(
        [
            str(item.get("type") or ""),
            str(item.get("path") or ""),
            str(item.get("name") or ""),
            str(item.get("reason") or ""),
            str(item.get("summary") or ""),
            str(item.get("category") or ""),
        ]
    ).strip()


def _task_similarity(task: str | None, items: list[dict[str, Any]]) -> None:
    """Annotate items with packScore = local score + task embedding similarity."""
    if not task or not items:
        for item in items:
            item["packScore"] = float(item.get("score") or 0)
        return

    emb = get_embedder()
    task_vec = emb.embed(task)
    for item in items:
        base = float(item.get("score") or 0)
        sim = cosine(task_vec, emb.embed(_item_text(item)))
        # Blend: keep local ranking signal, boost task relevance (0–1 → up to +5)
        item["packScore"] = base + 5.0 * sim
        item["taskSimilarity"] = round(sim, 4)
        if sim >= 0.35:
            item["reason"] = (
                f"{item.get('reason') or ''}; "
                f"pack-{emb.name} task-sim={sim:.2f}"
            ).strip("; ")


def _keyword_hits(task: str | None, items: list[dict[str, Any]]) -> None:
    tokens = [
        t
        for t in re.split(r"[^a-z0-9]+", str(task or "").lower())
        if len(t) >= 3
    ]
    if not tokens:
        return
    for item in items:
        blob = f"{item.get('path') or ''} {item.get('name') or ''}".lower()
        hits = [t for t in tokens if t in blob]
        if hits:
            item["reason"] = (
                f"{item.get('reason') or ''}; task-match ({', '.join(hits[:3])})"
            ).strip("; ")
            item["packScore"] = float(item.get("packScore") or item.get("score") or 0) + 1.5


def pack_brief(body: dict[str, Any]) -> dict[str, Any]:
    """
    Accept a privacy-safe pack request:
      { task?, brief: { mustRead, caution, trustOrder, alsoRelevant } }

    Returns the same shape with ML notes + reordering:
      - caution: severity then category
      - mustRead / trustOrder / alsoRelevant: packScore (local score + MiniLM task sim)
    """
    brief = body.get("brief") or {}
    task = body.get("task")

    must = [dict(x) for x in (brief.get("mustRead") or [])]
    caution = [dict(x) for x in (brief.get("caution") or [])]
    trust = [dict(x) for x in (brief.get("trustOrder") or [])]
    also = [dict(x) for x in (brief.get("alsoRelevant") or [])]

    emb = get_embedder()
    _task_similarity(str(task) if task else None, must)
    _task_similarity(str(task) if task else None, trust)
    _task_similarity(str(task) if task else None, also)
    _keyword_hits(str(task) if task else None, must + also)

    must.sort(key=lambda x: float(x.get("packScore") or 0), reverse=True)
    trust.sort(key=lambda x: float(x.get("packScore") or 0), reverse=True)
    also.sort(key=lambda x: float(x.get("packScore") or 0), reverse=True)
    caution.sort(
        key=lambda c: (
            -_SEV.get(str(c.get("severity") or "").upper(), 0),
            str(c.get("category") or ""),
        )
    )

    notes = [
        f"Packed brief via {emb.name}: task-similarity blend on mustRead/trust/also.",
        "Caution sorted by severity. Local facts unchanged — packing reorders / annotates.",
    ]
    if task:
        notes.append(f"Task considered: {str(task)[:120]}")

    return {
        "brief": {
            "mustRead": must,
            "caution": caution,
            "trustOrder": trust,
            "alsoRelevant": also,
        },
        "notes": notes,
        "engine": "pack",
        "embedder": emb.name,
    }
