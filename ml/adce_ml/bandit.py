from __future__ import annotations

import json, math
from pathlib import Path
from typing import Any

from adce_ml.feedback import feedback_log_path


DEFAULT_ARMS = (
    "DOCUMENTATION_MISMATCH",
    "TEMPORAL_MISMATCH",
    "STRUCTURAL_MISMATCH",
    "SCHEMA_MISMATCH",
    "CONFIGURATION_MISMATCH",
    "SEMANTIC_CONFLICT",
    "UNKNOWN",
)


def _load_feedback(path: Path | None = None) -> list[dict[str, Any]]:
    p = path or feedback_log_path()
    if not p.exists():
        return []

    rows: list[dict[str, Any]] = []
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


class LinUCBCategoryBandit:
    def __init__(
        self, arms: tuple[str, ...] = DEFAULT_ARMS, alpha: float = 0.6
    ) -> None:
        self.arms = arms
        self.alpha = alpha
        self.d = 2
        self.A: dict[str, list[list[float]]] = {
            a: [[1.0, 0.0], [0.0, 1.0]] for a in arms
        }
        self.b: dict[str, list[float]] = {a: [0.0, 0.0] for a in arms}

    def _arm(self, category: str | None) -> str:
        c = category or "UNKNOWN"
        return c if c in self.A else "UNKNOWN"

    @staticmethod
    def _ctx(score: float) -> list[float]:
        return [1.0, float(score)]

    def _mat_vec(self, M: list[list[float]], v: list[float]) -> list[float]:
        return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]]

    def _inv2(self, M: list[list[float]]) -> list[list[float]]:
        det = M[0][0] * M[1][1] - M[0][1] * M[1][0]
        if abs(det) < 1e-12:
            det = 1e-12
        return [
            [M[1][1] / det, -M[0][1] / det],
            [-M[1][0] / det, M[0][0] / det],
        ]

    def update(self, category: str | None, score: float, reward: float) -> None:
        a = self._arm(category)
        x = self._ctx(score)
        # A <- A + x x^T
        self.A[a][0][0] += x[0] * x[0]
        self.A[a][0][1] += x[0] * x[1]
        self.A[a][1][0] += x[1] * x[0]
        self.A[a][1][1] += x[1] * x[1]
        # b <- b + reward * x
        self.b[a][0] += reward * x[0]
        self.b[a][1] += reward * x[1]

    def predict(self, category: str | None, score: float) -> float:
        a = self._arm(category)
        x = self._ctx(score)
        A_inv = self._inv2(self.A[a])
        theta = self._mat_vec(A_inv, self.b[a])
        mean = theta[0] * x[0] + theta[1] * x[1]
        # x^T A^{-1} x
        Ax = self._mat_vec(A_inv, x)
        bonus = self.alpha * math.sqrt(max(0.0, x[0] * Ax[0] + x[1] * Ax[1]))
        return mean + bonus

    def fit_from_log(self, path: Path | None = None) -> int:
        rows = _load_feedback(path)
        n = 0
        for row in rows:
            reward = row.get("reward")
            if reward is None:
                continue
            score = 0.5
            if row.get("score") is not None:
                try:
                    score = float(row["score"])
                except (TypeError, ValueError):
                    score = 0.5
            elif isinstance(row.get("event"), dict) and row["event"].get("score") is not None:
                try:
                    score = float(row["event"]["score"])
                except (TypeError, ValueError):
                    score = 0.5
            self.update(row.get("category"), score, float(reward))
            n += 1
        return n


_bandit: LinUCBCategoryBandit | None = None


def get_bandit() -> LinUCBCategoryBandit:
    global _bandit
    if _bandit is None:
        _bandit = LinUCBCategoryBandit()
        _bandit.fit_from_log()
    return _bandit


def reload_bandit() -> int:
    """Re-fit after new feedback. Returns number of feedback rows used."""
    global _bandit
    _bandit = LinUCBCategoryBandit()
    return _bandit.fit_from_log()


def rank_suggestions(suggestions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Stable sort by LinUCB score (desc), annotate reason."""
    bandit = get_bandit()
    scored: list[tuple[float, dict[str, Any]]] = []
    for s in suggestions:
        base = float(s.get("score") or 0.5)
        # map suggestion kind → pseudo-category for SEMANTIC_CONFLICT
        cat = None
        if s.get("kind") == "semantic_conflict":
            cat = "SEMANTIC_CONFLICT"
        # conflict_confidence: category unknown here — keep UNKNOWN unless caller adds it
        cat = s.get("category") or cat
        ucb = bandit.predict(cat, base)
        enriched = {
            **s,
            "banditScore": ucb,
            "reason": (s.get("reason") or "") + f" | LinUCB={ucb:.2f}",
        }
        scored.append((ucb, enriched))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [s for _, s in scored]
