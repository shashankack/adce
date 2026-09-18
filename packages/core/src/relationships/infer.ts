import type {
  ArtifactRecord,
  ConfidenceLevel,
  RelationshipType,
} from "@adce/shared";
import type { AdceDb } from "@adce/storage";
import { upsertDetectedRelationship } from "@adce/storage";

export interface InferredEdge {
  sourceArtifactId: string;
  targetArtifactId: string;
  type: RelationshipType;
  confidence: ConfidenceLevel;
  evidence: string;
}

const TEST_SUFFIX = /\.(test|spec)\.(ts|tsx|js|jsx|mts|cts)$/i;

const inferDocuments = (artifacts: ArtifactRecord[]): InferredEdge[] => {
  const docs = artifacts.filter((a) => a.type === "DOCUMENTATION" && a.path);
  const sources = artifacts.filter((a) => a.type === "SOURCE" && a.path);
  const edges: InferredEdge[] = [];

  for (const doc of docs) {
    for (const source of sources) {
      edges.push({
        sourceArtifactId: doc.id,
        targetArtifactId: source.id,
        type: "DOCUMENTS",
        confidence: "POTENTIAL",
        evidence: "documentation→source by artifact type",
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

export const persistInferredRelationships = (
  db: AdceDb,
  artifacts: ArtifactRecord[],
): number => {
  const candidates = inferRelationshipCandidates(artifacts);
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
