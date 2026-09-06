import { access } from "node:fs/promises";
import type { StatusReport } from "@adce/shared";
import {
  countArtifacts,
  getLatestScan,
  getMeta,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "./paths.js";

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function getProjectStatus(
  rootPath: string,
): Promise<StatusReport> {
  if (!(await exists(adceDir(rootPath)))) {
    return {
      initialized: false,
      rootPath,
      gitDetected: false,
      createdAt: null,
      lastScanAt: null,
      artifactCount: 0,
      lastScan: null,
    };
  }

  const db = openDatabase(dbPath(rootPath));
  const lastScanAt = getMeta(db, "lastScanAt");
  const latest = getLatestScan(db);

  return {
    initialized: true,
    rootPath: getMeta(db, "rootPath") ?? rootPath,
    gitDetected: getMeta(db, "gitDetected") === "true",
    createdAt: getMeta(db, "createdAt"),
    lastScanAt: lastScanAt ? lastScanAt : null,
    artifactCount: countArtifacts(db),
    lastScan: latest
      ? {
          mode: latest.mode,
          startedAt: latest.startedAt,
          finishedAt: latest.finishedAt,
          filesSeen: latest.filesSeen,
          artifactsUpserted: latest.artifactsUpserted,
          unchanged: latest.unchanged,
          changed: latest.changed,
          added: latest.added,
          removed: latest.removed,
          gitDetected: latest.gitDetected,
        }
      : null,
  };
}
