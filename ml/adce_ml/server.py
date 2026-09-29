"""ADCE ML HTTP service.

Run:
  uvicorn adce_ml.server:app --reload --host 127.0.0.1 --port 8090
"""

from __future__ import annotations
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from adce_ml.analyze import analyze_request
from adce_ml.embedder import get_embedder
from adce_ml.feedback import ALLOWED_ACTIONS, append_feedback

app = FastAPI(
    title="ADCE ML",
    version="0.1.0",
    description="Optional ML layer for ADCE (Architecture Lock).",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "adce-ml", "embedder": get_embedder().name}


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

    emb = get_embedder()
    return AnalyzeHttpResponse(
        suggestions=analyze_request(body),
        notes=[
            f"ML HTTP: {emb.name} embeddings. Review before applying.",
        ],
        engine="ml",
    )


class FeedbackRequest(BaseModel):
    action: str
    conflictId: str
    category: str | None = None
    severity: str | None = None
    confidence: str | None = None
    summary: str | None = None
    sourceArtifactId: str | None = None
    targetArtifactId: str | None = None
    projectHash: str | None = None


@app.post("/v1/feedback")
def feedback(body: FeedbackRequest) -> dict:
    if body.action.lower() not in ALLOWED_ACTIONS:
        raise HTTPException(
            400, detail=f"action must be one of {sorted(ALLOWED_ACTIONS)}"
        )
    try:
        record = append_feedback({**body.model_dump(), "embedder": get_embedder().name})
    except ValueError as e:
        raise HTTPException(400, detail=str(e)) from e
    return {"ok": True, "record": record}
