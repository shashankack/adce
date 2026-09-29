# ADCE ML

Python FastAPI service for `adce analyze` enrichment.

## Setup

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn adce_ml.server:app --reload --host 127.0.0.1 --port 8000