# Golden benchmark snapshots

Committed ML-up ablation results for faculty demos.

## Regenerate

```powershell
# ML server must be running
cd ml
.\.venv\Scripts\Activate.ps1
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000

# other terminal, repo root
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
pnpm bench:analyze
```

When hybrid produces `mlSuggestionCount > 0`, the runner writes:

`benchmarks/golden/analyze-hybrid-latest.json`

Copy or overwrite that file after a successful demo run. `benchmarks/results/` stays gitignored.
