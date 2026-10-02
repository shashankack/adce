# ADCE

**Artifact-Driven Context Engine** — a hybrid GenAI context system for AI coding agents.

ADCE models a repository as artifacts and relationships, detects conflicts, respects human trust overrides, and ranks/packs context with **MiniLM + LinUCB**. It emits a **decision-ready brief** (MUST READ / CAUTION / TRUST ORDER). The coding agent *acts*; ADCE *judges what to trust*.

> CLI is the interface. The product is the hybrid pipeline: local conflict/authority engine + FastAPI ML (semantic analyze, RL bandit feedback, context pack).

## Status

| Scope | Estimate |
|-------|----------|
| Phase I thesis pipeline (v0.1–v0.7) | ~95% |
| Overall incl. planned Analytics (v0.8) | ~80–84% |

```text
adce init → scan → conflicts → analyze (MiniLM + LinUCB) → context [--compact]
pnpm bench:analyze   # rule vs hybrid ablation (mlLift)
```

**Next phase (Review-III):** Analytics Engine — opt-in sync of local metrics/feedback to a central server for multi-project proof + ML analytics.

## Quick start

Requires **Node.js 22+**.

```powershell
pnpm install
pnpm --filter @adce/cli build

# in a target project directory
adce init -y
adce scan --full
adce doctor
adce structure -p typescript-lib
adce conflicts
```

### Hybrid ML (core path)

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev,ml]"
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000
```

```powershell
# other terminal — point CLI at ML
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
adce analyze --deep --skip-cache
adce context --task "your task" --format markdown --compact
pnpm bench:analyze
```

Details: [ml/README.md](ml/README.md). `--skip-ml` is for ablation / offline demos only.

## What ships

| Area | Highlights |
|------|------------|
| Local engine | Artifacts, relationships, temporal evidence, deterministic conflicts |
| Authority | Human verify / CANONICAL overrides survive rescans (**Hybrid Lock** — ML never auto-CONFIRMS) |
| Structure | Profiles: `typescript-lib`, `typescript-api`, `python`, `go`, `generic` + `--fill` |
| Context | Ranked brief · `/v1/pack` · `--compact` · token metrics → `.adce/metrics/context-tokens.jsonl` |
| Hybrid ML | MiniLM analyze · LinUCB (RL) from confirm/reject/resolve/ignore · privacy filter |
| Evaluation | `pnpm bench:analyze` — recall / precision / `mlLift` / brief coverage + golden JSON |
| Agent ritual | `AGENTS.md` · Cursor rule · `adce doctor` · `.adce/` gitignored on init |

## Repository layout

```text
packages/cli      Commander CLI
packages/core     Scan, conflicts, context, analyze orchestration
packages/storage  SQLite (.adce/state.db)
packages/shared   Types / constants
packages/git      Git helpers
packages/parsers  Lightweight parsers for conflict detectors
ml/               FastAPI MiniLM + LinUCB + pack + feedback
benchmarks/       Rule vs hybrid ablation
fixtures/         Test / golden projects
```

Academic write-ups (progress reports, literature survey, slide paste decks) live under local `docs/` and are **not published** in this repository.

## Development

```powershell
pnpm install
pnpm test:core
pnpm bench:analyze
pnpm --filter @adce/cli dev -- --help
```

## License

All rights reserved. MCA Capstone, Department of Computer Applications, PES University.
