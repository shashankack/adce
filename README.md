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
adce init → scan → relate (y/n) → conflicts → analyze (MiniLM + LinUCB) → context [--compact]
pnpm bench:analyze   # rule vs hybrid ablation (mlLift)
```

**Auth:** friends run `adce login` (GitHub device flow) against your ML server; you/CI can use `ADCE_ML_TOKEN`. See `adce whoami` / `adce logout`.

**Analytics (opt-in):** `analytics.enabled: true` + `ADCE_ML_URL` (and login or admin token). Auto-pushes after context / analyze / feedback.

## Install (npm — when published)

```powershell
npm install -g adce
# or:  npx adce --help
```

Published packages: `adce` (CLI) + `@adce/core` / `@adce/shared` / `@adce/storage` / `@adce/git` / `@adce/parsers`.

## Quick start (from this repo)

Requires **Node.js 22+** and pnpm.

```powershell
pnpm install
pnpm --filter adce build

# in a target project directory
adce init -y
adce scan --full
adce relate              # interactive ML/heuristic links (y/n/s/q)
adce doctor
adce structure           # default: software-eng
adce conflicts
```

### Hybrid ML (core path)

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev,ml]"
# GitHub OAuth App (Device Flow on) + JWT secret — see ml/README.md
$env:GITHUB_CLIENT_ID = "…"
$env:GITHUB_CLIENT_SECRET = "…"
$env:ADCE_JWT_SECRET = "long-random-string"
$env:ADCE_ML_TOKEN = "admin-only-optional"   # CI / your smoke tests
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000
```

```powershell
# friends / day-to-day
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
adce login                 # GitHub device flow → ~/.adce/credentials.json
adce whoami
adce analyze --deep --skip-cache
adce relate
adce context --task "your task" --format markdown --compact
adce logout
```

Details: [ml/README.md](ml/README.md). Cloud deploy: [ml/DEPLOY_RAILWAY.md](ml/DEPLOY_RAILWAY.md) or [ml/DEPLOY_RENDER.md](ml/DEPLOY_RENDER.md). `--skip-ml` is for ablation / offline demos only.

## What ships

| Area | Highlights |
|------|------------|
| Local engine | Artifacts, relationships, temporal evidence, deterministic conflicts |
| Authority | Human verify / CANONICAL overrides survive rescans (**Hybrid Lock** — ML never auto-CONFIRMS) |
| Structure | Default `software-eng` (+ `typescript-lib`, `typescript-api`, `python`, `go`, `generic`) + `--fill` |
| Context | Ranked brief · `/v1/pack` · `--compact` · token metrics → `.adce/metrics/context-tokens.jsonl` |
| Hybrid ML | MiniLM · LinUCB · `adce login` (GitHub) + optional `ADCE_ML_TOKEN` · privacy filter |
| Analytics | Opt-in auto-push → `/v1/analytics` (sanitized; no codebase leak) |
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
pnpm --filter adce dev -- --help
# Publish (maintainers): pnpm -r publish --access public --filter "./packages/**"
```

## License

All rights reserved. MCA Capstone, Department of Computer Applications, PES University.
