import {
  access,
  appendFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  closeDatabase,
  listArtifacts,
  listConflicts,
  openDatabase,
} from "@adce/storage";
import { contextTokenLogPath } from "../context/token-metrics-log.js";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { adceDir, dbPath, metricsDir } from "../project/paths.js";
import {
  findForbiddenKey,
  hashProjectId,
  isSecretPath,
  pathPattern,
  sanitizeConflictSummary,
  sanitizeFeedbackRow,
  sanitizeMetricRow,
} from "./sanitize.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export const ANALYTICS_SCHEMA_VERSION = 1 as const;

export interface AnalyticsCursor {
  metricsLines: number;
  feedbackLines: number;
}

export interface AnalyticsBundle {
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
  projectId: string;
  sentAt: string;
  metrics: Record<string, unknown>[];
  feedback: Record<string, unknown>[];
  events: Record<string, unknown>[];
}

export const analyticsCursorPath = (rootPath: string): string =>
  path.join(metricsDir(rootPath), "analytics-cursor.json");

export const localFeedbackLogPath = (rootPath: string): string =>
  path.join(metricsDir(rootPath), "feedback.jsonl");

const readJsonl = async (file: string): Promise<string[]> => {
  try {
    const raw = await readFile(file, "utf8");
    return raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  } catch {
    return [];
  }
};

const loadCursor = async (rootPath: string): Promise<AnalyticsCursor> => {
  try {
    const raw = await readFile(analyticsCursorPath(rootPath), "utf8");
    const parsed = JSON.parse(raw) as Partial<AnalyticsCursor>;
    return {
      metricsLines: Number(parsed.metricsLines) || 0,
      feedbackLines: Number(parsed.feedbackLines) || 0,
    };
  } catch {
    return { metricsLines: 0, feedbackLines: 0 };
  }
};

export const saveAnalyticsCursor = async (
  rootPath: string,
  cursor: AnalyticsCursor,
): Promise<void> => {
  await mkdir(metricsDir(rootPath), { recursive: true });
  await writeFile(
    analyticsCursorPath(rootPath),
    `${JSON.stringify(cursor, null, 2)}\n`,
    "utf8",
  );
};

const conflictEvents = async (
  rootPath: string,
  projectId: string,
): Promise<Record<string, unknown>[]> => {
  const db = openDatabase(dbPath(rootPath));
  try {
    const artifacts = listArtifacts(db);
    const byId = new Map(artifacts.map((a) => [a.id, a]));
    const conflicts = listConflicts(db, { includeClosed: true });
    const out: Record<string, unknown>[] = [];
    for (const c of conflicts) {
      const src = c.sourceArtifactId
        ? byId.get(c.sourceArtifactId)
        : undefined;
      const tgt = c.targetArtifactId
        ? byId.get(c.targetArtifactId)
        : undefined;
      if (isSecretPath(src?.path ?? null) || isSecretPath(tgt?.path ?? null)) {
        continue;
      }
      out.push({
        kind: "conflict",
        projectId,
        conflictId: c.id.slice(0, 64),
        category: c.category,
        lifecycle: c.lifecycle,
        confidence: c.confidence,
        severity: c.severity,
        summary: sanitizeConflictSummary(c.summary),
        sourcePathPattern: pathPattern(src?.path ?? null),
        targetPathPattern: pathPattern(tgt?.path ?? null),
        sourceType: src?.type ?? null,
        targetType: tgt?.type ?? null,
      });
    }
    return out;
  } finally {
    closeDatabase(db);
  }
};

export const buildAnalyticsBundle = async (
  rootPath: string,
): Promise<{
  bundle: AnalyticsBundle;
  nextCursor: AnalyticsCursor;
  skipped: string[];
}> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const projectId = hashProjectId(rootPath);
  const cursor = await loadCursor(rootPath);
  const skipped: string[] = [];

  const metricLines = await readJsonl(contextTokenLogPath(rootPath));
  const feedbackLines = await readJsonl(localFeedbackLogPath(rootPath));

  const metrics: Record<string, unknown>[] = [];
  for (const line of metricLines.slice(cursor.metricsLines)) {
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const clean = sanitizeMetricRow(row, projectId);
      if (clean) metrics.push(clean);
      else skipped.push("metric");
    } catch {
      skipped.push("metric-parse");
    }
  }

  const feedback: Record<string, unknown>[] = [];
  for (const line of feedbackLines.slice(cursor.feedbackLines)) {
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const clean = sanitizeFeedbackRow(row, projectId);
      if (clean) feedback.push(clean);
      else skipped.push("feedback");
    } catch {
      skipped.push("feedback-parse");
    }
  }

  const events = await conflictEvents(rootPath, projectId);

  const bundle: AnalyticsBundle = {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    projectId,
    sentAt: new Date().toISOString(),
    metrics,
    feedback,
    events,
  };

  const forbidden = findForbiddenKey(bundle);
  if (forbidden) {
    throw new Error(`Analytics bundle contains forbidden key: ${forbidden}`);
  }

  return {
    bundle,
    nextCursor: {
      metricsLines: metricLines.length,
      feedbackLines: feedbackLines.length,
    },
    skipped,
  };
};

/** Append a privacy-safe local feedback row for later push. */
export const appendLocalFeedbackEvent = async (
  rootPath: string,
  event: Record<string, unknown>,
): Promise<void> => {
  if (!(await exists(adceDir(rootPath)))) return;
  const projectId = hashProjectId(rootPath);
  const clean = sanitizeFeedbackRow(
    { ...event, ts: event.ts ?? new Date().toISOString() },
    projectId,
  );
  if (!clean) return;
  if (findForbiddenKey(clean)) return;
  await mkdir(metricsDir(rootPath), { recursive: true });
  await appendFile(
    localFeedbackLogPath(rootPath),
    `${JSON.stringify(clean)}\n`,
    "utf8",
  );
};
