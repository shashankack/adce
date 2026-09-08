import { stat } from "node:fs/promises";
import path from "node:path";
import { isGitRepository } from "@adce/git";
import type { ScanMode, ScanSummary } from "@adce/shared";
import {
  closeDatabase,
  deleteArtifactById,
  getMeta,
  insertScan,
  listDetectedPathArtifacts,
  openDatabase,
  setMeta,
  upsertDetectedByPath,
} from "@adce/storage";
import { loadConfig } from "../config/loader.js";
import { classifyArtifact } from "../artifacts/classifier.js";
import { dbPath } from "../project/paths.js";
import { discoverFiles } from "./discovery.js";
import { hashFile } from "./hashing.js";

export interface ScanOptions {
  rootPath: string;
  full?: boolean;
}

export interface ScanResult extends ScanSummary {
  id: string;
}

export async function scanProject(options: ScanOptions): Promise<ScanResult> {
  const { rootPath } = options;
  const databasePath = dbPath(rootPath);
  const db = openDatabase(databasePath);

  try {
    if (!getMeta(db, "createdAt")) {
      throw new Error("ADCE is not initialized. Run `adce init` first.");
    }

    const config = await loadConfig(rootPath);
    const gitDetected = await isGitRepository(rootPath);
    const previous = listDetectedPathArtifacts(db);
    const previousByPath = new Map(
      previous.filter((a) => a.path).map((a) => [a.path as string, a]),
    );

    const mode: ScanMode =
      options.full || previous.length === 0 ? "full" : "incremental";

    const startedAt = new Date().toISOString();
    const files = await discoverFiles(rootPath, config);

    let unchanged = 0;
    let changed = 0;
    let added = 0;
    let upserted = 0;

    const seenPaths = new Set<string>();

    for (const file of files) {
      seenPaths.add(file.relativePath);
      const fileStat = await stat(file.absolutePath);
      const contentHash = await hashFile(file.absolutePath);
      const existing = previousByPath.get(file.relativePath);
      const now = new Date().toISOString();

      if (
        existing &&
        existing.contentHash === contentHash &&
        mode === "incremental"
      ) {
        unchanged += 1;
        continue;
      }

      if (!existing) added += 1;
      else if (existing.contentHash !== contentHash) changed += 1;

      upsertDetectedByPath(db, {
        path: file.relativePath,
        name: path.posix.basename(file.relativePath),
        type: classifyArtifact(file.relativePath),
        contentHash,
        sizeBytes: fileStat.size,
        mtimeMs: Math.trunc(fileStat.mtimeMs),
        updatedAt: now,
        origin: "DETECTED",
        verification: "UNREVIEWED",
        health: "UNKNOWN",
        authority: "UNKNOWN",
      });
      upserted += 1;
    }

    let removed = 0;
    for (const artifact of previous) {
      if (!artifact.path) continue;
      if (!seenPaths.has(artifact.path)) {
        deleteArtifactById(db, artifact.id);
        removed += 1;
      }
    }

    const finishedAt = new Date().toISOString();
    const summary: ScanResult = {
      id: crypto.randomUUID(),
      mode,
      startedAt,
      finishedAt,
      filesSeen: files.length,
      artifactsUpserted: upserted,
      unchanged,
      changed,
      added,
      removed,
      gitDetected,
    };

    insertScan(db, summary);
    setMeta(db, "lastScanAt", finishedAt);
    setMeta(db, "gitDetected", gitDetected ? "true" : "false");
    setMeta(db, "rootPath", rootPath);

    return summary;
  } finally {
    closeDatabase(db);
  }
}
