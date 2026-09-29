# ADCE — Project Progress Report

**Artifact-Driven Context Engine**

| Field | Value |
|-------|--------|
| Student project | ADCE (local-first CLI + hybrid ML architecture) |
| Report date | 29 September 2026 (updated) |
| Audience | Faculty / project review |
| Roadmap scope | v0.1 – v0.7 (+ dashboard deferred) |
| **Overall completion** | **≈ 85–87%** of planned v0.1–v0.7 roadmap |
| Automated tests | **58** Vitest cases in `@adce/core` (passing) |
| Primary references | `docs/ADCE_Technical_Specification.md`, `docs/ADCE_Hybrid_Architecture_Lock.md`, `docs/PROGRESS.md`, `docs/AGENTS.md` |

---

## 1. One-line summary

ADCE is a **repository intelligence layer** for AI coding agents: it scans a project into artifacts and relationships, detects conflicts over time, respects human trust overrides, and emits a **decision-ready context brief** (MUST READ / CAUTION / TRUST ORDER). The coding agent *acts*; ADCE *judges what to trust*.

---

## 2. Overall progress at a glance

| Version | Theme | Status | Est. complete |
|---------|--------|--------|----------------|
| **v0.1** | CLI foundation (init → scan → status) | **Done** | 100% |
| **v0.2** | Artifact management | **Done** | 100% |
| **v0.3** | Relationships + temporal history | **Done** | 100% |
| **v0.4** | Deterministic conflict detection | **Done** | ~100% |
| **v0.5** | Context engine + structure profiles | **Done** (+ multi-lang profiles) | ~100% |
| **v0.6** | ML integration (hybrid) | **Mostly done** | ~90% |
| **v0.7** | Research benchmark / evaluation | **Not started** | 0% |
| Dashboard | UI (post-core roadmap) | Deferred | — |

### How the overall % was estimated

```text
v0.1–v0.5  ≈ 5 equal milestones at 100%
v0.6       ≈ 90% (FastAPI HTTP + ADCE_ML_URL + privacy + heuristic;
                 embeddings / packing / feedback still thin)
v0.7       = 0%

Blended roadmap estimate for v0.1–v0.7:  ≈ 85–87%
```

**Local CLI and hybrid ML HTTP path work end-to-end** (including offline fallback). Remaining product depth is richer ML (embeddings) and **v0.7** academic evaluation; optional `go` profile continues multi-lang depth.

---

## 3. Architecture (what was built)

### Hybrid design (locked)

```text
Developer machine                         Project ML infrastructure
─────────────────                         ────────────────────────
ADCE CLI + core + SQLite                    Python FastAPI ML API
  scan, graph, temporal,                      token-similarity MVP
  deterministic conflicts,                    (embeddings planned next)
  local context, privacy filter
       │                                            │
       └──── HTTPS (selected payload only) ─────────┘
                         │
                         ▼
              Coding agent (via AGENTS.md / Cursor rules)
```

| Rule | Implementation status |
|------|------------------------|
| Local-first: works offline without ML | **Yes** |
| ML optional at runtime; required in project scope | **Yes** — HTTP via `ADCE_ML_URL`; falls back to script / heuristic |
| Human overrides survive scans | **Yes** |
| Never auto-CONFIRMED from ML alone | **Yes** (confidence capped) |

### Monorepo packages delivered

| Package | Role | Status |
|---------|------|--------|
| `@adce/cli` | Commander CLI | Done |
| `@adce/core` | Init, scan, artifacts, relationships, conflicts, context, analyze, structure, doctor | Done |
| `@adce/storage` | SQLite + Drizzle | Done |
| `@adce/shared` | Shared types / constants | Done |
| `@adce/git` | Optional Git detection / history | Done |
| `@adce/parsers` | TS symbols, JSON Schema, config helpers | Done |
| `ml/` (Python) | FastAPI `/health`, `/v1/analyze` + stdin `cli.py` | **Done (MVP)** |

---

## 4. Progress completed (by version)

### v0.1 – v0.4 ✓

CLI foundation, artifact management, relationships + temporal history, deterministic and parser-based conflicts (as in prior report).

### v0.5 — Context + structure ✓

- Decision-ready brief: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT  
- `adce context` / `adce authority` / `adce structure`  
- Profiles: **`typescript-lib`**, **`generic`**, **`python`** (fixture `basic-python`)  
- Glob matcher fixed so brace alternatives with `**` work (pytest-style paths)  

### Local polish ✓

- AGENTS.md merge on init; mid-session nudge; `adce doctor`; Cursor rule `.cursor/rules/adce.mdc`  

### v0.6 — ML integration ✓ (MVP HTTP)

**Done**

- Heuristic analyzer + analyze cache  
- Python FastAPI service (`GET /health`, `POST /v1/analyze`)  
- Shared `analyze_request` logic + stdin `cli.py` stand-in  
- TypeScript `ADCE_ML_URL` client + privacy filter (strip excerpts / secrets)  
- Hybrid merge; offline / unreachable → heuristic (verified in smoke)  
- CLI: `--skip-ml`, `--skip-cache`, `--skip-apply` (Commander-safe; avoid broken `--no-*`)  
- Vitest for privacy + mocked HTTP  

**Still thin / next**

- Real **embeddings**, richer semantic ranking, context packing  
- Feedback logging for bandits / RL  
- Optional **`go`** structure profile  

---

## 5. What remains

| Priority | Item | Version |
|----------|------|---------|
| **1** | Embeddings + stronger semantic ML on the Python server | v0.6 depth |
| **2** | Optional `go` structure profile (+ richer classifiers) | Multi-lang §8b |
| **3** | Optional: `structure --fix`, `typescript-api` | Polish |
| **4** | Research benchmark: rule vs ML vs hybrid | **v0.7** |
| **5** | Bandits / RL for ranking (after feedback volume) | Later |
| **6** | Dashboard UI | After core roadmap |

### Multi-language note (for faculty)

Root markers ≠ first-class support. Depth strategy: TypeScript → Python → Go, via local structure profiles; ML upgrades judgment and does not replace those facts. **TS + Python profiles are implemented;** Go is the natural next profile.

---

## 6. Demo-ready command surface (today)

```text
adce init [-y] [--repair]
adce scan [--full]
adce status [--format json]
adce doctor [--format json] [--nudge]
adce artifacts | artifact show|verify|reject|ignore|edit|add
adce graph | link | unlink | history
adce conflicts | conflict show|confirm|resolve|reject|ignore
adce context --task "…" --format markdown
adce authority set|clear
adce structure -p typescript-lib|generic|python [--format json]
adce analyze [--deep] [--skip-ml] [--skip-cache] …
# with server: ADCE_ML_URL=http://127.0.0.1:8000 adce analyze --skip-cache
```

---

## 7. Evaluation & academic framing (planned)

v0.7 will compare rule-based vs ML-assisted vs hybrid ADCE (precision/recall, ranking, agent brief adherence). Not started.

---

## 8. Bottom line for review

| Question | Answer |
|----------|--------|
| Is there a working product CLI? | **Yes** |
| Does it work without ML / Git? | **Yes** |
| Is hybrid ML HTTP wired? | **Yes** (token-similarity MVP; embeddings next) |
| Multi-lang structure? | **TS + Python (+ generic)**; Go optional next |
| Main remaining gaps | **Embeddings / packing + v0.7 evaluation** |
| Overall roadmap progress | **≈ 85–87%** |

---

*Prepared / updated from the ADCE repository state as of 29 September 2026. See `docs/PROGRESS.md` and `docs/ADCE_Hybrid_Architecture_Lock.md`.*
