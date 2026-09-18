# ADCE Progress

Last updated: 2026-09-18

## Summary

| Scope | Estimate |
|-------|----------|
| v0.1 code (init → scan → status) | 100% |
| v0.1 definition of done (proven + tested) | 100% |
| Init root confirmation + `--yes` | 100% |
| v0.2 artifact management (steps + polish) | 100% |
| v0.3 Step 1 (manual graph / link / unlink) | 100% |
| v0.3 Step 2 (inferred relationships + reject tombstone) | 100% |
| v0.3 overall (relationships + temporal) | ~55% |
| Full roadmap (v0.1–v0.7) | ~35% |

**v0.1 and v0.2 are complete.** **v0.3** Steps 1–2 are complete. Next: temporal / `adce history`.

## Current milestone: v0.3

Target flow:

```text
adce graph                      ✓
adce link <src> <tgt> -t TYPE   ✓
adce unlink <id>                ✓  (marks REJECTED; scan won't recreate)
adce history <artifact>         —
```

Scan also infers `DOCUMENTS` + `TESTS` edges (`DETECTED` / `UNREVIEWED`).

## v0.2 ✓

Target flow:

```text
adce artifacts [--type …]      ✓
adce artifact show <id|prefix> ✓
adce artifact verify <id>      ✓
adce artifact reject <id>      ✓
adce artifact ignore <id>      ✓
adce artifact edit <id>        ✓
adce artifact add [--stub]     ✓
adce artifacts review          ✓
```

## v0.1 (complete)

Target flow:

```text
adce init → adce scan → adce status
```

### Done

- [x] pnpm monorepo scaffold (`cli`, `core`, `storage`, `shared`, `git`, `parsers`)
- [x] Shared artifact/scan/status types and constants
- [x] SQLite persistence (`meta`, `artifacts`, `scans`) via better-sqlite3 + Drizzle
- [x] Git availability detection (no history yet)
- [x] `adce init` — `.adce/`, `config.yaml`, `state.db`, `AGENTS.md`
- [x] `adce scan` — discover, ignore, hash, classify, persist
- [x] Incremental scan foundation (unchanged vs changed via content hash)
- [x] `adce status` — report stored project state
- [x] Thin CLI over `@adce/core`
- [x] Manual smoke test outside this repo (Git + non-Git)
- [x] `fixtures/` with real files (`no-git`, `basic-typescript`, `empty-project`)
- [x] Automated Vitest: init → scan → rescan → status
- [x] Confirm DoD checklist in `docs/AGENTS.md` end-to-end

### Post-v0.1 polish (complete)

- [x] Detect likely project root by walking upward (markers: `.git`, manifests, etc.)
- [x] Confirm before init when `cwd` ≠ detected root (`[r]` root / `[c]` cwd / `[n]` cancel)
- [x] `adce init -y` / `--yes` — skip prompt, use detected project root
- [x] Core: `discoverProjectRoot` in `@adce/core`
- [x] CLI: `confirm-init-root` prompt UI
- [x] Manual smoke: subdirectory init → choose root
- [x] CLI `program.parseAsync` + global error handler
- [x] Simple CLI logger (`→` / `✓` / `!` / `✗`)

## v0.2 (complete)

### Step 1 — list + show (complete)

- [x] Storage: `findArtifactById`, `listArtifacts` (optional type filter in storage)
- [x] Core: `listProjectArtifacts`, `getProjectArtifact`, typed errors
- [x] CLI: `adce artifacts` (full UUID in output)
- [x] CLI: `adce artifact show <id>`
- [x] Manual smoke on git/no-git projects

### Step 2 — verify / reject + project root for all commands (complete)

- [x] Storage: `setArtifactVerification` (does not touch origin/authority/health)
- [x] Scan upsert preserves human verification fields
- [x] Core: `verifyProjectArtifact`, `rejectProjectArtifact`
- [x] CLI: `adce artifact verify|reject <id>`
- [x] Core: `findAdceRoot` — walk upward for existing `.adce/`
- [x] CLI: `resolveAdceRoot` used by scan/status/artifacts/artifact
- [x] Vitest: `findAdceRoot`, list/get, verify survives rescan, reject
- [x] Fixtures restored with file contents

### Step 3 — manual add (complete)

- [x] Storage: `insertManualArtifact` (`origin: MANUAL`, `verification: VERIFIED`)
- [x] Core: `addManualArtifact` (virtual `--manual` or optional `--path`)
- [x] CLI: `adce artifact add -n … -t … [-m|--manual] [-p|--path]`
- [x] Path conflict when file already has a DETECTED artifact
- [x] Invalid type rejected with allowed list
- [x] Manual artifacts live in `state.db`
- [x] Manual smoke: add → show → scan → still MANUAL/VERIFIED
- [x] Vitest: manual artifact survives scan

### Step 4 — review queue (complete)

- [x] Storage: `listUnreviewedDetectedArtifacts` (DETECTED + UNREVIEWED, sorted)
- [x] Core: `listArtifactsForReview`
- [x] CLI UI: `review-prompt` — verify / edit / ignore / reject / skip / quit
- [x] CLI: `adce artifacts review` with summary counts
- [x] Vitest: queue filters correctly; shrinks after verify; excludes MANUAL

### Optional polish (complete)

- [x] `--type SOURCE,TEST` filter on `adce artifacts` (core → CLI)
- [x] Prefix id lookup for `adce artifact *` (unique prefix; ambiguous error)
- [x] `--stub` writes virtual manuals under `.adce/artifacts/`
- [x] `adce artifact edit` (name and/or type)
- [x] `adce artifact ignore` + review `[i]` → `IGNORED` verification state
- [x] Review `[e]` edit type then re-prompt

## Tests

```text
pnpm test          → all workspace packages with a test script
pnpm test:core     → @adce/core only (preferred)

Current: 27 passed (v01-pipeline + v02-artifacts + v03-relationships)
```

### Dev environment notes (Windows)

- Prefer **Node 22 LTS** (fnm) for this repo; Node 24 often forces `better-sqlite3` to compile.
- Windows needs **MSVC / Desktop development with C++** if a native rebuild is required.
- Avoid mixing WSL and Windows `pnpm install` on the same `node_modules` tree.
- Smoke suite: `~/smoke.sh` → `/mnt/c/crucifer/tmp/adce-smoke-tests` (Windows FS for Node).

## Commits

| Commit | Meaning |
|--------|---------|
| `318d5e8` | Monorepo scaffold |
| `f25ab4b` | v0.1 init / scan / status pipeline |
| `f30c8b2` | Confirm project root when init runs outside the root |
| `b9b522f` | Docs: progress and roadmap for v0.1 |
| `c9be8f7` | Artifact list/show + init `--yes` |
| `2e84da2` | Artifact verify/reject + resolve ADCE root from subdirs |
| `98a7dab` | Manual artifacts via `adce artifact add` |
| `caa1497` | Interactive artifacts review queue |
| `a0d55fa` | v0.2 polish (type filter, edit/ignore, stubs, prefixes) |
| `9e781f5` | Manual relationships + init repair |

## Package map

```text
packages/cli
  commands/       → init, scan, status, artifacts, graph, link, unlink, artifact
  ui/             → confirm-init-root, logger, review-prompt
  project-root.ts → resolveAdceRoot for non-init commands
packages/core
  project/        → initialize, status, paths, discover-root, find-adce-root, is-initialized
  artifacts/      → classifier, query, verification, manual-artifact, review, edit-artifact
  relationships/  → link, query, graph, errors, infer
  scanner/        → discovery, hashing, scan-project
packages/storage  → SQLite schema + artifact/scan/relationship repositories
packages/shared   → types, enums, constants
packages/git      → isGitRepository()
packages/parsers  → stub only
fixtures/         → no-git, basic-typescript, empty-project (+ stubs for later)
```

## How to run locally (dev)

Do **not** use `pnpm --filter @adce/cli dev` for project smoke tests — it runs with cwd `packages/cli`.

Faster Windows/WSL alias (repo-local tsx, no npx):

```bash
ADCE_ROOT="/mnt/c/crucifer/Projects/adce"   # or C:\crucifer\Projects\adce on Windows
adce() {
  "$ADCE_ROOT/node_modules/.bin/tsx" \
    "$ADCE_ROOT/packages/cli/src/index.ts" "$@"
}
```

From a **target project** (or any subdirectory once initialized):

```bash
adce init -y
adce scan
adce status
adce artifacts
adce artifacts --type SOURCE,TEST
adce artifacts review
adce artifact show <id-or-prefix>
adce artifact verify <id-or-prefix>
adce artifact reject <id-or-prefix>
adce artifact ignore <id-or-prefix>
adce artifact edit <id-or-prefix> -t DOCUMENTATION -n "New name"
adce artifact add --manual -n "Payment Retry Policy" -t REQUIREMENT
adce artifact add --manual --stub -n "Payment Retry Policy" -t REQUIREMENT
adce graph
adce link <src-prefix> <tgt-prefix> -t RELATED_TO
adce unlink <relationship-prefix>
```

## v0.3 (in progress)

### Step 1 — manual relationships (complete)

- [x] Shared relationship types + `RelationshipRecord`
- [x] Storage `relationships` table + repository
- [x] Core `link` / `unlink` / `graph`
- [x] CLI `adce graph` / `link` / `unlink`
- [x] Init hardening: `isAdceInitialized`, `AdceIncompleteError`, `adce init --repair`

### Step 2 — inferred relationships (complete)

- [x] `upsertDetectedRelationship` (skips MANUAL + REJECTED)
- [x] `setRelationshipVerification`
- [x] Core `infer.ts` — DOCUMENTS + TESTS heuristics
- [x] Wired into `scanProject` after artifact upsert
- [x] `unlink` marks `REJECTED` (tombstone) instead of delete
- [x] Vitest: inference on `basic-typescript`; rejection survives rescan

### Step 3 — temporal / history (next)

- [ ] Filesystem temporal provider (mtime from artifacts)
- [ ] Git temporal provider (when repo has history)
- [ ] ADCE snapshot provider (scan timestamps)
- [ ] `adce history <artifact>`

## Next steps

1. Commit Step 2 (inference + unlink reject + progress).
2. **v0.3 Step 3** — temporal providers + `adce history <artifact>`.

## Roadmap reminder

```text
v0.1  CLI foundation          ✓
v0.2  Artifact management     ✓
v0.3  Relationships + temporal  ← here (~55%)
v0.4  Deterministic conflicts
v0.5  Context engine
v0.6  ML integration
v0.7  Research benchmark
      Dashboard (later)
```

Sources of truth: `docs/AGENTS.md`, `docs/ADCE_Technical_Specification.md`.
