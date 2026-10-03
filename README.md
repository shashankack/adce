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

**Analytics (opt-in):** set `analytics.enabled: true` in `.adce/config.yaml` and `ADCE_ML_URL`. The CLI **auto-pushes** after `context` / `analyze` / conflict feedback (debounced). Manual: `adce analytics push`. Privacy-locked only — does **not** train Cursor or fine-tune MiniLM.

## Quick start

Requires **Node.js 22+**.

```powershell
pnpm install
pnpm --filter @adce/cli build

# in a target project directory
adce init -y
adce scan --full
adce relate              # interactive ML/heuristic links (y/n/s/q)
adce relate --reset -y   # wipe all edges (or: pnpm reset:relationships -- --yes)
adce doctor
adce structure                          # default: software-eng (requirements/ design/ …)
adce structure --fill                   # stub suggested knowledge folders
# Fill stubs with real knowledge (or prompt the agent to draft, then review + verify)
adce structure -p typescript-lib        # language-specific (TS) checklist
adce conflicts
# Opt-in analytics — enable once, then auto-syncs (or push manually):
#   analytics: { enabled: true }   # in .adce/config.yaml
# adce analytics push --dry-run
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
adce relate                 # MiniLM deep suggestions when ADCE_ML_URL is set
adce context --task "your task" --format markdown --compact
pnpm bench:analyze
```

Details: [ml/README.md](ml/README.md). `--skip-ml` is for ablation / offline demos only.

## What ships

| Area | Highlights |
|------|------------|
| Local engine | Artifacts, relationships, temporal evidence, deterministic conflicts |
| Authority | Human verify / CANONICAL overrides survive rescans (**Hybrid Lock** — ML never auto-CONFIRMS) |
| Structure | Default `software-eng` (+ `typescript-lib`, `typescript-api`, `python`, `go`, `generic`) + `--fill` |
| Context | Ranked brief · `/v1/pack` · `--compact` · token metrics → `.adce/metrics/context-tokens.jsonl` |
| Hybrid ML | MiniLM analyze · LinUCB (RL) from confirm/reject/resolve/ignore · privacy filter |
| Analytics | Opt-in `adce analytics push` → `/v1/analytics` (sanitized metrics/feedback; no codebase leak) |
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
