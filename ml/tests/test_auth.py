"""API auth for ML routes."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client_with_token(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADCE_ML_TOKEN", "secret-test-token")
    monkeypatch.setenv("ADCE_EMBEDDER", "hashing")
    # Import after env so startup sees token
    from adce_ml.server import app

    return TestClient(app)


@pytest.fixture()
def client_no_token(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("ADCE_ML_TOKEN", raising=False)
    monkeypatch.setenv("ADCE_EMBEDDER", "hashing")
    from adce_ml.server import app

    return TestClient(app)


def test_health_open_with_auth_flag(client_with_token: TestClient) -> None:
    res = client_with_token.get("/health")
    assert res.status_code == 200
    assert res.json()["authRequired"] is True


def test_analyze_rejects_without_token(client_with_token: TestClient) -> None:
    res = client_with_token.post(
        "/v1/analyze",
        json={"artifacts": [], "conflicts": [], "relationships": []},
    )
    assert res.status_code == 401


def test_analyze_accepts_bearer(client_with_token: TestClient) -> None:
    res = client_with_token.post(
        "/v1/analyze",
        headers={"Authorization": "Bearer secret-test-token"},
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


def test_analyze_accepts_x_adce_token(client_with_token: TestClient) -> None:
    res = client_with_token.post(
        "/v1/analytics",
        headers={"X-ADCE-Token": "secret-test-token"},
        json={
            "schemaVersion": 1,
            "projectId": "a" * 32,
            "sentAt": "2026-01-01T00:00:00Z",
            "metrics": [],
            "feedback": [],
            "events": [],
        },
    )
    assert res.status_code == 200


def test_no_token_env_allows_local_dev(client_no_token: TestClient) -> None:
    res = client_no_token.post(
        "/v1/analyze",
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
