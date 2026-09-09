# ADCE Progress

Last updated: 2026-09-08

## Summary

| Scope | Estimate |
|-------|----------|
| v0.1 code (init → scan → status) | 100% |
| v0.1 definition of done (proven + tested) | 100% |
| Init root confirmation (post-v0.1 polish) | ~95% |
| Full roadmap (v0.1–v0.7) | ~15% |

**v0.1 is complete.** Smoke-tested (Git + non-Git), covered by Vitest, and extended with smart `adce init` root detection.

## Current milestone: v0.2

Target flow:

```text
adce artifacts
adce artifact <id>
adce artifact add
adce artifact verify / reject
adce artifacts review
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
- [x] `fixtures/` (`no-git`, `basic-typescript`, `empty-project`)
- [x] Automated Vitest coverage for init → scan → rescan → status
- [x] Confirm DoD checklist in `docs/AGENTS.md` end-to-end

### Post-v0.1 polish (done / nearly done)

- [x] Detect likely project root by walking upward (markers: `.git`, manifests, etc.)
- [x] Confirm before init when `cwd` ≠ detected root (`[r]` root / `[c]` cwd / `[n]` cancel)
- [x] Core: `discoverProjectRoot` in `@adce/core`
- [x] CLI: `confirm-init-root` prompt UI
- [x] Manual smoke: subdirectory init → choose root (`.adce` on project root)
- [x] Manual smoke dirs: `/tmp/adce-smoke-tests/{no-git,git-test,...}`
- [ ] Wire CLI `-y, --yes` to skip prompt and use detected root (`runInit` already supports it)

### Explicitly out of scope for v0.1

Relationships, conflicts, temporal providers beyond detection, Tree-sitter/AST, ML, cloud, dashboard, full artifact CLI (`adce artifacts`, etc.).

## Commits

| Commit | Meaning |
|--------|---------|
| `318d5e8` | Monorepo scaffold |
| `f25ab4b` | v0.1 init / scan / status pipeline |
| `f30c8b2` | Confirm project root when init runs outside the root |

## Package map

```text
packages/cli      → terminal commands (thin)
  commands/       → init, scan, status
  ui/             → confirm-init-root prompt
packages/core     → init, discover-root, scan, status, config, classifier
packages/storage  → SQLite schema + repositories
packages/shared   → types, enums, constants
packages/git      → isGitRepository()
packages/parsers  → stub only (unused in v0.1)
fixtures/         → no-git, basic-typescript, empty-project
```

## How to run locally (dev)

Do **not** use `pnpm --filter @adce/cli dev` for project smoke tests — it runs with cwd `packages/cli`.

WSL alias pattern (recommended):

```bash
ADCE_ROOT="/mnt/c/crucifer/Projects/adce"
adce() {
  npx --yes tsx "$ADCE_ROOT/packages/cli/src/index.ts" "$@"
}
```

From the **target project** directory:

```bash
adce init
adce scan
adce status
```

Core DoD tests:

```bash
pnpm --filter @adce/core test
```

## Next steps

1. Optional: wire `-y, --yes` on `adce init` in `packages/cli/src/index.ts`.
2. Start **v0.2** — artifact listing, inspect by id, manual artifacts, verify/reject, review queue.
3. Keep CLI handlers thin; put logic in `@adce/core`.
4. Add fixtures for `manual-artifacts` when that path exists.

## Roadmap reminder

```text
v0.1  CLI foundation          ✓
v0.2  Artifact management     ← here
v0.3  Relationships + temporal
v0.4  Deterministic conflicts
v0.5  Context engine
v0.6  ML integration
v0.7  Research benchmark
      Dashboard (later)
```

Sources of truth: `docs/AGENTS.md`, `docs/ADCE_Technical_Specification.md`.
