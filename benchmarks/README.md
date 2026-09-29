# ADCE v0.7 Research Benchmark

Ablation study for the hybrid architecture (Architecture Lock):

```text
Rule-only (heuristic, --skip-ml)
vs
ML-enriched (ADCE_ML_URL → MiniLM + LinUCB)
vs
Hybrid report (always merges heuristic + ML when ML reachable)
```

In practice the CLI **hybrid** path is: local heuristic always, plus ML suggestions when `ADCE_ML_URL` works. **Rule-only** disables ML.

## Layout

```text
benchmarks/
  README.md                 ← this file
  ground-truth/             ← expected conflict categories per fixture
  run-analyze-benchmark.ts  ← runner (tsx)
  results/                  ← generated JSON (gitignored)
```

## Prerequisites

```powershell
# from repo root
pnpm install

# optional — for ML / hybrid arms:
cd ml
.\.venv\Scripts\Activate.ps1
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000
```

## Run

```powershell
# rule-only + hybrid-if-ML-up (from repo root)
pnpm bench:analyze

# force ML URL
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
pnpm bench:analyze
```

Writes `benchmarks/results/analyze-<timestamp>.json` and prints a markdown-friendly table.

## Metrics

| Metric | Meaning |
|--------|---------|
| `categoryRecall` | Fraction of ground-truth categories detected after scan |
| `suggestionCount` | Analyze suggestions produced in that mode |
| `mlSuggestionCount` | Suggestions with `source === "ml"` |
| `heuristicSuggestionCount` | Suggestions with `source === "heuristic"` |
| `engine` | `heuristic` or `hybrid` |
| `elapsedMs` | Wall time for analyze |

Ground truth is **category-level** (not individual conflict IDs), so fixtures stay stable when IDs change.

## Academic framing

Use the result JSON in your report to show:

1. Deterministic detectors recover expected mismatch classes without ML.  
2. MiniLM/LinUCB add semantic suggestions when the server is up.  
3. Offline / `--skip-ml` still returns a complete heuristic engine.
