import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AnalyzeReport,
  AnalyzeRequest,
  ConfidenceLevel,
  ConflictLifecycle,
  ConflictSeverity,
} from "@adce/shared";
import {
  closeDatabase,
  listArtifacts,
  listConflicts,
  listRelationships,
  openDatabase,
  syncArtifactHealthFromConflicts,
  updateConflictAnalysis,
  upsertDetectedConflict,
} from "@adce/storage";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { resolveConflictId } from "../conflicts/query.js";
import { adceDir, dbPath } from "../project/paths.js";
import { runProjectAnalyze } from "./run-analyze.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const CLOSED: ConflictLifecycle[] = ["REJECTED", "IGNORED", "RESOLVED"];

/** Never auto-CONFIRM from analysis alone. */
const capConfidence = (
  value: ConfidenceLevel | undefined,
): ConfidenceLevel | undefined => {
  if (!value) return undefined;
  if (value === "CONFIRMED") return "LIKELY";
  return value;
};

const findDefaultMlScript = async (): Promise<string | undefined> => {
  if (process.env.ADCE_ML_SCRIPT) return process.env.ADCE_ML_SCRIPT;

  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, "ml", "adce_ml", "cli.py");
    if (await exists(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
};

export interface AnalyzeProjectOptions {
  conflictId?: string;
  all?: boolean;
  deep?: boolean;
  useCache?: boolean;
  /** Explicit script path; `null` disables ML even if default exists. */
  mlScript?: string | null;
  /** Explicit ML URL; `null` disables ML even if default exists. */
  mlUrl?: string | null;
  /** Persist ANALYZED + safe confidence bumps (default true). */
  /** Skip ML even if default exists. */
  skipMl?: boolean;
  apply?: boolean;
}

export const analyzeProject = async (
  rootPath: string,
  options: AnalyzeProjectOptions = {},
): Promise<AnalyzeReport> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const artifacts = listArtifacts(db);
    const relationships = listRelationships(db).filter(
      (r) => r.verification !== "REJECTED" && r.verification !== "IGNORED",
    );
    let conflicts = listConflicts(db, { includeClosed: Boolean(options.all) });

    if (options.conflictId) {
      const resolved = resolveConflictId(db, options.conflictId);
      conflicts = [resolved];
    } else if (!options.all) {
      conflicts = conflicts.filter((c) => !CLOSED.includes(c.lifecycle));
    }

    const req: AnalyzeRequest = {
      rootPath,
      mode: options.deep ? "deep" : "default",
      conflictIds: options.conflictId ? conflicts.map((c) => c.id) : null,
      artifacts: artifacts.map((a) => ({
        id: a.id,
        path: a.path,
        name: a.name,
        type: a.type,
        verification: a.verification,
        health: a.health,
        authority: a.authority,
        contentHash: a.contentHash,
        excerpt: null,
      })),
      conflicts: conflicts.map((c) => ({
        id: c.id,
        category: c.category,
        lifecycle: c.lifecycle,
        confidence: c.confidence,
        severity: c.severity,
        sourceArtifactId: c.sourceArtifactId,
        targetArtifactId: c.targetArtifactId,
        summary: c.summary,
        evidence: c.evidence,
      })),
      relationships: relationships.map((r) => ({
        id: r.id,
        type: r.type,
        sourceArtifactId: r.sourceArtifactId,
        targetArtifactId: r.targetArtifactId,
        verification: r.verification,
      })),
    };

    const skipMl = Boolean(options.skipMl);
    const mlScript =
      skipMl || options.mlScript === null
        ? undefined
        : (options.mlScript ?? (await findDefaultMlScript()));

    const mlUrl =
      skipMl || options.mlUrl === null || options.mlUrl === ""
        ? undefined
        : (options.mlUrl ?? process.env.ADCE_ML_URL);

    const report = await runProjectAnalyze(req, {
      useCache: options.useCache,
      mlScript,
      mlUrl,
      skipMl,
    });

    if (options.apply !== false) {
      for (const c of conflicts) {
        if (CLOSED.includes(c.lifecycle)) continue;
        updateConflictAnalysis(db, c.id, { lifecycle: "ANALYZED" });
      }

      for (const s of report.suggestions) {
        if (s.kind === "conflict_confidence" && s.conflictId) {
          const c = conflicts.find((x) => x.id === s.conflictId);
          if (!c || CLOSED.includes(c.lifecycle)) continue;
          updateConflictAnalysis(db, c.id, {
            lifecycle: "ANALYZED",
            confidence: capConfidence(s.confidence),
            severity: s.severity as ConflictSeverity | undefined,
          });
        }

        if (s.kind === "semantic_conflict" && s.summary) {
          upsertDetectedConflict(db, {
            category: "SEMANTIC_CONFLICT",
            confidence: capConfidence(s.confidence) ?? "POTENTIAL",
            severity: (s.severity as ConflictSeverity | undefined) ?? "LOW",
            sourceArtifactId: s.artifactId ?? null,
            targetArtifactId: s.targetArtifactId ?? null,
            relationshipId: null,
            summary: s.summary,
            evidence: JSON.stringify({
              reason: s.reason,
              score: s.score,
              source: s.source,
            }),
          });
        }
      }

      syncArtifactHealthFromConflicts(db);
    }

    return report;
  } finally {
    closeDatabase(db);
  }
};
