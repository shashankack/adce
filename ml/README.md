# ADCE ML

Python FastAPI service for hybrid enrichment (`adce analyze`, feedback, context pack).

**Locked primary model:** `sentence-transformers` / `all-MiniLM-L6-v2`  
**Fallback:** hashing embedder (`ADCE_EMBEDDER=hashing` to force).

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
adce context --task "your task" --format markdown
# conflict confirm|reject|resolve|ignore → POST /v1/feedback (with score)

# Opt-in analytics (CLI → this server). Enable once in .adce/config.yaml:
#   analytics: { enabled: true }
# Then context / analyze / conflict feedback auto-push (debounced).
# Manual: adce analytics push [--dry-run]
```

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | `embedder`, `banditArms` |
| POST | `/v1/analyze` | AnalyzeRequest → suggestions (MiniLM + LinUCB rank) |
| POST | `/v1/feedback` | confirm/reject/resolve/ignore + optional `score` |
| POST | `/v1/pack` | Reorder/annotate ContextBrief (task similarity) |
| POST | `/v1/analytics` | Opt-in privacy-locked metrics/feedback/events ingest |

Full-repo dumps (`files` / `repoArchive` / `fullTree`) are rejected (privacy lock).  
`/v1/analytics` also rejects forbidden keys (`content`, `excerpt`, …) and absolute/raw path leaks.  
Analytics helps **your dashboard + LinUCB** only — it does **not** fine-tune MiniLM or train Cursor.

## Layout

```text
adce_ml/
  server.py           # FastAPI app
  analyze.py          # suggestion logic
  analytics_ingest.py # privacy-locked /v1/analytics
  embedder.py         # MiniLM / hashing
  bandit.py           # LinUCB
  feedback.py         # JSONL log
  pack.py             # context packing
data/                 # feedback.jsonl + analytics/ (gitignored)
```
