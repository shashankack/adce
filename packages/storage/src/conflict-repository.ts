import { and, eq, like, ne } from "drizzle-orm";
import type {
  ConfidenceLevel,
  ConflictCategory,
  ConflictLifecycle,
  ConflictRecord,
  ConflictSeverity,
} from "@adce/shared";
import type { AdceDb } from "./database.js";
import { conflicts } from "./schema.js";

const toRecord = (row: typeof conflicts.$inferSelect): ConflictRecord => ({
  id: row.id,
  category: row.category as ConflictCategory,
  lifecycle: row.lifecycle as ConflictLifecycle,
  confidence: row.confidence as ConfidenceLevel,
  severity: row.severity as ConflictSeverity,
  sourceArtifactId: row.sourceArtifactId,
  targetArtifactId: row.targetArtifactId,
  relationshipId: row.relationshipId,
  summary: row.summary,
  evidence: row.evidence,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export interface UpsertDetectedConflictInput {
  category: ConflictCategory;
  confidence: ConfidenceLevel;
  severity: ConflictSeverity;
  sourceArtifactId: string | null;
  targetArtifactId: string | null;
  relationshipId: string | null;
  summary: string;
  evidence: string | null;
}

const CLOSED: ConflictLifecycle[] = ["REJECTED", "IGNORED", "RESOLVED"];

export const listConflicts = (
  db: AdceDb,
  options: { includeClosed?: boolean } = {},
): ConflictRecord[] => {
  if (options.includeClosed) {
    return db.select().from(conflicts).all().map(toRecord);
  }
  return db
    .select()
    .from(conflicts)
    .where(
      and(
        ne(conflicts.lifecycle, "REJECTED"),
        ne(conflicts.lifecycle, "IGNORED"),
        ne(conflicts.lifecycle, "RESOLVED"),
      ),
    )
    .all()
    .map(toRecord);
};

export const findConflictById = (
  db: AdceDb,
  id: string,
): ConflictRecord | null => {
  const row = db.select().from(conflicts).where(eq(conflicts.id, id)).get();
  return row ? toRecord(row) : null;
};

export const findConflictsByIdPrefix = (
  db: AdceDb,
  prefix: string,
): ConflictRecord[] => {
  if (!prefix) return [];
  return db
    .select()
    .from(conflicts)
    .where(like(conflicts.id, `${prefix}%`))
    .all()
    .map(toRecord);
};

export const findConflictByCategoryAndRelationship = (
  db: AdceDb,
  category: ConflictCategory,
  relationshipId: string,
): ConflictRecord | null => {
  const row = db
    .select()
    .from(conflicts)
    .where(
      and(
        eq(conflicts.category, category),
        eq(conflicts.relationshipId, relationshipId),
      ),
    )
    .get();
  return row ? toRecord(row) : null;
};

export const upsertDetectedConflict = (
  db: AdceDb,
  input: UpsertDetectedConflictInput,
): ConflictRecord => {
  if (input.relationshipId) {
    const existing = findConflictByCategoryAndRelationship(
      db,
      input.category,
      input.relationshipId,
    );
    if (existing) {
      if (CLOSED.includes(existing.lifecycle)) {
        return existing;
      }
      const updatedAt = new Date().toISOString();
      db.update(conflicts)
        .set({
          confidence: input.confidence,
          severity: input.severity,
          summary: input.summary,
          evidence: input.evidence,
          sourceArtifactId: input.sourceArtifactId,
          targetArtifactId: input.targetArtifactId,
          updatedAt,
        })
        .where(eq(conflicts.id, existing.id))
        .run();
      return {
        ...existing,
        confidence: input.confidence,
        severity: input.severity,
        summary: input.summary,
        evidence: input.evidence,
        sourceArtifactId: input.sourceArtifactId,
        targetArtifactId: input.targetArtifactId,
        updatedAt,
      };
    }
  }

  const now = new Date().toISOString();
  const created: ConflictRecord = {
    id: crypto.randomUUID(),
    category: input.category,
    lifecycle: "DETECTED",
    confidence: input.confidence,
    severity: input.severity,
    sourceArtifactId: input.sourceArtifactId,
    targetArtifactId: input.targetArtifactId,
    relationshipId: input.relationshipId,
    summary: input.summary,
    evidence: input.evidence,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(conflicts)
    .values({
      id: created.id,
      category: created.category,
      lifecycle: created.lifecycle,
      confidence: created.confidence,
      severity: created.severity,
      sourceArtifactId: created.sourceArtifactId,
      targetArtifactId: created.targetArtifactId,
      relationshipId: created.relationshipId,
      summary: created.summary,
      evidence: created.evidence,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
    .run();
  return created;
};

export const setConflictLifecycle = (
  db: AdceDb,
  id: string,
  lifecycle: ConflictLifecycle,
): ConflictRecord | null => {
  const existing = findConflictById(db, id);
  if (!existing) return null;
  const updatedAt = new Date().toISOString();
  db.update(conflicts)
    .set({ lifecycle, updatedAt })
    .where(eq(conflicts.id, id))
    .run();
  return { ...existing, lifecycle, updatedAt };
};

export const countConflicts = (
  db: AdceDb,
  options: { includeClosed?: boolean } = {},
): number => listConflicts(db, options).length;
