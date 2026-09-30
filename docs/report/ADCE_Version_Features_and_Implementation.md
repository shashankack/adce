# ADCE — Version Features & Implementation Log

**Document purpose:** Durable inventory of what each version delivered (product features + coded tasks) for project reports, demos, and thesis/write-up use.

| Field | Value |
|-------|--------|
| Project | ADCE — Artifact-Driven Context Engine |
| Document date | 2026-09-30 |
| Scope covered | v0.1 – v0.7 (core thesis); dashboard deferred |
| Overall roadmap progress | ≈ 95–96% of v0.1–v0.7 |
| Test baseline | 62 automated Vitest cases in `@adce/core` (`pnpm test:core`) + bench ablation |
| Primary sources | `docs/PROGRESS.md`, `docs/ADCE_Hybrid_Architecture_Lock.md`, `docs/ADCE_Technical_Specification.md`, `docs/AGENTS.md` |

---

## 1. Project overview

ADCE is a **temporal and conflict-aware context layer for AI coding agents**. It models a software repository as artifacts and relationships, tracks how those artifacts change, detects inconsistencies, incorporates human overrides, and produces ranked, task-specific context.

### Non-negotiable design rules (implemented throughout)

1. Works **without Git**.
2. An artifact **does not require a file** (manual / virtual artifacts).
3. Manual artifacts are first-class.
4. Human corrections **survive future scans**.
5. **Health, verification, origin, and authority** are independent fields.
6. Newer ≠ automatically authoritative.
7. Temporal mismatch ≠ automatically confirmed conflict.
8. **ML is optional** — deterministic core must work alone.

### Monorepo packages

| Package | Role |
|---------|------|
| `@adce/cli` | Thin Commander CLI over core |
| `@adce/core` | Project init, scan, artifacts, relationships, temporal, conflicts, context |
| `@adce/storage` | SQLite + Drizzle repositories |
| `@adce/shared` | Types, enums, constants |
| `@adce/git` | Git detection + optional path history |
| `@adce/parsers` | Lightweight structural/config/schema extraction |

### Fixtures used in tests / demos

| Fixture | Purpose |
|---------|---------|
| `fixtures/no-git` | Non-Git project smoke |
| `fixtures/basic-typescript` | Relationships, temporal, context, structure |
| `fixtures/basic-python` / `basic-go` | Multi-lang structure profiles |
| `fixtures/empty-project` | Edge / empty tree / `--fill` |
| `fixtures/parser-conflicts` | STRUCTURAL / SCHEMA / CONFIGURATION + ML lift |
| `fixtures/conflicting-api` | OpenAPI vs implementation (`typescript-api`) |

---

## 2. Status snapshot (as of this document)

| Version | Theme | Status | Estimate |
|---------|--------|--------|----------|
| v0.1 | CLI foundation | Complete | 100% |
| v0.2 | Artifact management | Complete | 100% |
| v0.3 | Relationships + temporal | Complete | 100% |
| v0.4 | Deterministic conflicts | Complete | ~100% |
| v0.5 | Context + structure | Complete | ~100% |
| v0.6 | ML integration (hybrid) | Complete | ~98% |
| v0.7 | Research benchmark | Complete (thesis scaffold) | ~75% |
| Dashboard | UI (post-roadmap) | Deferred | — |

**CLI surface implemented:**

```text
adce init [-y] [--repair]
adce scan [--full]
adce status [--format json]
adce doctor [--format json] [--nudge]
adce artifacts [--type …] | artifacts review
adce artifact show|verify|reject|ignore|edit|add
adce graph | link | unlink | history
adce conflicts [--all] | conflict show|reject|ignore|confirm|resolve
adce context [--task] [--budget] [--format] [--skip-pack]
adce authority set|clear
adce structure -p typescript-lib|typescript-api|generic|python|go [--fill] [--format]
adce analyze [id] [--deep] [--skip-ml] [--skip-cache] [--skip-apply] [--format]
pnpm bench:analyze
```

---

## 3. v0.1 — CLI foundation

### Goal

First vertical slice: initialize a project, scan files into a durable store, report status. Establish monorepo, shared types, and SQLite persistence.

### Features delivered

- Project initialization (`.adce/`, `config.yaml`, `state.db`, `AGENTS.md`)
- File discovery with ignore rules + optional `.gitignore`
- Content hashing and path-based artifact classification
- Full and incremental scan (unchanged vs changed via hash)
- Project status reporting
- Git presence detection (no history yet)
- Works for Git and non-Git repos

### Coded tasks / implementation units

| Area | What was built |
|------|----------------|
| Scaffold | pnpm workspace: `cli`, `core`, `storage`, `shared`, `git`, `parsers` (stub) |
| Shared | Artifact/scan/status types and constants (`@adce/shared`) |
| Storage | SQLite via better-sqlite3 + Drizzle; tables `meta`, `artifacts`, `scans` |
| Git | `isGitRepository()` |
| Core init | `initializeProject` — layout, default config, DB meta, agents template |
| Core scan | Discovery (`fast-glob` + `ignore`), hashing, classifier, upsert |
| Core status | `getProjectStatus` |
| CLI | `adce init`, `adce scan`, `adce status` |
| Fixtures | `no-git`, `basic-typescript`, `empty-project` |
| Tests | Vitest: init → scan → rescan → status |

### Post-v0.1 polish (same milestone family)

| Feature | Implementation |
|---------|----------------|
| Project root discovery | `discoverProjectRoot` (walk up: `.git`, manifests, etc.) |
| Init confirmation | Prompt `[r]` root / `[c]` cwd / `[n]` cancel when cwd ≠ root |
| Non-interactive init | `adce init -y` / `--yes` |
| CLI UX | `program.parseAsync`, global error handler, logger (`→` / `✓` / `!` / `✗`) |

### Representative commits

- `318d5e8` — monorepo scaffold  
- `f25ab4b` — init / scan / status pipeline  
- `f30c8b2` — confirm project root  
- `b9b522f` — docs / progress for v0.1  

### Definition of done (met)

`adce init` → `adce scan` → `adce status` works end-to-end on fixture projects; DoD checklist in `docs/AGENTS.md` satisfied for v0.1.

---

## 4. v0.2 — Artifact management

### Goal

Treat scanned files as reviewable artifacts: list, inspect, verify/reject, add manuals, interactive review. Commands resolve the ADCE root from subdirectories.

### Features delivered

#### Step 1 — List + show

- List all artifacts; show one by id
- Type filter preparation in storage

#### Step 2 — Verify / reject + root resolution

- Human verification states: `VERIFIED`, `REJECTED` (later `IGNORED`)
- Scan upsert **preserves** verification / origin / authority / health
- `findAdceRoot` + CLI `resolveAdceRoot` for all non-init commands

#### Step 3 — Manual artifacts

- `adce artifact add` with `--manual` (virtual) or `--path`
- Origin `MANUAL`, verification `VERIFIED` by default
- Path conflict if DETECTED artifact already owns the path
- Invalid type rejected with allow-list

#### Step 4 — Review queue

- Interactive review of `DETECTED` + `UNREVIEWED` artifacts
- Actions: verify / edit / ignore / reject / skip / quit
- Summary counts after session

#### Optional polish

- `adce artifacts --type SOURCE,TEST`
- Unique **prefix** id lookup (ambiguous → error)
- `--stub` writes under `.adce/artifacts/`
- `adce artifact edit` (name and/or type)
- `adce artifact ignore`

### Coded tasks / implementation units

| Layer | Units |
|-------|--------|
| Storage | `findArtifactById`, `listArtifacts`, `setArtifactVerification`, `insertManualArtifact`, `listUnreviewedDetectedArtifacts`, `updateArtifactMetadata` |
| Core | `listProjectArtifacts`, `getProjectArtifact`, verify/reject/ignore, `addManualArtifact`, `listArtifactsForReview`, `editProjectArtifact`, typed errors |
| CLI | `artifacts`, `artifact show|verify|reject|ignore|edit|add`, `artifacts review`, `review-prompt` UI |
| Tests | `v02-artifacts.test.ts` — find root, list/get, verify survives rescan, manual survives scan, review filters |

### Representative commits

- `c9be8f7` — list/show + init `--yes`  
- `2e84da2` — verify/reject + resolve ADCE root  
- `98a7dab` — manual `artifact add`  
- `caa1497` — interactive review queue  
- `a0d55fa` — v0.2 polish  

### CLI target flow (met)

```text
adce artifacts [--type …]
adce artifact show|verify|reject|ignore|edit|add
adce artifacts review
```

---

## 5. v0.3 — Relationships and temporal engine

### Goal

Connect artifacts into a graph (manual + inferred), harden incomplete init, and expose merged temporal history from filesystem, ADCE scans, and optional Git.

### Features delivered

#### Step 1 — Manual relationships + init hardening

- Relationship model (`RelationshipRecord`, types such as `DOCUMENTS`, `TESTS`, `RELATED_TO`, …)
- `adce graph`, `adce link`, `adce unlink`
- Init validation: `isAdceInitialized`, `AdceIncompleteError`, `adce init --repair`

#### Step 2 — Inferred relationships

- Heuristics: documentation→source (`DOCUMENTS`), `*.test.*` → sibling source (`TESTS`)
- `upsertDetectedRelationship` skips `MANUAL` and `REJECTED`
- `unlink` **tombstones** as `REJECTED` (survives rescan)

#### Step 3 — Temporal / history

- Providers: filesystem mtime, ADCE scan snapshots, Git path commits (when available)
- Merged newest-first history report
- `adce history <id-or-prefix>`

### Coded tasks / implementation units

| Layer | Units |
|-------|--------|
| Shared | Relationship types; `TemporalEvent`, `ArtifactHistoryReport` |
| Storage | `relationships` table + repository; `listScans` |
| Git | `getPathCommitHistory` (simple-git) |
| Core | `link` / `unlink` / `graph` / `infer` / `persistInferredRelationships`; providers + `getArtifactHistory` |
| CLI | `graph`, `link`, `unlink`, `history` |
| Tests | `v03-relationships.test.ts`, `v03-history.test.ts` |

### Representative commits

- `9e781f5` — manual relationships + init repair  
- `e3beb2a` — inference + rejection persistence  
- `29fb123` — temporal history + CLI  

### CLI target flow (met)

```text
adce graph | link | unlink
adce history <artifact>
adce init --repair
```

---

## 6. v0.4 — Deterministic conflict engine

### Goal

Detect inconsistencies with evidence and confidence, manage conflict lifecycle, sync artifact health, and add parser-backed structural/schema/config checks — **without** treating weak evidence as confirmed truth.

### Features delivered

#### Step 1 — Conflict store + temporal detector

- Conflict categories, lifecycle, severity, confidence
- Temporal lag on `DOCUMENTS` / `TESTS` edges (≥ 1 day mtime gap) → `DOCUMENTATION_MISMATCH` / `TEST_MISMATCH`
- Confidence `POTENTIAL` / `LIKELY` only (never `CONFIRMED` from mtime alone)
- CLI: `adce conflicts`, `adce conflict show|reject|ignore`

#### Step 2 — Lifecycle + health

- `adce conflict confirm` / `resolve`
- Open conflicts set involved artifacts’ `health = CONFLICTING`
- Resolve / reject / ignore clears health when no longer open

#### Step 3 — Parser-based detectors

- `@adce/parsers` package (lightweight; not full tree-sitter)
- `STRUCTURAL_MISMATCH` — test named imports missing from source exports
- `SCHEMA_MISMATCH` — JSON Schema `required` vs sibling JSON data (same stem)
- `CONFIGURATION_MISMATCH` — `package.json` `engines.node` vs `.nvmrc` / `.node-version`
- Upsert dedupe by relationship **or** category + artifact pair
- Fixture `parser-conflicts`

### Coded tasks / implementation units

| Layer | Units |
|-------|--------|
| Shared | `ConflictRecord`, categories, lifecycle, severity, confidence |
| Storage | `conflicts` table; upsert respecting closed states; `health-sync` |
| Parsers | TS symbol extract, JSON Schema parse, package/nvmrc helpers |
| Core detectors | `detect-temporal`, `detect-structural`, `detect-schema`, `detect-configuration` |
| Core API | `detectProjectConflicts` (async, runs all detectors + health sync) |
| Classifier | `*.schema.json`, `config/*.json`, `.nvmrc` / `.node-version` typing |
| CLI | Full conflict command set |
| Tests | `v04-conflicts.test.ts`, `v04-parser-conflicts.test.ts`, `parsers.test.ts` |

### Representative commits

- `d0e66bc` — conflict management (v0.4 start)  
- `35c8323` — conflict lifecycle enhancements (with early context)  
- `ca83105` — parsers + STRUCTURAL / SCHEMA / CONFIGURATION detectors  

### CLI target flow (met)

```text
adce conflicts [--all]
adce conflict show|reject|ignore|confirm|resolve
```

### Confidence philosophy (encoded)

Temporal and static parse evidence produce **warnings**, not automatic confirmation. Humans confirm or reject; rejected conflicts stay closed across rescans.

---

## 7. v0.5 — Context engine

### Goal

Turn the artifact graph + conflicts into **ranked, task-biased context** agents can consume (text / JSON / markdown), with authority as an explicit trust signal and AGENTS.md onboarding.

### Features delivered

- `buildProjectContext` ranking using:
  - artifact type priors
  - verification (verified boost; rejected/ignored penalties)
  - health (surface conflicting)
  - **authority** (`CANONICAL` … `INFERRED`)
  - task token hits
  - open-conflict involvement
- Expand selection via active relationships; attach related open conflicts
- Budget for primary selection + capped expansion
- CLI: `adce context [--task] [--budget] [--format text|json|markdown]`
- CLI: `adce authority set <id> -l …` / `adce authority clear <id>`
- Authority persisted and **survives scans**
- AGENTS.md template guides: status → context → conflicts → authority

### Coded tasks / implementation units

| Layer | Units |
|-------|--------|
| Shared | `ContextBundle`, `ContextArtifactView` |
| Storage | `setArtifactAuthority` |
| Core | `build-context.ts`, `artifacts/authority.ts` |
| CLI | `context.ts` (incl. markdown formatter), `authority.ts` |
| Init | Updated `AGENTS_TEMPLATE` |
| Tests | `v05-context.test.ts` — task bias, CANONICAL boost, AGENTS.md content |

### Representative commits

- `35c8323` — introduce context engine  
- `830c36f` — finalize context + authority management  

### Spec checklist

| Spec item | Status |
|-----------|--------|
| Context engine | Done |
| Task-specific context | Done |
| Context budgets | Done |
| JSON output | Done |
| Markdown output | Done (beyond minimal spec) |
| Authority in ranking | Done |
| AGENTS.md integration | Done (template + guidance) |
| Richer narrative “authority reasoning” | Partial (~95% overall) |

### CLI target flow (met)

```text
adce context --task "…" [--budget N] [--format json|markdown]
adce authority set <id> -l CANONICAL
adce authority clear <id>
```

---

## 8. v0.6 — ML integration (complete)

### Goal

Optional hybrid analysis on top of deterministic conflicts: heuristic always works; ML upgrades judgment when `ADCE_ML_URL` is reachable. Never auto-confirm or silently rewrite human authority.

### Features delivered

- `adce analyze` / `[conflict-id]` / `--all` / `--deep` / `--format`
- `--skip-ml`, `--skip-cache`, `--skip-apply` (Commander-safe; not `--no-*`)
- Heuristic suggestions always available offline
- FastAPI ML service: MiniLM embeddings (hashing fallback), `/v1/analyze`
- Feedback logging (`POST /v1/feedback`) from conflict confirm/reject/resolve/ignore + `score`
- LinUCB contextual bandit re-ranks ML suggestions from feedback rewards
- Context packing (`POST /v1/pack`) — task-similarity reorder of MUST READ / CAUTION / TRUST
- Privacy filter strips secrets / full-repo dumps before HTTP
- Cache under `.adce/cache/analyze-*.json`
- Confidence capped (no auto-`CONFIRMED`); authority suggestions advisory only
- Mid-session nudge + `adce doctor` + Cursor rule on init

### Coded units

| Layer | Units |
|-------|--------|
| Shared | `AnalyzeRequest`, `AnalyzeSuggestion`, `AnalyzeReport`, context brief types |
| Core | `heuristic.ts`, `ml-http.ts`, `ml-client.ts`, `ml-feedback.ts`, `ml-pack.ts`, `run-analyze.ts`, `analyze-project.ts`, `privacy.ts` |
| CLI | `commands/analyze.ts`, feedback on conflict actions, `context --skip-pack` |
| Python | `server.py`, `analyze.py`, `embedder.py`, `bandit.py`, `feedback.py`, `pack.py` |
| Tests | `v06-analyze.test.ts` |

---

## 9. v0.7 — Research evaluation (thesis scaffold complete)

### Features delivered

- `benchmarks/` runner: rule vs hybrid ablation on fixtures
- Ground truth JSON (`parser-conflicts`, `conflicting-api`, `basic-typescript`)
- Metrics: category recall/precision, `mlLift`, brief caution coverage, latency
- Outputs: `benchmarks/results/latest.json` (gitignored) + `benchmarks/golden/analyze-hybrid-latest.json`
- Demo signal: `parser-conflicts` hybrid **2/4/6** (ML lift 4) vs rule **2/0/2**; recall/prec/brief **1.00**

### Optional later

- Larger corpora / CI ML-up job
- Dashboard UI (explicitly deferred)

### CLI / scripts

```text
pnpm bench:analyze
$env:ADCE_ML_URL = "http://127.0.0.1:8000"; pnpm bench:analyze
```

---

## 10. Cross-cutting architecture notes (report-ready)

### Artifact field separation

| Field | Meaning |
|-------|---------|
| `origin` | How it entered the system (`DETECTED`, `MANUAL`, `IMPORTED`) |
| `verification` | Human review state |
| `health` | Consistency signal (`HEALTHY`, `POTENTIALLY_STALE`, `CONFLICTING`, `UNKNOWN`) |
| `authority` | Trust / precedence (`CANONICAL` … `UNKNOWN`) |

### Scan pipeline (current)

```text
discover files
  → hash + classify
  → upsert artifacts (preserve human fields)
  → infer relationships (respect MANUAL / REJECTED)
  → run conflict detectors (temporal + structural + schema + config)
  → sync artifact health from open conflicts
  → record scan summary
```

### Persistence

- Project state: `.adce/state.db` (SQLite)
- Config: `.adce/config.yaml`
- Optional stubs: `.adce/artifacts/`
- Agent onboarding: repo-root `AGENTS.md`

---

## 11. Testing & verification map

| Suite | Covers |
|-------|--------|
| `packages/core/test/v01-pipeline.test.ts` | Init, scan, rescan, status |
| `packages/core/test/v02-artifacts.test.ts` | List/show, verify, manual, review, root resolution |
| `packages/core/test/v03-relationships.test.ts` | Link/unlink, inference, rejection tombstones |
| `packages/core/test/v03-history.test.ts` | Filesystem / snapshot / git history merge |
| `packages/core/test/v04-conflicts.test.ts` | Temporal mismatches, reject survives rescan |
| `packages/core/test/v04-parser-conflicts.test.ts` | STRUCTURAL / SCHEMA / CONFIGURATION |
| `packages/core/test/v05-context.test.ts` | Ranking, task bias, authority, AGENTS.md |
| `packages/core/test/v05-structure.test.ts` | Profiles, `--fill`, typescript-api |
| `packages/core/test/v06-analyze.test.ts` | Heuristic analyze, ANALYZED, cache |
| `packages/parsers/test/parsers.test.ts` | Symbol / schema / engines helpers |
| `pnpm bench:analyze` | Rule vs hybrid ablation + golden |

**Commands:**

```text
pnpm test          # all packages with tests
pnpm test:core     # @adce/core (primary)
pnpm bench:analyze # v0.7 research ablation
```

**Manual smoke:** WSL helper `~/smoke.sh` targeting Windows-path suite under `/mnt/c/crucifer/tmp/adce-smoke-tests` (Windows Node + repo `tsx`).

---

## 12. Commit timeline (implementation chronology)

| Commit | Summary |
|--------|---------|
| `318d5e8` | Initialize monorepo |
| `f25ab4b` | v0.1 init / scan / status |
| `f30c8b2` | Confirm project root on init |
| `b9b522f` | Docs: v0.1 progress |
| `c9be8f7` | Artifact list/show; init `--yes` |
| `2e84da2` | Verify/reject; resolve ADCE root |
| `98a7dab` | Manual artifact add |
| `d5f6351` | Docs: mark manual artifacts complete |
| `caa1497` | Interactive review queue |
| `a0d55fa` | v0.2 polish |
| `9e781f5` | Manual relationships; init repair |
| `e3beb2a` | Inference + rejection persistence |
| `29fb123` | Temporal history CLI |
| `d0e66bc` | Conflict management (v0.4) |
| `35c8323` | Conflict lifecycle + context engine |
| `830c36f` | Context finalize + authority |
| `ca83105` | Parsers + parser-based conflict detectors |

---

## 13. How to cite this document in a project report

Suggested framing:

> ADCE was implemented incrementally as a TypeScript monorepo CLI. Versions **v0.1–v0.5** deliver a complete deterministic pipeline from repository initialization through artifact modeling, relationship inference, temporal history, conflict detection, structure profiles, and ranked agent context with human authority controls. **v0.6** adds optional hybrid MiniLM ML (analyze, feedback, LinUCB, context pack). **v0.7** provides a reproducible rule-vs-hybrid research ablation with golden results. The dashboard remains deferred.

Suggested metrics table for reports:

| Metric | Value (2026-09-30) |
|--------|---------------------|
| Roadmap versions complete | 7 / 7 core (v0.1–v0.7 thesis path); dashboard deferred |
| Overall v0.1–v0.7 estimate | ≈ 95–96% |
| Automated tests | 62 (`@adce/core`) |
| CLI command families | init/scan/status/doctor, artifacts, graph/link, history, conflicts, context, authority, structure, analyze |
| Works without Git / ML | Yes |
| ML required for core | No |
| Golden ablation signal | `parser-conflicts` hybrid 2/4/6 (mlLift 4) |

---

## 14. Related documentation

| Document | Use |
|----------|-----|
| `docs/ADCE_Hybrid_Architecture_Lock.md` | **Binding** hybrid / ML / agent-consumption decisions |
| `docs/PROGRESS.md` | Living checklist / day-to-day progress |
| `docs/ADCE_Technical_Specification.md` | Requirements & version targets |
| `docs/ADCE_Complete_Project_Explanation.md` | Narrative product explanation |
| `docs/ADCE_Project_Directory_and_Implementation_Plan.md` | Directory plan & milestones |
| `docs/AGENTS.md` | Contributor / agent rules for this repo |
| `docs/storage/README.md` | Storage layer notes |

---

*End of version feature & implementation log.*
