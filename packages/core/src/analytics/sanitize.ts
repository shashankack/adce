import { createHash } from "node:crypto";

/** Paths that must never appear in analytics (aligned with ML privacy filter). */
export const SECRETISH_PATH =
  /(^|\/)(\.env|\.env\..*|credentials|secrets?|id_rsa|.*\.(pem|key|p12|pfx))$/i;

/** Keys that must never appear anywhere in an analytics payload. */
export const FORBIDDEN_ANALYTICS_KEYS = new Set([
  "files",
  "repoArchive",
  "fullTree",
  "content",
  "excerpt",
  "source",
  "body",
  "diff",
  "evidence",
  "patch",
  "code",
  "text",
  "repo",
  "archive",
]);

const METRIC_ALLOW = new Set([
  "ts",
  "projectId",
  "taskPresent",
  "compact",
  "packUsed",
  "mlUrlSet",
  "tokensFull",
  "tokensDelivered",
  "tokensSaved",
  "savingsPercent",
  "tokensIfCompact",
  "potentialSaved",
  "potentialPercent",
  "mustRead",
  "caution",
  "trustOrder",
  "alsoRelevant",
  "estimator",
]);

const ABS_PATH =
  /(?:[A-Za-z]:\\|\/(?:Users|home|home\/|var\/|tmp\/|private\/))[^\s"'`]+/gi;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL = /https?:\/\/[^\s"'`]+/gi;

export const hashProjectId = (
  rootPath: string,
  salt = process.env.ADCE_ANALYTICS_SALT ?? "",
): string =>
  createHash("sha256")
    .update(`${salt}\0${pathNormalize(rootPath)}`)
    .digest("hex")
    .slice(0, 32);

const pathNormalize = (p: string): string =>
  p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();

/** Coarse path pattern — never the full relative path on the wire. */
export const pathPattern = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  const norm = relativePath.replace(/\\/g, "/");
  if (SECRETISH_PATH.test(norm)) return null;
  const parts = norm.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const base = parts[parts.length - 1]!;
  const extMatch = base.match(/(\.[^.]+)$/);
  const ext = extMatch ? extMatch[1]!.toLowerCase() : "";
  const top = parts[0]!;
  if (parts.length === 1) {
    return ext ? `*${ext}` : "*";
  }
  return `${top}/**/*${ext || ""}`;
};

export const sanitizeConflictSummary = (
  text: string | null | undefined,
  maxLen = 200,
): string | null => {
  if (!text) return null;
  let s = text
    .replace(EMAIL, "[email]")
    .replace(URL, "[url]")
    .replace(ABS_PATH, "[path]");
  // Drop anything that still looks like a multi-segment project path with a file ext
  s = s.replace(
    /(?:^|[\s`'"])((?:[\w.-]+\/){1,}[\w.-]+\.[a-zA-Z0-9]{1,8})/g,
    " [file] ",
  );
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLen) s = `${s.slice(0, maxLen - 1)}…`;
  return s || null;
};

export const isSecretPath = (p: string | null | undefined): boolean =>
  Boolean(p && SECRETISH_PATH.test(p.replace(/\\/g, "/")));

/** Deep-scan object keys; returns first forbidden key found. */
export const findForbiddenKey = (value: unknown, path = ""): string | null => {
  if (value == null) return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const hit = findForbiddenKey(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_ANALYTICS_KEYS.has(k)) {
        return path ? `${path}.${k}` : k;
      }
      const hit = findForbiddenKey(v, path ? `${path}.${k}` : k);
      if (hit) return hit;
    }
  }
  return null;
};

export const sanitizeMetricRow = (
  row: Record<string, unknown>,
  projectId: string,
): Record<string, unknown> | null => {
  const out: Record<string, unknown> = { projectId };
  for (const [k, v] of Object.entries(row)) {
    if (k === "rootPath" || k === "task") continue;
    if (!METRIC_ALLOW.has(k) && k !== "projectId") continue;
    out[k] = v;
  }
  // Task presence only — never the task string (may contain secrets / code)
  if ("task" in row) {
    out.taskPresent = row.task != null && String(row.task).length > 0;
  }
  if (!out.ts) return null;
  return out;
};

export const sanitizeFeedbackRow = (
  row: Record<string, unknown>,
  projectId: string,
): Record<string, unknown> | null => {
  const action = String(row.action ?? "").toLowerCase();
  if (!["confirm", "reject", "resolve", "ignore"].includes(action)) return null;
  return {
    projectId,
    ts: row.ts ?? new Date().toISOString(),
    action,
    conflictId: typeof row.conflictId === "string" ? row.conflictId.slice(0, 64) : null,
    category: typeof row.category === "string" ? row.category : null,
    severity: typeof row.severity === "string" ? row.severity : null,
    confidence: typeof row.confidence === "string" ? row.confidence : null,
    summary: sanitizeConflictSummary(
      typeof row.summary === "string" ? row.summary : null,
    ),
    score: typeof row.score === "number" ? row.score : null,
    reward: typeof row.reward === "number" ? row.reward : null,
    embedder: typeof row.embedder === "string" ? row.embedder : null,
  };
};
