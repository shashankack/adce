# ADCE ML

Python FastAPI service for hybrid enrichment (`adce analyze`, feedback, context pack, analytics) with **GitHub OAuth** (device flow) and optional admin token.

**Locked primary model:** `sentence-transformers` / `all-MiniLM-L6-v2`  
**Fallback:** hashing embedder (`ADCE_EMBEDDER=hashing` to force).

## Setup

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev,ml]"
```

### GitHub OAuth App (for `adce login`)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Homepage URL: your ML host (or `http://127.0.0.1:8000`)
3. Callback URL: `http://127.0.0.1` (unused for device flow; required by GitHub form)
4. After create: **Enable Device Flow**
5. Copy **Client ID** and generate a **Client secret**

```powershell
$env:GITHUB_CLIENT_ID = "Iv1.…"
$env:GITHUB_CLIENT_SECRET = "…"
$env:ADCE_JWT_SECRET = "long-random-string"   # signs ADCE session JWTs (~7d)
$env:ADCE_ML_TOKEN = "admin-only-optional"    # shared secret for you/CI
uvicorn adce_ml.server:app --reload --host 127.0.0.1 --port 8000
```

| Mode | When |
|------|------|
| Open (dev) | No `ADCE_ML_TOKEN` and no GitHub+JWT config |
| Admin token | `ADCE_ML_TOKEN` set — `Authorization: Bearer …` |
| GitHub users | `GITHUB_CLIENT_ID` + `ADCE_JWT_SECRET` — `adce login` |

`/health` is always open (`authRequired`, `oauthConfigured`).

## CLI (Wrangler-style)

```powershell
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
adce login      # prints GitHub code + URL, polls, saves ~/.adce/credentials.json
adce whoami
adce analyze --skip-cache
adce logout
```

Admin override (skips credentials file):

```powershell
$env:ADCE_ML_TOKEN = "admin-only-optional"
```

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | no | status flags |
| POST | `/v1/auth/device/code` | no | start GitHub device flow |
| POST | `/v1/auth/device/token` | no | poll → ADCE JWT |
| GET | `/v1/auth/whoami` | yes* | `{ login, provider }` |
| POST | `/v1/analyze` | yes* | MiniLM + LinUCB |
| POST | `/v1/feedback` | yes* | confirm/reject/… |
| POST | `/v1/pack` | yes* | context pack |
| POST | `/v1/analytics` | yes* | privacy-locked metrics |

\* When auth is configured.

## Layout

```text
adce_ml/
  server.py           # FastAPI app
  auth.py             # admin token + JWT
  oauth_github.py     # device flow + JWT mint
  analyze.py
  analytics_ingest.py
  embedder.py
  bandit.py
  feedback.py
  pack.py
data/                 # feedback + analytics (gitignored)
```
