import { access } from "node:fs/promises";
import path from "node:path";
import type {
  AnalyzeSuggestion,
  ConfidenceLevel,
  RelationshipRecord,
  RelationshipType,
} from "@adce/shared";
import { RelationshipTypes } from "@adce/shared";
import {
  closeDatabase,
  findRelationshipByEdge,
  listArtifacts,
  listRelationships,
  openDatabase,
  setRelationshipVerification,
  upsertDetectedRelationship,
} from "@adce/storage";
import { analyzeProject } from "../analyze/analyze-project.js";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { adceDir, dbPath } from "../project/paths.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export interface RelationshipSuggestion {
  sourceArtifactId: string;
  targetArtifactId: string;
  sourcePath: string;
  targetPath: string;
  type: RelationshipType;
  confidence: ConfidenceLevel;
  score: number;
  reason: string;
  source: "heuristic" | "ml";
}

const META_DOC = /^(agents|claude|gemini|license|licence)(\.|$)/i;

const TYPE_PAIRS: Array<[string, string, RelationshipType]> = [
  ["DOCUMENTATION", "SOURCE", "DOCUMENTS"],
  ["DOCUMENTATION", "SCHEMA", "DOCUMENTS"],
  ["DOCUMENTATION", "API_SPEC", "DOCUMENTS"],
  ["SCHEMA", "SOURCE", "SPECIFIES"],
  ["API_SPEC", "SOURCE", "SPECIFIES"],
  ["SPECIFICATION", "SOURCE", "SPECIFIES"],
  ["TEST", "SOURCE", "TESTS"],
  // No BUILD/CONFIGURATION → SOURCE: project-wide configs (tsconfig, etc.)
];

const basename = (p: string): string =>
  path.posix.basename(p.replace(/\\/g, "/"));

const stem = (p: string): string =>
  basename(p).replace(/\.[^.]+$/i, "").toLowerCase();

const nameOverlap = (docPath: string, sourcePath: string): boolean => {
  const token = stem(sourcePath);
  if (!token || token.length < 4) return false;
  if (["page", "index", "main", "app", "util", "utils", "type", "types"].includes(token)) {
    return false;
  }
  return docPath.replace(/\\/g, "/").toLowerCase().includes(token);
};

const pairKey = (
  sourceId: string,
  targetId: string,
  type: string,
): string => `${sourceId}\0${targetId}\0${type}`;

/** Heuristic fallback when ML is offline — name overlap for typed pairs. */
export const heuristicRelationshipSuggestions = (
  artifacts: Array<{
    id: string;
    path: string | null;
    name: string;
    type: string;
    verification: string;
  }>,
  relationships: Array<{
    sourceArtifactId: string;
    targetArtifactId: string;
    type: string;
  }>,
  limit = 24,
): RelationshipSuggestion[] => {
  const active = artifacts.filter(
    (a) => a.verification !== "REJECTED" && a.verification !== "IGNORED" && a.path,
  );
  const existing = new Set(
    relationships.map((r) =>
      pairKey(r.sourceArtifactId, r.targetArtifactId, r.type),
    ),
  );
  const byType = new Map<string, typeof active>();
  for (const a of active) {
    const list = byType.get(a.type) ?? [];
    list.push(a);
    byType.set(a.type, list);
  }

  const out: RelationshipSuggestion[] = [];
  for (const [leftT, rightT, relType] of TYPE_PAIRS) {
    for (const left of byType.get(leftT) ?? []) {
      if (META_DOC.test(stem(left.path!)) || left.path!.endsWith(".mdc")) continue;
      for (const right of byType.get(rightT) ?? []) {
        if (left.id === right.id) continue;
        if (existing.has(pairKey(left.id, right.id, relType))) continue;
        if (relType === "TESTS") {
          // Prefer naming rule already in inferTests; skip broad heuristic
          continue;
        }
        if (!nameOverlap(left.path!, right.path!)) continue;
        out.push({
          sourceArtifactId: left.id,
          targetArtifactId: right.id,
          sourcePath: left.path!,
          targetPath: right.path!,
          type: relType,
          confidence: "POTENTIAL",
          score: 0.5,
          reason: `Name overlap suggests ${relType}`,
          source: "heuristic",
        });
      }
    }
  }
  return out.slice(0, limit);
};

const fromAnalyze = (
  suggestions: AnalyzeSuggestion[],
  pathById: Map<string, string>,
): RelationshipSuggestion[] => {
  const out: RelationshipSuggestion[] = [];
  for (const s of suggestions) {
    if (s.kind !== "relationship") continue;
    const sourceId = s.artifactId;
    const targetId = s.targetArtifactId;
    if (!sourceId || !targetId) continue;
    const typeRaw = (s.relationshipType ?? "RELATED_TO").toUpperCase();
    if (!(RelationshipTypes as readonly string[]).includes(typeRaw)) continue;
    out.push({
      sourceArtifactId: sourceId,
      targetArtifactId: targetId,
      sourcePath: pathById.get(sourceId) ?? sourceId.slice(0, 8),
      targetPath: pathById.get(targetId) ?? targetId.slice(0, 8),
      type: typeRaw as RelationshipType,
      confidence: s.confidence === "LIKELY" ? "LIKELY" : "POTENTIAL",
      score: s.score ?? 0.5,
      reason: s.reason,
      source: s.source,
    });
  }
  return out;
};

export interface SuggestRelationshipsOptions {
  mlUrl?: string | null;
  limit?: number;
  /** Skip ML even if ADCE_ML_URL is set */
  skipMl?: boolean;
}

export const suggestProjectRelationships = async (
  rootPath: string,
  options: SuggestRelationshipsOptions = {},
): Promise<{
  suggestions: RelationshipSuggestion[];
  engine: "heuristic" | "ml" | "hybrid";
}> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const limit = options.limit ?? 24;
  const db = openDatabase(dbPath(rootPath));
  let artifacts;
  let relationships;
  try {
    artifacts = listArtifacts(db);
    relationships = listRelationships(db);
  } finally {
    closeDatabase(db);
  }

  const pathById = new Map(
    artifacts
      .filter((a) => a.path)
      .map((a) => [a.id, a.path as string] as const),
  );

  const heuristic = heuristicRelationshipSuggestions(
    artifacts,
    relationships,
    limit,
  );

  const skipMl = options.skipMl === true || options.mlUrl === null;
  if (skipMl) {
    return { suggestions: heuristic, engine: "heuristic" };
  }

  try {
    const report = await analyzeProject(rootPath, {
      deep: true,
      useCache: false,
      apply: false,
      skipMl: options.skipMl,
      mlUrl: options.mlUrl,
    });
    const ml = fromAnalyze(report.suggestions, pathById);
    const seen = new Set(
      ml.map((s) => pairKey(s.sourceArtifactId, s.targetArtifactId, s.type)),
    );
    const merged = [
      ...ml,
      ...heuristic.filter(
        (h) =>
          !seen.has(pairKey(h.sourceArtifactId, h.targetArtifactId, h.type)),
      ),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const engine =
      report.engine === "ml" || report.engine === "hybrid"
        ? report.engine
        : ml.length > 0
          ? "hybrid"
          : "heuristic";
    return { suggestions: merged, engine };
  } catch {
    return { suggestions: heuristic, engine: "heuristic" };
  }
};

/** Accept a suggestion: DETECTED edge + human VERIFIED (Hybrid Lock). */
export const acceptRelationshipSuggestion = async (
  rootPath: string,
  suggestion: Pick<
    RelationshipSuggestion,
    "sourceArtifactId" | "targetArtifactId" | "type" | "confidence" | "reason"
  >,
): Promise<RelationshipRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }
  const db = openDatabase(dbPath(rootPath));
  try {
    const row = upsertDetectedRelationship(db, {
      sourceArtifactId: suggestion.sourceArtifactId,
      targetArtifactId: suggestion.targetArtifactId,
      type: suggestion.type,
      confidence: suggestion.confidence,
      evidence: suggestion.reason,
    });
    return (
      setRelationshipVerification(db, row.id, "VERIFIED") ?? {
        ...row,
        verification: "VERIFIED",
      }
    );
  } finally {
    closeDatabase(db);
  }
};

/** Reject: keep a REJECTED tombstone so ML won't re-suggest the pair. */
export const rejectRelationshipSuggestion = async (
  rootPath: string,
  suggestion: Pick<
    RelationshipSuggestion,
    "sourceArtifactId" | "targetArtifactId" | "type" | "reason"
  >,
): Promise<RelationshipRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }
  const db = openDatabase(dbPath(rootPath));
  try {
    const existing = findRelationshipByEdge(
      db,
      suggestion.sourceArtifactId,
      suggestion.targetArtifactId,
      suggestion.type,
    );
    const row =
      existing ??
      upsertDetectedRelationship(db, {
        sourceArtifactId: suggestion.sourceArtifactId,
        targetArtifactId: suggestion.targetArtifactId,
        type: suggestion.type,
        confidence: "POTENTIAL",
        evidence: suggestion.reason,
      });
    return (
      setRelationshipVerification(db, row.id, "REJECTED") ?? {
        ...row,
        verification: "REJECTED",
      }
    );
  } finally {
    closeDatabase(db);
  }
};
