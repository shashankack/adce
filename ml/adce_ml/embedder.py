"""Embedders for ADCE ML — MiniLM primary, hashing fallback."""

from __future__ import annotations

import hashlib
import math
import os
import re
from functools import lru_cache
from typing import Any, Protocol


def _tokens(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if len(t) >= 2]


class Embedder(Protocol):
    name: str

    def embed(self, text: str) -> list[float]: ...


class HashingEmbedder:
    name = "hashing"

    def __init__(self, dim: int = 256) -> None:
        self.dim = dim

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for tok in _tokens(text):
            h = int(hashlib.sha256(tok.encode()).hexdigest(), 16)
            idx = h % self.dim
            sign = 1.0 if (h >> 8) & 1 else -1.0
            vec[idx] += sign
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


class MiniLMEmbedder:
    name = "minilm"

    def __init__(
        self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ) -> None:
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name)

    def embed(self, text: str) -> list[float]:
        vec = self.model.encode(text or "", normalize_embeddings=True)
        return vec.tolist() if hasattr(vec, "tolist") else list(vec)


def cosine(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    return float(sum(x * y for x, y in zip(a, b, strict=True)))


def artifact_text(art: dict[str, Any]) -> str:
    return " ".join(
        [
            str(art.get("type") or ""),
            str(art.get("path") or ""),
            str(art.get("name") or ""),
        ]
    )


@lru_cache(maxsize=1)
def get_embedder() -> Embedder:
    """ADCE_EMBEDDER=minilm|hashing (default minilm; fall back to hashing)."""
    choice = (os.environ.get("ADCE_EMBEDDER") or "minilm").strip().lower()
    if choice == "hashing":
        return HashingEmbedder()
    try:
        return MiniLMEmbedder()
    except Exception:
        return HashingEmbedder()
