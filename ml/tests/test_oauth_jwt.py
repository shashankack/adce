"""GitHub OAuth JWT + dual auth."""

from __future__ import annotations

from unittest.mock import patch

import jwt
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def oauth_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADCE_EMBEDDER", "hashing")
    monkeypatch.setenv("GITHUB_CLIENT_ID", "test-client")
    monkeypatch.setenv("GITHUB_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv("ADCE_JWT_SECRET", "jwt-test-secret-at-least-32-bytes!!")
    monkeypatch.delenv("ADCE_ML_TOKEN", raising=False)
    from adce_ml.server import app

    return TestClient(app)


@pytest.fixture()
def dual_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADCE_EMBEDDER", "hashing")
    monkeypatch.setenv("GITHUB_CLIENT_ID", "test-client")
    monkeypatch.setenv("ADCE_JWT_SECRET", "jwt-test-secret-at-least-32-bytes!!")
    monkeypatch.setenv("ADCE_ML_TOKEN", "admin-secret")
    from adce_ml.server import app

    return TestClient(app)


def _mint(login: str = "octocat", sub: str = "42") -> str:
    return jwt.encode(
        {
            "sub": sub,
            "login": login,
            "provider": "github",
            "iat": 1_700_000_000,
            "exp": 2_000_000_000,
        },
        "jwt-test-secret-at-least-32-bytes!!",
        algorithm="HS256",
    )


def test_device_code_proxies_github(oauth_env: TestClient) -> None:
    fake = {
        "device_code": "dev",
        "user_code": "ABCD-1234",
        "verification_uri": "https://github.com/login/device",
        "expires_in": 900,
        "interval": 5,
    }
    with patch("adce_ml.server.start_device_code", return_value=fake):
        res = oauth_env.post("/v1/auth/device/code")
    assert res.status_code == 200
    assert res.json()["user_code"] == "ABCD-1234"


def test_analyze_accepts_jwt(oauth_env: TestClient) -> None:
    token = _mint()
    res = oauth_env.post(
        "/v1/analyze",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "rootPath": "/tmp",
            "mode": "default",
            "conflictIds": None,
            "artifacts": [],
            "conflicts": [],
            "relationships": [],
        },
    )
    assert res.status_code == 200


def test_analyze_rejects_bad_jwt(oauth_env: TestClient) -> None:
    res = oauth_env.post(
        "/v1/analyze",
        headers={"Authorization": "Bearer not-a-jwt"},
        json={
            "rootPath": "/tmp",
            "mode": "default",
            "conflictIds": None,
            "artifacts": [],
            "conflicts": [],
            "relationships": [],
        },
    )
    assert res.status_code == 401


def test_admin_token_still_works(dual_env: TestClient) -> None:
    res = dual_env.post(
        "/v1/analyze",
        headers={"Authorization": "Bearer admin-secret"},
        json={
            "rootPath": "/tmp",
            "mode": "default",
            "conflictIds": None,
            "artifacts": [],
            "conflicts": [],
            "relationships": [],
        },
    )
    assert res.status_code == 200


def test_whoami_jwt(oauth_env: TestClient) -> None:
    token = _mint("alice")
    res = oauth_env.get(
        "/v1/auth/whoami",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["login"] == "alice"
    assert body["provider"] == "github"


def test_poll_success_mints_jwt(oauth_env: TestClient) -> None:
    with patch(
        "adce_ml.server.poll_device_token",
        return_value={
            "status": "success",
            "token": "fake.jwt",
            "token_type": "bearer",
            "expires_at": "2030-01-01T00:00:00+00:00",
            "login": "bob",
            "provider": "github",
            "github_id": "99",
        },
    ):
        res = oauth_env.post(
            "/v1/auth/device/token",
            json={"device_code": "dev"},
        )
    assert res.status_code == 200
    assert res.json()["login"] == "bob"
