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
  README.md
  ground-truth/             ← expected conflict categories per fixture
  run-analyze-benchmark.ts
  results/                  ← generated JSON (gitignored) + latest.json
  golden/                   ← ML-up snapshot when hybrid produces ML suggestions
```

## Prerequisites

```powershell
pnpm install

# optional — for ML / hybrid arms:
cd ml
.\.venv\Scripts\Activate.ps1
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000
```

## Run

```powershell
pnpm bench:analyze

$env:ADCE_ML_URL = "http://127.0.0.1:8000"
pnpm bench:analyze
```

Writes:

- `benchmarks/results/analyze-<timestamp>.json`
- `benchmarks/results/latest.json`
- `benchmarks/golden/analyze-hybrid-latest.json` (only when ML URL set and ML suggestions > 0)

## Metrics

| Metric | Meaning |
|--------|---------|
| `categoryRecall` | Fraction of ground-truth categories detected after scan |
| `categoryPrecision` | Fraction of detected categories that were expected |
| `mlLift` | Hybrid ML suggestion count − rule ML count |
| `briefCautionCoverage` | Fraction of open conflicts present in context caution |
| `suggestionCount` / `ml*` / `heuristic*` | Analyze suggestion mix |
| `engine` | `heuristic` or `hybrid` |
| `elapsedMs` | Wall time for analyze |

## Academic framing

1. Deterministic detectors recover expected mismatch classes without ML.  
2. MiniLM/LinUCB add semantic / confidence suggestions when the server is up (`mlLift > 0`).  
3. Offline / `--skip-ml` still returns a complete heuristic engine.  
4. Brief caution coverage proxies agent-facing conflict visibility.
