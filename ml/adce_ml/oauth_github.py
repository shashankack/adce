"""GitHub OAuth device flow + ADCE session JWTs."""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any

import httpx
import jwt

GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code"
GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"
JWT_TTL_SECONDS = 7 * 24 * 60 * 60
JWT_ALG = "HS256"


def github_client_id() -> str | None:
    raw = (os.environ.get("GITHUB_CLIENT_ID") or "").strip()
    return raw or None


def github_client_secret() -> str | None:
    raw = (os.environ.get("GITHUB_CLIENT_SECRET") or "").strip()
    return raw or None


def jwt_secret() -> str | None:
    raw = (os.environ.get("ADCE_JWT_SECRET") or "").strip()
    return raw or None


def oauth_configured() -> bool:
    return bool(github_client_id() and jwt_secret())


def start_device_code() -> dict[str, Any]:
    client_id = github_client_id()
    if not client_id or not jwt_secret():
        raise ValueError(
            "GitHub OAuth not configured (need GITHUB_CLIENT_ID and ADCE_JWT_SECRET)"
        )

    data: dict[str, str] = {
        "client_id": client_id,
        "scope": "read:user",
    }
    secret = github_client_secret()
    if secret:
        data["client_secret"] = secret

    with httpx.Client(timeout=30.0) as client:
        res = client.post(
            GITHUB_DEVICE_CODE_URL,
            data=data,
            headers={"Accept": "application/json"},
        )
    if res.status_code >= 400:
        raise ValueError(f"GitHub device code failed: {res.status_code} {res.text}")

    body = res.json()
    if "error" in body:
        raise ValueError(str(body.get("error_description") or body["error"]))
    return {
        "device_code": body["device_code"],
        "user_code": body["user_code"],
        "verification_uri": body.get("verification_uri")
        or "https://github.com/login/device",
        "verification_uri_complete": body.get("verification_uri_complete"),
        "expires_in": int(body.get("expires_in") or 900),
        "interval": int(body.get("interval") or 5),
    }


def poll_device_token(device_code: str) -> dict[str, Any]:
    """Poll GitHub once. Returns pending | slow_down | success payload | error."""
    client_id = github_client_id()
    secret_key = jwt_secret()
    if not client_id or not secret_key:
        raise ValueError("GitHub OAuth not configured")

    data: dict[str, str] = {
        "client_id": client_id,
        "device_code": device_code,
        "grant_type": DEVICE_GRANT,
    }
    secret = github_client_secret()
    if secret:
        data["client_secret"] = secret

    with httpx.Client(timeout=30.0) as client:
        res = client.post(
            GITHUB_ACCESS_TOKEN_URL,
            data=data,
            headers={"Accept": "application/json"},
        )
    body = res.json()
    err = body.get("error")
    if err == "authorization_pending":
        return {"status": "pending"}
    if err == "slow_down":
        return {
            "status": "slow_down",
            "interval": int(body.get("interval") or 5),
        }
    if err == "expired_token":
        return {"status": "expired"}
    if err == "access_denied":
        return {"status": "denied"}
    if err:
        return {
            "status": "error",
            "error": str(body.get("error_description") or err),
        }

    access = body.get("access_token")
    if not access:
        return {"status": "error", "error": "No access_token from GitHub"}

    user = _fetch_github_user(access)
    token, expires_at = mint_adce_jwt(
        sub=str(user["id"]),
        login=str(user["login"]),
    )
    return {
        "status": "success",
        "token": token,
        "token_type": "bearer",
        "expires_at": expires_at,
        "login": user["login"],
        "provider": "github",
        "github_id": str(user["id"]),
    }


def _fetch_github_user(access_token: str) -> dict[str, Any]:
    with httpx.Client(timeout=30.0) as client:
        res = client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
    if res.status_code >= 400:
        raise ValueError(f"GitHub user lookup failed: {res.status_code}")
    user = res.json()
    if not user.get("login") or user.get("id") is None:
        raise ValueError("GitHub user payload incomplete")
    return user


def mint_adce_jwt(sub: str, login: str) -> tuple[str, str]:
    secret = jwt_secret()
    if not secret:
        raise ValueError("ADCE_JWT_SECRET not set")
    now = int(time.time())
    exp = now + JWT_TTL_SECONDS
    payload = {
        "sub": sub,
        "login": login,
        "provider": "github",
        "iat": now,
        "exp": exp,
    }
    token = jwt.encode(payload, secret, algorithm=JWT_ALG)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc).isoformat()
    return token, expires_at


def verify_adce_jwt(token: str) -> dict[str, Any] | None:
    secret = jwt_secret()
    if not secret:
        return None
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None
    if payload.get("provider") != "github":
        return None
    if not payload.get("login") or not payload.get("sub"):
        return None
    return payload
