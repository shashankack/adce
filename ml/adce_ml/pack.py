"""Context packing — reorder / annotate a local ContextBrief for agents."""

from __future__ import annotations

from typing import Any


_SEV = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}


def pack_brief(body: dict[str, Any]) -> dict[str, Any]:
    """
    Accept a privacy-safe pack request:
      { task?, brief: { mustRead, caution, trustOrder, alsoRelevant } }

    Returns the same shape with ML notes + stable reordering:
      - caution: severity then category
      - mustRead / trustOrder: existing score desc (path/name only — no file bodies)
    """
    brief = body.get("brief") or {}
    task = body.get("task")

    must = list(brief.get("mustRead") or [])
    caution = list(brief.get("caution") or [])
    trust = list(brief.get("trustOrder") or [])
    also = list(brief.get("alsoRelevant") or [])

    must.sort(key=lambda x: float(x.get("score") or 0), reverse=True)
    trust.sort(key=lambda x: float(x.get("score") or 0), reverse=True)
    caution.sort(
        key=lambda c: (
            -_SEV.get(str(c.get("severity") or "").upper(), 0),
            str(c.get("category") or ""),
        )
    )
    also.sort(key=lambda x: float(x.get("score") or 0), reverse=True)

    # Soft promote: if task keywords appear in path/name, bump reason.
    tokens = [
        t
        for t in __import__("re").split(r"[^a-z0-9]+", str(task or "").lower())
        if len(t) >= 3
    ]
    if tokens:
        for item in must + also:
            blob = f"{item.get('path') or ''} {item.get('name') or ''}".lower()
            hits = [t for t in tokens if t in blob]
            if hits:
                item["reason"] = (
                    f"{item.get('reason') or ''}; task-match ({', '.join(hits[:3])})"
                ).strip("; ")

    notes = [
        "Packed brief: severity-sorted caution; score-sorted mustRead/trustOrder.",
        "Local facts unchanged — packing only reorders / annotates.",
    ]
    if task:
        notes.append(f"Task considered: {task[:120]}")

    return {
        "brief": {
            "mustRead": must,
            "caution": caution,
            "trustOrder": trust,
            "alsoRelevant": also,
        },
        "notes": notes,
        "engine": "pack",
    }
