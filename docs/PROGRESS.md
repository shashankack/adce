# ADCE Progress

Last updated: 2026-09-13

## Summary

| Scope | Estimate |
|-------|----------|
| v0.1 code (init → scan → status) | 100% |
| v0.1 definition of done (proven + tested) | 100% |
| Init root confirmation + `--yes` | 100% |
| v0.2 Step 1 (list + show artifacts) | 100% |
| v0.2 Step 2 (verify / reject + root resolve) | 100% |
| v0.2 overall (artifact management) | ~55% |
| Full roadmap (v0.1–v0.7) | ~20% |

**v0.1 is complete.** v0.2 Steps 1–2 are complete and covered by Vitest (`10` tests passing). Next: manual `artifact add` and review.

## Current milestone: v0.2

Target flow:

```text
adce artifacts                 ✓
adce artifact show <id>        ✓
adce artifact verify <id>      ✓
adce artifact reject <id>      ✓
adce artifact add              —
adce artifacts review          —
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

## v0.2 (in progress)

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
- [x] Fixtures restored with file contents (empty dirs had broken classification tests)

### Step 3 — manual add (next)

- [ ] `adce artifact add` (file-backed and virtual/manual)
- [ ] MANUAL origin, optional `.adce/artifacts/` storage

### Step 4 — review queue (later)

- [ ] `adce artifacts review` — interactive UNREVIEWED walkthrough

### Optional polish (deferred)

- [ ] `--type SOURCE,TEST` filter wired through core → CLI (storage ready)
- [ ] Prefix id lookup for `adce artifact` (full UUID works for now)

## Tests

```text
pnpm test          → all workspace packages with a test script
pnpm test:core     → @adce/core only (preferred)

Current: 10 passed (v01-pipeline + v02-artifacts)
```

### Dev environment notes (Windows)

- Prefer **Node 22 LTS** (fnm) for this repo; Node 24 often forces `better-sqlite3` to compile.
- Windows needs **MSVC / Desktop development with C++** if a native rebuild is required.
- Avoid mixing WSL and Windows `pnpm install` on the same `node_modules` tree.

## Commits

| Commit | Meaning |
|--------|---------|
| `318d5e8` | Monorepo scaffold |
| `f25ab4b` | v0.1 init / scan / status pipeline |
| `f30c8b2` | Confirm project root when init runs outside the root |
| `b9b522f` | Docs: progress and roadmap for v0.1 |
| `c9be8f7` | Artifact list/show + init `--yes` |

Uncommitted (as of this update): verify/reject, `findAdceRoot`, logger, fixtures content, v02 tests, root `test` / `test:core` scripts.

## Package map

```text
packages/cli
  commands/       → init, scan, status, artifacts, artifact (show/verify/reject)
  ui/             → confirm-init-root, logger
  project-root.ts → resolveAdceRoot for non-init commands
packages/core
  project/        → initialize, status, paths, discover-root, find-adce-root
  artifacts/      → classifier, query, verification
  scanner/        → discovery, hashing, scan-project
packages/storage  → SQLite schema + artifact/scan repositories
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
adce artifact show <full-id>
adce artifact verify <full-id>
adce artifact reject <full-id>
```

Tests:

```bash
pnpm test:core
# or
pnpm test
```

## Next steps

1. Commit current v0.2 Step 2 + fixtures + tests work.
2. **v0.2 Step 3** — `adce artifact add` (manual / virtual artifacts).
3. Then `adce artifacts review`.
4. Optional: wire `--type` filter on `adce artifacts`.

## Roadmap reminder

```text
v0.1  CLI foundation          ✓
v0.2  Artifact management     ← here (~55%)
v0.3  Relationships + temporal
v0.4  Deterministic conflicts
v0.5  Context engine
v0.6  ML integration
v0.7  Research benchmark
      Dashboard (later)
```

Sources of truth: `docs/AGENTS.md`, `docs/ADCE_Technical_Specification.md`.
