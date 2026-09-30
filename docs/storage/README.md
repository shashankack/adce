# `@adce/storage`

SQLite persistence for ADCE. This package owns the on-disk database (`.adce/state.db`) and the repository functions that read and write it. Business logic stays in `@adce/core`; CLI stays thin.

**Scope:** Full persistence for artifacts, scans, relationships, temporal snapshots, conflicts, and analysis updates (v0.1–v0.6).

## Layout

```text
packages/storage/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── database.ts           open / close / meta
    ├── schema.ts             Drizzle table definitions
    ├── artifact-repository.ts
    ├── scan-repository.ts
    ├── relationship-repository.ts
    ├── conflict-repository.ts
    └── …                     (see package exports)
```

## Stack

| Piece | Role |
|-------|------|
| `better-sqlite3` | synchronous SQLite driver |
| `drizzle-orm` | typed queries over that driver |
| `@adce/shared` | `ArtifactRecord`, `ScanSummary`, enums |

The database file is created at `.adce/state.db` by callers (`@adce/core` init). This package does not decide the path.

## Database lifecycle

```ts
import { openDatabase, closeDatabase } from "@adce/storage";

const db = openDatabase(dbPath);
try {
  // repository calls
} finally {
  closeDatabase(db);
}
```

`openDatabase(dbPath)`:

1. Opens (or creates) the SQLite file.
2. Sets `journal_mode = WAL`.
3. Runs `CREATE TABLE IF NOT EXISTS` for `meta`, `artifacts`, and `scans`.
4. Returns a Drizzle `AdceDb` handle.

`closeDatabase(db)` closes the underlying `better-sqlite3` connection. Callers must close handles so WAL sidecar files (`.db-wal`, `.db-shm`) can be released — especially on Windows.

Schema bootstrap is SQL in `database.ts` (`INIT_SQL`), kept in sync with Drizzle tables in `schema.ts`. There is no migration runner yet.

## Tables

### `meta`

Key/value project metadata. All values are strings.

| Column | Type | Notes |
|--------|------|--------|
| `key` | TEXT PK | |
| `value` | TEXT NOT NULL | |

Keys written by `@adce/core` today:

| Key | Meaning |
|-----|---------|
| `rootPath` | Absolute project root |
| `createdAt` | ISO timestamp from `adce init` |
| `gitDetected` | `"true"` or `"false"` |
| `lastScanAt` | ISO timestamp, or `""` before the first scan |

### `artifacts`

One row per artifact. `path` is nullable so later manual/virtual artifacts can exist without a backing file.

| Column | Drizzle field | Type | Notes |
|--------|---------------|------|--------|
| `id` | `id` | TEXT PK | UUID |
| `path` | `path` | TEXT NULL | POSIX-style relative path, or null |
| `name` | `name` | TEXT | Basename |
| `type` | `type` | TEXT | `ArtifactType` from `@adce/shared` |
| `origin` | `origin` | TEXT | `DETECTED` / `MANUAL` / `IMPORTED` |
| `verification` | `verification` | TEXT | `UNREVIEWED` / `VERIFIED` / `REJECTED` / `IGNORED` |
| `health` | `health` | TEXT | `HEALTHY` / `POTENTIALLY_STALE` / `CONFLICTING` / `UNKNOWN` |
| `authority` | `authority` | TEXT | `CANONICAL` / `AUTHORITATIVE` / `SUPPORTING` / `INFERRED` / `UNKNOWN` |
| `content_hash` | `contentHash` | TEXT NULL | SHA-256 hex of file bytes |
| `size_bytes` | `sizeBytes` | INTEGER NULL | |
| `mtime_ms` | `mtimeMs` | INTEGER NULL | Truncated `mtimeMs` |
| `created_at` | `createdAt` | TEXT | ISO timestamp |
| `updated_at` | `updatedAt` | TEXT | ISO timestamp |

Partial unique index: `artifacts_path_unique` on `path` **where `path IS NOT NULL`**. Multiple pathless (manual) artifacts will be allowed later.

v0.1 insert path always sets:

```text
origin = DETECTED
verification = UNREVIEWED
health = UNKNOWN
authority = UNKNOWN
```

### `scans`

One row per completed scan. Used by `adce status` for the last scan report.

| Column | Drizzle field | Type |
|--------|---------------|------|
| `id` | `id` | TEXT PK (UUID) |
| `mode` | `mode` | TEXT (`full` \| `incremental`) |
| `started_at` | `startedAt` | TEXT |
| `finished_at` | `finishedAt` | TEXT |
| `files_seen` | `filesSeen` | INTEGER |
| `artifacts_upserted` | `artifactsUpserted` | INTEGER |
| `unchanged` | `unchanged` | INTEGER |
| `changed` | `changed` | INTEGER |
| `added` | `added` | INTEGER |
| `removed` | `removed` | INTEGER |
| `git_detected` | `gitDetected` | INTEGER as boolean |

## Public API

Re-exported from `src/index.ts`.

### Connection and meta

| Function | Description |
|----------|-------------|
| `openDatabase(dbPath)` | Open/create DB, return `AdceDb` |
| `closeDatabase(db)` | Close the SQLite connection |
| `getMeta(db, key)` | `string \| null` |
| `setMeta(db, key, value)` | Upsert (`ON CONFLICT DO UPDATE`) |

### Artifacts (`artifact-repository.ts`)

| Function | Description |
|----------|-------------|
| `listArtifacts(db)` | All artifact rows |
| `listDetectedPathArtifacts(db)` | `origin = DETECTED` and `path IS NOT NULL` (scan baseline) |
| `findArtifactByPath(db, path)` | Single row by path, or `null` |
| `upsertDetectedByPath(db, incoming)` | Insert or update a detected file artifact |
| `deleteArtifactById(db, id)` | Delete one row (used when a file disappears) |
| `countArtifacts(db)` | Total row count |

`upsertDetectedByPath`:

- Match existing row by `path`.
- On update: refresh `name`, `type`, `contentHash`, `sizeBytes`, `mtimeMs`, `updatedAt`. Preserve `id` and `createdAt`.
- Origin / verification / health / authority are **not** overwritten on update (comment in code: preserve human fields later; today those fields are only set on insert).
- On insert: new UUID, `origin = DETECTED`, `verification = UNREVIEWED`, `health = UNKNOWN`, `authority = UNKNOWN`.

### Scans (`scan-repository.ts`)

| Function | Description |
|----------|-------------|
| `insertScan(db, summary)` | Append a scan row (`ScanSummary` plus `id`) |
| `getLatestScan(db)` | Latest row by `finishedAt` descending, or `null` |

## What this package does not do

- File discovery, hashing, or classification (`@adce/core`)
- Git detection (`@adce/git`)
- CLI I/O (`@adce/cli`)
- Relationships, conflicts, snapshots, or manual-artifact CRUD (later versions)
- Schema migrations / versioning

## Scripts

```bash
pnpm --filter @adce/storage typecheck
pnpm --filter @adce/storage test    # passWithNoTests until storage-specific tests exist
```
