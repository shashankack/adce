import path from "node:path";
import type {
  ArtifactRecord,
  ConfidenceLevel,
  RelationshipType,
} from "@adce/shared";
import type { AdceDb } from "@adce/storage";
import {
  deleteRelationshipById,
  listRelationships,
  upsertDetectedRelationship,
} from "@adce/storage";

export interface InferredEdge {
  sourceArtifactId: string;
  targetArtifactId: string;
  type: RelationshipType;
  confidence: ConfidenceLevel;
  evidence: string;
}

const TEST_SUFFIX = /\.(test|spec)\.(ts|tsx|js|jsx|mts|cts)$/i;

/** Agent / meta instruction files — not project documentation of every source file. */
const META_DOC_BASENAME =
  /^(agents|claude|cursor|copilot-instructions|gemini|codeowners|license|licence|security|code_of_conduct)(\.|$)/i;

/** Project overview docs — only link to entrypoint-like sources. */
const PROJECT_DOC_BASENAME =
  /^(readme|contributing|changelog|changes|history)(\.|$)/i;

const ENTRYPOINT_PATH =
  /(?:^|\/)(?:index|main|app|page|layout|server|mod)\.(?:ts|tsx|js|jsx|mjs|cjs)$/i;

const edgeKey = (
  sourceArtifactId: string,
  targetArtifactId: string,
  type: RelationshipType,
): string => `${sourceArtifactId}\0${targetArtifactId}\0${type}`;

const basenameOf = (artifactPath: string): string =>
  path.posix.basename(artifactPath.replace(/\\/g, "/"));

const stemOf = (fileName: string): string =>
  fileName.replace(/\.[^.]+$/i, "").toLowerCase();

const isMetaDoc = (artifactPath: string): boolean =>
  META_DOC_BASENAME.test(stemOf(basenameOf(artifactPath))) ||
  META_DOC_BASENAME.test(basenameOf(artifactPath).toLowerCase());

const isProjectDoc = (artifactPath: string): boolean =>
  PROJECT_DOC_BASENAME.test(stemOf(basenameOf(artifactPath)));

const isEntrypoint = (artifactPath: string): boolean =>
  ENTRYPOINT_PATH.test(artifactPath.replace(/\\/g, "/"));

/** Meaningful name overlap between a doc and a source (not cartesian). */
const nameOverlap = (docPath: string, sourcePath: string): boolean => {
  const dn = docPath.replace(/\\/g, "/").toLowerCase();
  const sn = sourcePath.replace(/\\/g, "/").toLowerCase();
  const token = sn.split("/").pop()?.replace(/\.[^.]+$/, "");
  if (!token || token.length < 4) return false;
  // Avoid matching tiny / generic tokens that appear everywhere
  if (["page", "index", "main", "app", "util", "utils", "type", "types"].includes(token)) {
    return false;
  }
  return dn.includes(token);
};

/**
 * DOCUMENTS inference (tightened):
 * - Skip agent/meta docs (AGENTS.md, CLAUDE.md, …) — they are not "docs of every file".
 * - Project docs (README, …) → only entrypoint-like sources.
 * - Other docs → sources with path/name token overlap.
 */
const inferDocuments = (artifacts: ArtifactRecord[]): InferredEdge[] => {
  const docs = artifacts.filter((a) => a.type === "DOCUMENTATION" && a.path);
  const sources = artifacts.filter((a) => a.type === "SOURCE" && a.path);
  const edges: InferredEdge[] = [];
  const seen = new Set<string>();

  const push = (edge: InferredEdge): void => {
    const key = edgeKey(
      edge.sourceArtifactId,
      edge.targetArtifactId,
      edge.type,
    );
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const doc of docs) {
    const docPath = doc.path!;
    if (isMetaDoc(docPath)) continue;

    if (isProjectDoc(docPath)) {
      for (const source of sources) {
        if (!isEntrypoint(source.path!)) continue;
        push({
          sourceArtifactId: doc.id,
          targetArtifactId: source.id,
          type: "DOCUMENTS",
          confidence: "POTENTIAL",
          evidence: `project doc → entrypoint: ${docPath} → ${source.path}`,
        });
      }
      continue;
    }

    for (const source of sources) {
      if (!nameOverlap(docPath, source.path!)) continue;
      push({
        sourceArtifactId: doc.id,
        targetArtifactId: source.id,
        type: "DOCUMENTS",
        confidence: "POTENTIAL",
        evidence: `name overlap: ${docPath} ↔ ${source.path}`,
      });
    }
  }
  return edges;
};

const inferTests = (artifacts: ArtifactRecord[]): InferredEdge[] => {
  const byPath = new Map(
    artifacts.filter((a) => a.path).map((a) => [a.path!, a]),
  );
  const edges: InferredEdge[] = [];

  for (const test of artifacts) {
    if (!test.path || !TEST_SUFFIX.test(test.path)) continue;

    const base = test.path.replace(TEST_SUFFIX, "");
    const candidates = [
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.jsx`,
    ];

    for (const candidate of candidates) {
      const source = byPath.get(candidate);
      if (!source) continue;
      edges.push({
        sourceArtifactId: test.id,
        targetArtifactId: source.id,
        type: "TESTS",
        confidence: "LIKELY",
        evidence: `test naming: ${test.path} → ${candidate}`,
      });
      break;
    }
  }
  return edges;
};

/** Pure: no DB. Used by tests and scan. */
export const inferRelationshipCandidates = (
  artifacts: ArtifactRecord[],
): InferredEdge[] => {
  const edges: InferredEdge[] = [];
  edges.push(...inferDocuments(artifacts));
  edges.push(...inferTests(artifacts));
  return edges;
};

/**
 * Persist inferred edges and drop stale DETECTED+UNREVIEWED DOCUMENTS edges
 * that the new (non-cartesian) rules no longer produce — cleans fan-out graphs.
 */
export const persistInferredRelationships = (
  db: AdceDb,
  artifacts: ArtifactRecord[],
): number => {
  const candidates = inferRelationshipCandidates(artifacts);
  const keep = new Set(
    candidates.map((c) =>
      edgeKey(c.sourceArtifactId, c.targetArtifactId, c.type),
    ),
  );

  for (const rel of listRelationships(db)) {
    if (rel.type !== "DOCUMENTS") continue;
    if (rel.origin !== "DETECTED") continue;
    if (rel.verification !== "UNREVIEWED") continue;
    const key = edgeKey(rel.sourceArtifactId, rel.targetArtifactId, rel.type);
    if (!keep.has(key)) {
      deleteRelationshipById(db, rel.id);
    }
  }

  for (const edge of candidates) {
    upsertDetectedRelationship(db, {
      sourceArtifactId: edge.sourceArtifactId,
      targetArtifactId: edge.targetArtifactId,
      type: edge.type,
      confidence: edge.confidence,
      evidence: edge.evidence,
    });
  }
  return candidates.length;
};
