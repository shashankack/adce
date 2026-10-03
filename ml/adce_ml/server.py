"""ADCE ML HTTP service.

Auth:
  - ADCE_ML_TOKEN — admin shared secret
  - GitHub OAuth device flow → ADCE JWT (adce login)
"""

from __future__ import annotations
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

from adce_ml.analyze import analyze_request
from adce_ml.analytics_ingest import (
    append_analytics_ingest,
    validate_analytics_bundle,
)
from adce_ml.auth import (
    AuthPrincipal,
    auth_enabled,
    require_ml_auth,
    whoami_payload,
)
from adce_ml.bandit import get_bandit, reload_bandit
from adce_ml.embedder import get_embedder
from adce_ml.feedback import ALLOWED_ACTIONS, append_feedback
from adce_ml.oauth_github import (
    oauth_configured,
    poll_device_token,
    start_device_code,
)
from adce_ml.pack import pack_brief


@asynccontextmanager
async def _lifespan(_app: FastAPI) -> AsyncIterator[None]:
    modes: list[str] = []
    if os_env_token():
        modes.append("ADCE_ML_TOKEN")
    if oauth_configured():
        modes.append("GitHub OAuth/JWT")
    if modes:
        print(f"ADCE ML: auth enabled ({', '.join(modes)})")
    else:
        print(
            "ADCE ML: WARNING auth disabled — set ADCE_ML_TOKEN and/or "
            "GITHUB_CLIENT_ID + ADCE_JWT_SECRET before public deploy"
        )
    yield


def os_env_token() -> bool:
    import os

    return bool((os.environ.get("ADCE_ML_TOKEN") or "").strip())


app = FastAPI(
    title="ADCE ML",
    version="0.1.0",
    description="Optional ML layer for ADCE (Architecture Lock).",
    lifespan=_lifespan,
)

_protected = [Depends(require_ml_auth)]


@app.get("/health")
def health() -> dict[str, str | int | bool]:
    b = get_bandit()
    return {
        "status": "ok",
        "service": "adce-ml",
        "embedder": get_embedder().name,
        "banditArms": len(b.arms),
        "authRequired": auth_enabled(),
        "oauthConfigured": oauth_configured(),
    }


class AnalyzeHttpResponse(BaseModel):
    suggestions: list[dict[str, Any]] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    engine: str = "ml"


class DeviceTokenRequest(BaseModel):
    device_code: str


@app.post("/v1/auth/device/code")
def auth_device_code() -> dict[str, Any]:
    try:
        return start_device_code()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/v1/auth/device/token")
def auth_device_token(body: DeviceTokenRequest) -> dict[str, Any]:
    try:
        result = poll_device_token(body.device_code.strip())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return result


@app.get("/v1/auth/whoami")
def auth_whoami(
    principal: AuthPrincipal | None = Depends(require_ml_auth),
) -> dict[str, Any]:
    if principal is None:
        return {"login": "anonymous", "provider": "none", "subject": None}
    return whoami_payload(principal)


@app.post(
    "/v1/analyze",
    response_model=AnalyzeHttpResponse,
    dependencies=_protected,
)
def analyze(body: dict[str, Any]) -> AnalyzeHttpResponse:
    if "artifacts" not in body or "conflicts" not in body:
        raise HTTPException(
            status_code=400,
            detail="Expected AnalyzeRequest fields: artifacts, conflicts",
        )
    if body.get("files") or body.get("repoArchive") or body.get("fullTree"):
        raise HTTPException(
            status_code=400,
            detail="Full repository payloads are forbidden",
        )

    emb = get_embedder()
    return AnalyzeHttpResponse(
        suggestions=analyze_request(body),
        notes=[
            f"ML HTTP: {emb.name} + LinUCB ranking. Review before applying.",
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
    score: float | None = None


@app.post("/v1/feedback", dependencies=_protected)
def feedback(body: FeedbackRequest) -> dict:
    if body.action.lower() not in ALLOWED_ACTIONS:
        raise HTTPException(
            400, detail=f"action must be one of {sorted(ALLOWED_ACTIONS)}"
        )
    try:
        record = append_feedback(
            {**body.model_dump(), "embedder": get_embedder().name}
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e)) from e
    n = reload_bandit()
    return {"ok": True, "record": record, "banditExamples": n}


@app.post("/v1/pack", dependencies=_protected)
def pack(body: dict[str, Any]) -> dict[str, Any]:
    if "brief" not in body or not isinstance(body.get("brief"), dict):
        raise HTTPException(400, detail="Expected { brief: ContextBrief, task? }")
    if body.get("files") or body.get("repoArchive") or body.get("fullTree"):
        raise HTTPException(400, detail="Full repository payloads are forbidden")
    return pack_brief(body)


@app.post("/v1/analytics", dependencies=_protected)
def analytics(body: dict[str, Any]) -> dict[str, Any]:
    try:
        validate_analytics_bundle(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    path = append_analytics_ingest(body)

    bandit_n = 0
    feedback_ok = 0
    for row in body.get("feedback") or []:
        if not isinstance(row, dict):
            continue
        action = str(row.get("action") or "").lower()
        if action not in ALLOWED_ACTIONS:
            continue
        try:
            append_feedback(
                {
                    "action": action,
                    "conflictId": row.get("conflictId") or "unknown",
                    "category": row.get("category"),
                    "severity": row.get("severity"),
                    "confidence": row.get("confidence"),
                    "summary": row.get("summary"),
                    "projectHash": body.get("projectId"),
                    "score": row.get("score"),
                    "embedder": row.get("embedder") or get_embedder().name,
                }
            )
            feedback_ok += 1
        except ValueError:
            continue

    if feedback_ok:
        bandit_n = reload_bandit()

    return {
        "ok": True,
        "stored": str(path),
        "metrics": len(body.get("metrics") or []),
        "feedback": feedback_ok,
        "events": len(body.get("events") or []),
        "banditExamples": bandit_n,
        "note": "Ingested privacy-locked analytics. Does not fine-tune MiniLM.",
    }
