# ADCE

**Artifact-Driven Context Engine** — a temporal and conflict-aware context layer for AI coding agents.

ADCE models a repository as artifacts and relationships, detects conflicts, respects human trust overrides, and emits a **decision-ready brief** (MUST READ / CAUTION / TRUST ORDER). The coding agent *acts*; ADCE *judges what to trust*.

## Status

**Core thesis complete (~95–96% of v0.1–v0.7).** Local CLI + hybrid MiniLM ML + v0.7 ablation runner are shipped. Dashboard is deferred.

```text
adce init → scan → conflicts → context → analyze
(+ optional ADCE_ML_URL → MiniLM / LinUCB / pack)
pnpm bench:analyze   # rule vs hybrid
```

Faculty progress report: [docs/report/ADCE_Project_Progress_Report.md](docs/report/ADCE_Project_Progress_Report.md)

## Quick start

```powershell
pnpm install
pnpm --filter @adce/cli build   # or: pnpm --filter @adce/cli dev

# in a project directory
adce init -y
adce scan --full
adce doctor
adce structure -p typescript-lib
adce conflicts
adce context --task "your task" --format markdown
adce analyze --deep --skip-cache
```

### Optional ML server

```powershell
cd ml
.\.venv\Scripts\Activate.ps1
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000

# other terminal
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
adce analyze --skip-cache
adce context --task "fix schema drift" --format markdown
pnpm bench:analyze
```

Requires **Node.js 22+**. ML optional dependencies: see [ml/README.md](ml/README.md).

## What ships

| Area | Highlights |
|------|------------|
| Local engine | Artifacts, relationships, temporal history, deterministic conflicts |
| Structure | Profiles: `typescript-lib`, `typescript-api`, `python`, `go`, `generic` + `--fill` |
| Context | Ranked brief; optional `/v1/pack` when ML URL set (`--skip-pack` to disable) |
| Hybrid ML | MiniLM analyze, feedback → LinUCB, privacy filter |
| Evaluation | `pnpm bench:analyze` — recall/precision/`mlLift`/brief coverage + golden JSON |

## Documentation

| Document | Role |
|----------|------|
| [docs/report/ADCE_Project_Progress_Report.md](docs/report/ADCE_Project_Progress_Report.md) | Faculty progress snapshot |
| [docs/report/README.md](docs/report/README.md) | Faculty packet reading order |
| [docs/report/ADCE_Version_Features_and_Implementation.md](docs/report/ADCE_Version_Features_and_Implementation.md) | Per-version feature inventory |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Living checklist |
| [docs/ADCE_Hybrid_Architecture_Lock.md](docs/ADCE_Hybrid_Architecture_Lock.md) | Binding hybrid / ML decisions |
| [docs/ADCE_Technical_Specification.md](docs/ADCE_Technical_Specification.md) | Primary technical source of truth |
| [docs/AGENTS.md](docs/AGENTS.md) | Coding-agent invariants |
| [docs/ADCE_Complete_Project_Explanation.md](docs/ADCE_Complete_Project_Explanation.md) | Full product / research narrative |
| [benchmarks/README.md](benchmarks/README.md) | v0.7 ablation how-to |
| [ml/README.md](ml/README.md) | FastAPI ML service |

## Development

```powershell
pnpm install
pnpm test:core
pnpm bench:analyze
pnpm --filter @adce/cli dev -- --help
```
