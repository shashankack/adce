# ADCE ML

Python FastAPI service for `adce analyze` enrichment.

**Locked primary model:** `sentence-transformers` / `all-MiniLM-L6-v2`  
**Fallback:** hashing embedder if MiniLM deps/weights unavailable (`ADCE_EMBEDDER=hashing` to force).

## Setup

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev,ml]"
uvicorn adce_ml.server:app --reload --host 127.0.0.1 --port 8000
```

## Point the CLI at it

```powershell
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
adce analyze --skip-cache
```

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Includes `embedder`: `minilm` or `hashing` |
| POST | `/v1/analyze` | AnalyzeRequest JSON → suggestions |

Full-repo dumps (`files` / `repoArchive` / `fullTree`) are rejected.
