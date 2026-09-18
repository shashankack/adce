import type {
  ArtifactRecord,
  ConflictCategory,
  ConflictSeverity,
  RelationshipRecord,
} from "@adce/shared";
import type { AdceDb } from "@adce/storage";
import { findArtifactById, upsertDetectedConflict } from "@adce/storage";

/** Doc/test lagging source by at least this many ms → conflict. */
const MIN_GAP_MS = 24 * 60 * 60 * 1000; // 1 day
const HIGH_GAP_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MEDIUM_GAP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const severityForGap = (gapMs: number): ConflictSeverity => {
  if (gapMs >= HIGH_GAP_MS) return "HIGH";
  if (gapMs >= MEDIUM_GAP_MS) return "MEDIUM";
  return "LOW";
};

const categoryForEdge = (type: string): ConflictCategory => {
  if (type === "TESTS") return "TEST_MISMATCH";
  if (type === "DOCUMENTS") return "DOCUMENTATION_MISMATCH";
  return "TEMPORAL_MISMATCH";
};

/**
 * Deterministic temporal lag: for DOCUMENTS/TESTS edges, if the dependent
 * artifact mtime is older than the source by >= 1 day, raise a conflict.
 * Confidence stays POTENTIAL/LIKELY — never CONFIRMED from mtime alone.
 */
export const detectTemporalMismatches = (
  db: AdceDb,
  relationships: RelationshipRecord[],
): number => {
  let upserted = 0;

  for (const rel of relationships) {
    if (rel.verification === "REJECTED" || rel.verification === "IGNORED") {
      continue;
    }
    if (rel.type !== "DOCUMENTS" && rel.type !== "TESTS") continue;

    const source = findArtifactById(db, rel.sourceArtifactId);
    const target = findArtifactById(db, rel.targetArtifactId);
    if (!source || !target) continue;
    if (source.mtimeMs == null || target.mtimeMs == null) continue;

    // DOCUMENTS: doc → source (source should not be much newer than doc)
    // TESTS: test → source (source should not be much newer than test)
    const dependent: ArtifactRecord = source;
    const primary: ArtifactRecord = target;
    const gapMs = primary.mtimeMs! - dependent.mtimeMs!;
    if (gapMs < MIN_GAP_MS) continue;

    const category = categoryForEdge(rel.type);
    const severity = severityForGap(gapMs);
    const confidence = severity === "HIGH" ? "LIKELY" : "POTENTIAL";
    const gapDays = Math.round(gapMs / (24 * 60 * 60 * 1000));
    const dependentLabel = dependent.path ?? dependent.name;
    const primaryLabel = primary.path ?? primary.name;

    upsertDetectedConflict(db, {
      category,
      confidence,
      severity,
      sourceArtifactId: dependent.id,
      targetArtifactId: primary.id,
      relationshipId: rel.id,
      summary:
        rel.type === "DOCUMENTS"
          ? `Documentation may be stale: ${dependentLabel} is ~${gapDays}d older than ${primaryLabel}`
          : `Test may be stale: ${dependentLabel} is ~${gapDays}d older than ${primaryLabel}`,
      evidence: JSON.stringify({
        relationshipType: rel.type,
        dependentPath: dependent.path,
        primaryPath: primary.path,
        dependentMtimeMs: dependent.mtimeMs,
        primaryMtimeMs: primary.mtimeMs,
        gapMs,
        gapDays,
      }),
    });
    upserted += 1;
  }

  return upserted;
};
