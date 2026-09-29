"""ADCE ML HTTP service.

Run:
  uvicorn adce_ml.server:app --reload --host 127.0.0.1 --port 8090
"""

from __future__ import annotations
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from adce_ml.analyze import analyze_request

app = FastAPI(
    title="ADCE ML",
    version="0.1.0",
    description="Optional ML layer for ADCE (Architecture Lock).",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "adce-ml"}


class AnalyzeHttpResponse(BaseModel):
    suggestions: list[dict[str, Any]] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    engine: str = "ml"


@app.post("/v1/analyze", response_model=AnalyzeHttpResponse)
def analyze(body: dict[str, Any]) -> AnalyzeHttpResponse:
    if "artifacts" not in body or "conflicts" not in body:
        raise HTTPException(
            status_code=400,
            detail="Expected AnalyzeRequest fields: artifacts, conflicts",
        )
    # Privacy posture: reject accidental full-repo dumps
    if body.get("files") or body.get("repoArchive") or body.get("fullTree"):
        raise HTTPException(
            status_code=400,
            detail="Full repository payloads are forbidden",
        )

    return AnalyzeHttpResponse(
        suggestions=analyze_request(body),
        notes=["ML HTTP: token-similarity MVP. Review before applying."],
        engine="ml",
    )
