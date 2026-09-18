import { desc } from "drizzle-orm";
import type { ScanSummary } from "@adce/shared";
import type { AdceDb } from "./database.js";
import { scans } from "./schema.js";

export const insertScan = (
  db: AdceDb,
  summary: ScanSummary & { id: string },
): void => {
  db.insert(scans)
    .values({
      id: summary.id,
      mode: summary.mode,
      startedAt: summary.startedAt,
      finishedAt: summary.finishedAt,
      filesSeen: summary.filesSeen,
      artifactsUpserted: summary.artifactsUpserted,
      unchanged: summary.unchanged,
      changed: summary.changed,
      added: summary.added,
      removed: summary.removed,
      gitDetected: summary.gitDetected,
    })
    .run();
};

export const getLatestScan = (
  db: AdceDb,
): (ScanSummary & { id: string }) | null => {
  const row = db.select().from(scans).orderBy(desc(scans.finishedAt)).get();
  if (!row) return null;

  return {
    id: row.id,
    mode: row.mode as ScanSummary["mode"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    filesSeen: row.filesSeen,
    artifactsUpserted: row.artifactsUpserted,
    unchanged: row.unchanged,
    changed: row.changed,
    added: row.added,
    removed: row.removed,
    gitDetected: row.gitDetected,
  };
};

export const listScans = (
  db: AdceDb,
  limit = 10,
): (ScanSummary & { id: string })[] => {
  const rows = db
    .select()
    .from(scans)
    .orderBy(desc(scans.finishedAt))
    .limit(limit)
    .all();

  return rows.map((row) => ({
    id: row.id,
    mode: row.mode as ScanSummary["mode"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    filesSeen: row.filesSeen,
    artifactsUpserted: row.artifactsUpserted,
    unchanged: row.unchanged,
    changed: row.changed,
    added: row.added,
    removed: row.removed,
    gitDetected: row.gitDetected,
  }));
};
