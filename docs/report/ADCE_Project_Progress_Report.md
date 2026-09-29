# ADCE — Project Progress Report

**Artifact-Driven Context Engine**

| Field | Value |
|-------|--------|
| Student project | ADCE (local-first CLI + hybrid ML architecture) |
| Report date | 29 September 2026 |
| Audience | Faculty / project review |
| Roadmap scope | v0.1 – v0.7 (+ dashboard deferred) |
| **Overall completion** | **≈ 78–80%** of planned v0.1–v0.7 roadmap |
| Automated tests | **53** Vitest cases in `@adce/core` (passing) |
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
| **v0.5** | Context engine + structure profiles | **Done** | ~100% |
| **v0.6** | ML integration (hybrid) | **In progress** | ~70–75% |
| **v0.7** | Research benchmark / evaluation | **Not started** | 0% |
| Dashboard | UI (post-core roadmap) | Deferred | — |

### How the overall % was estimated

```text
v0.1–v0.5  ≈ 5 equal milestones at 100%     → large majority of product CLI
v0.6       ≈ 70–75% (heuristic analyze done; Python FastAPI HTTP + embeddings pending)
v0.7       = 0%

Blended roadmap estimate for v0.1–v0.7:  ≈ 78–80%
```

**Local / deterministic product path is effectively complete.** Remaining work is finishing the **hybrid ML HTTP service**, multi-language depth, and **academic evaluation (v0.7)**.

---

## 3. Architecture (what was built)

### Hybrid design (locked)

```text
Developer machine                         Project ML infrastructure
─────────────────                         ────────────────────────
ADCE CLI + core + SQLite                    Python FastAPI ML API
  scan, graph, temporal,                      embeddings / similarity
  deterministic conflicts,                    semantic suggestions
  local context, privacy filter               ranking / brief packing
       │                                            │
       └──── HTTPS (selected payload only) ─────────┘
                         │
                         ▼
              Coding agent (via AGENTS.md / Cursor rules)
```

| Rule | Implementation status |
|------|------------------------|
| Local-first: works offline without ML | **Yes** |
| ML optional at runtime; required in project scope | Heuristic analyze **yes**; full HTTP ML **pending** |
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
| `ml/` (Python) | FastAPI ML service | **Being (re)initialized** |

---

## 4. Progress completed (by version)

### v0.1 — CLI foundation ✓

- pnpm TypeScript monorepo scaffold  
- SQLite persistence (`.adce/state.db`)  
- `adce init` → `.adce/`, config, DB, `AGENTS.md`  
- `adce scan` (discover, ignore, hash, classify, incremental)  
- `adce status`  
- Project-root discovery + init confirmation (`-y` / `--repair`)  
- Fixtures + automated Vitest pipeline  

### v0.2 — Artifact management ✓

- List / show / verify / reject / ignore / edit / add artifacts  
- Manual and stub artifacts  
- Review workflow  
- Authority foundations (refined in v0.5)  

### v0.3 — Relationships + temporal ✓

- Link / unlink / graph  
- Relationship inference  
- History (filesystem / Git / ADCE snapshot providers)  
- Works with or without Git  

### v0.4 — Deterministic conflicts ✓

- Temporal mismatch detection  
- Conflict lifecycle (detect → analyze → confirm / resolve / reject / ignore)  
- Parser-based: structural (tests vs exports), schema, configuration (`engines` vs `.nvmrc`)  
- Artifact health synced with open conflicts  

### v0.5 — Context + structure ✓

- Ranked context with task bias and authority boost  
- **Decision-ready brief:** MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT  
- `adce context --task … --format markdown|json|text`  
- `adce authority set|clear`  
- `adce structure` with `typescript-lib` profile (PRESENT / MISSING / SUGGESTED / WEAK)  
- JSON status / conflicts for agent tooling  

### Local polish (post–v0.5 / supporting agent adoption) ✓

- Safe **AGENTS.md merge** on init (`<!-- BEGIN/END ADCE -->`)  
- Mid-session **paste nudge** after init  
- `adce doctor` (init, AGENTS.md, Cursor rule, scan)  
- Always-apply Cursor rule `.cursor/rules/adce.mdc` on init  

### v0.6 — ML integration (partial) ◐

**Done**

- Shared analyze request / report contracts  
- Always-on **heuristic** analyzer (no Python required)  
- Hybrid merge design; analyze cache under `.adce/cache/`  
- `adce analyze` CLI (`--deep`, `--skip-ml`, cache controls)  
- Confidence caps — never silent auto-confirm / authority overwrite  
- TypeScript subprocess client hook for a local Python script  

**Not done yet (current milestone)**

- Full **Python FastAPI** ML HTTP service (`ADCE_ML_URL`)  
- Privacy-filtered outbound payloads to the server  
- Embeddings, semantic ranking, context packing on the server  
- Feedback logging for later ranking / bandit / RL research  

---

## 5. What remains

| Priority | Item | Version |
|----------|------|---------|
| **1** | Python FastAPI ML service + `ADCE_ML_URL` client + privacy filter | v0.6 |
| **2** | Richer ML: embeddings, semantic conflicts, brief packing | v0.6 |
| **3** | Multi-language depth: structure profiles `generic` / `python` / `go` + classifiers (Architecture Lock §8b) | Post–v0.5 / parallel |
| **4** | Optional: `adce structure --fix`, `typescript-api` profile | Polish |
| **5** | Research benchmark: rule vs ML vs hybrid on controlled scenarios | **v0.7** |
| **6** | Bandits / RL for ranking (only after feedback volume) | Later |
| **7** | Dashboard UI | After core roadmap |

### Multi-language note (for faculty)

Root markers (Node, Python, Go, etc.) already help **find** a project root. That is **not** the same as first-class language support. The locked strategy is **depth on 2–3 stacks** (TypeScript → Python → Go/Java) via local profiles and detectors; ML upgrades judgment and does **not** replace those local facts.

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
adce structure [--profile typescript-lib] [--format json]
adce analyze [--deep] [--skip-ml] …
```

Typical agent ritual already supported:

```text
adce status → adce context --task "…" --format markdown
           → follow MUST READ / CAUTION / TRUST ORDER
           → adce conflicts / adce analyze when CAUTION is non-empty
```

---

## 7. Evaluation & academic framing (planned)

v0.7 will compare:

```text
Rule-based ADCE  vs  ML-assisted ADCE  vs  Hybrid ADCE
```

Intended metrics: conflict suggestion usefulness, ranking quality, and whether agents follow ADCE briefs. This remains **ahead** of the current implementation phase.

---

## 8. Bottom line for review

| Question | Answer |
|----------|--------|
| Is there a working product CLI? | **Yes** — init through context, conflicts, structure, doctor, heuristic analyze |
| Does it work without ML / Git? | **Yes** (by design) |
| Is the thesis hybrid architecture defined? | **Yes** — Architecture Lock document |
| What is the main gap? | **Python ML HTTP service + evaluation (v0.7)** |
| Overall roadmap progress | **≈ 78–80%** |

---

*Prepared from the ADCE repository state as of 29 September 2026. For day-to-day engineering detail see `docs/PROGRESS.md`; for binding architecture decisions see `docs/ADCE_Hybrid_Architecture_Lock.md`.*
