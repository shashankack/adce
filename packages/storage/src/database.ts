import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  path TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  origin TEXT NOT NULL,
  verification TEXT NOT NULL,
  health TEXT NOT NULL,
  authority TEXT NOT NULL,
  content_hash TEXT,
  size_bytes INTEGER,
  mtime_ms INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS artifacts_path_unique
  ON artifacts(path)
  WHERE path IS NOT NULL;
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY NOT NULL,
  mode TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  files_seen INTEGER NOT NULL,
  artifacts_upserted INTEGER NOT NULL,
  unchanged INTEGER NOT NULL,
  changed INTEGER NOT NULL,
  added INTEGER NOT NULL,
  removed INTEGER NOT NULL,
  git_detected INTEGER NOT NULL
);
`;

export type AdceDb = ReturnType<typeof openDatabase>;

export const openDatabase = (dbPath: string) => {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(INIT_SQL);
  return drizzle(sqlite, { schema });
};

export const closeDatabase = (db: AdceDb): void => {
  db.$client.close();
};

export const getMeta = (db: AdceDb, key: string): string | null => {
  const row = db
    .select()
    .from(schema.meta)
    .where(eq(schema.meta.key, key))
    .get();
  return row?.value ?? null;
};

export const setMeta = (db: AdceDb, key: string, value: string): void => {
  db.insert(schema.meta)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.meta.key,
      set: { value },
    })
    .run();
};
