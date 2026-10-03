"""ML HTTP auth: admin ADCE_ML_TOKEN and/or ADCE JWT (GitHub OAuth)."""

from __future__ import annotations

import hmac
import os
from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException

from adce_ml.oauth_github import oauth_configured, verify_adce_jwt


def configured_token() -> str | None:
    raw = (os.environ.get("ADCE_ML_TOKEN") or "").strip()
    return raw or None


def auth_enabled() -> bool:
    """Auth required when admin token or GitHub JWT OAuth is configured."""
    return configured_token() is not None or oauth_configured()


@dataclass(frozen=True)
class AuthPrincipal:
    login: str
    provider: str  # "token" | "github"
    subject: str | None = None


def _extract_bearer(
    authorization: str | None,
    x_adce_token: str | None,
) -> str | None:
    if x_adce_token:
        return x_adce_token.strip()
    if not authorization:
        return None
    parts = authorization.strip().split(None, 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def resolve_principal(provided: str | None) -> AuthPrincipal | None:
    if not provided:
        return None

    expected = configured_token()
    if expected and hmac.compare_digest(provided, expected):
        return AuthPrincipal(login="admin", provider="token", subject="admin")

    claims = verify_adce_jwt(provided)
    if claims:
        return AuthPrincipal(
            login=str(claims["login"]),
            provider="github",
            subject=str(claims["sub"]),
        )
    return None


def require_ml_auth(
    authorization: Annotated[str | None, Header()] = None,
    x_adce_token: Annotated[str | None, Header(alias="X-ADCE-Token")] = None,
) -> AuthPrincipal | None:
    """Dependency: when auth enabled, require admin token or valid ADCE JWT."""
    if not auth_enabled():
        return None

    provided = _extract_bearer(authorization, x_adce_token)
    principal = resolve_principal(provided)
    if principal is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "Unauthorized: run `adce login` (GitHub) or set "
                "Authorization: Bearer <ADCE_ML_TOKEN>"
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )
    return principal


def optional_ml_auth(
    authorization: Annotated[str | None, Header()] = None,
    x_adce_token: Annotated[str | None, Header(alias="X-ADCE-Token")] = None,
) -> AuthPrincipal | None:
    provided = _extract_bearer(authorization, x_adce_token)
    return resolve_principal(provided)


# Back-compat name used by older imports/tests
require_ml_token = require_ml_auth


def whoami_payload(principal: AuthPrincipal) -> dict[str, Any]:
    return {
        "login": principal.login,
        "provider": principal.provider,
        "subject": principal.subject,
    }
