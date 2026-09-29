# ADCE — Project Progress Report

**Artifact-Driven Context Engine**

| Field | Value |
|-------|--------|
| Student project | ADCE (local-first CLI + hybrid ML architecture) |
| Report date | 29 September 2026 (updated) |
| Audience | Faculty / project review |
| Roadmap scope | v0.1 – v0.7 (+ dashboard deferred) |
| **Overall completion** | **≈ 90–92%** of planned v0.1–v0.7 roadmap |
| Automated tests | Vitest in `@adce/core` (passing) + `pnpm bench:analyze` ablation |
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
| **v0.5** | Context engine + structure profiles | **Done** (TS / Python / Go / generic) | ~100% |
| **v0.6** | ML integration (hybrid) | **Done** (MiniLM + feedback + LinUCB) | ~95% |
| **v0.7** | Research benchmark / evaluation | **Scaffold** | ~40% |
| Dashboard | UI (post-core roadmap) | Deferred | — |

### How the overall % was estimated

```text
v0.1–v0.5  ≈ 5 equal milestones at 100%
v0.6       ≈ 95% (FastAPI + MiniLM + privacy + feedback + LinUCB;
                 optional context packing remains)
v0.7       ≈ 40% (runner + ground truth + category recall; richer metrics later)

Blended roadmap estimate for v0.1–v0.7:  ≈ 90–92%
```

**Local CLI and hybrid ML path work end-to-end** (offline heuristic; MiniLM when `ADCE_ML_URL` is up). Remaining academic depth is richer v0.7 metrics and optional context packing.

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

Still thin / next

- **Locked primary model:** `sentence-transformers` **`all-MiniLM-L6-v2`** on the ML server  
- Hashing embedder / Jaccard only as fallback if MiniLM unavailable  
- Feedback logging + contextual bandit **after** MiniLM (not full RL first)  

---

## 5. What remains

| Priority | Item | Version |
|----------|------|---------|
| **1** | Richer v0.7 metrics (ranking / brief adherence; ML-up golden runs) | **v0.7** |
| **2** | Optional: context-packing endpoint (`/v1/pack`) | v0.6 polish |
| **3** | Optional: `structure --fix`, `typescript-api` | Polish |
| **4** | Dashboard UI | After core roadmap |

### Multi-language note (for faculty)

Root markers ≠ first-class support. Depth strategy: TypeScript → Python → Go, via local structure profiles; ML upgrades judgment and does not replace those facts. **TS + Python + Go profiles are implemented.**

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
adce structure -p typescript-lib|generic|python|go [--format json]
adce analyze [--deep] [--skip-ml] [--skip-cache] …
# with server: ADCE_ML_URL=http://127.0.0.1:8000 adce analyze --skip-cache
pnpm bench:analyze   # v0.7 rule vs hybrid ablation on fixtures
```

---

## 7. Evaluation & academic framing (v0.7 scaffold)

`benchmarks/` runs **rule-only** (`skipMl`) vs **hybrid** (`ADCE_ML_URL` → MiniLM + LinUCB when feedback exists). Ground-truth category recall on fixtures (e.g. `parser-conflicts` recovers STRUCTURAL / SCHEMA / CONFIGURATION). Results JSON under `benchmarks/results/` (gitignored). Deeper ranking / agent-brief metrics still optional.

---

## 8. Bottom line for review

| Question | Answer |
|----------|--------|
| Is there a working product CLI? | **Yes** |
| Does it work without ML / Git? | **Yes** |
| Is hybrid ML HTTP wired? | **Yes** (MiniLM primary; hashing fallback) |
| Multi-lang structure? | **TS + Python + Go (+ generic)** |
| Feedback / ranking research? | **Yes** (`/v1/feedback` + LinUCB) |
| Main remaining gaps | **Richer v0.7 metrics**; optional context packing |
| Overall roadmap progress | **≈ 90–92%** |

---

*Prepared / updated from the ADCE repository state as of 29 September 2026. See `docs/PROGRESS.md` and `docs/ADCE_Hybrid_Architecture_Lock.md`.*
