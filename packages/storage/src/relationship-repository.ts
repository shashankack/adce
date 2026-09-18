import { and, eq, like } from "drizzle-orm";
import type {
  ConfidenceLevel,
  RelationshipOrigin,
  RelationshipRecord,
  RelationshipType,
  VerificationState,
} from "@adce/shared";
import type { AdceDb } from "./database.js";
import { relationships } from "./schema.js";

const toRecord = (
  row: typeof relationships.$inferSelect,
): RelationshipRecord => {
  return {
    id: row.id,
    sourceArtifactId: row.sourceArtifactId,
    targetArtifactId: row.targetArtifactId,
    type: row.type as RelationshipType,
    origin: row.origin as RelationshipOrigin,
    confidence: row.confidence as ConfidenceLevel,
    verification: row.verification as VerificationState,
    evidence: row.evidence,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export interface InsertManualRelationshipInput {
  sourceArtifactId: string;
  targetArtifactId: string;
  type: RelationshipType;
}

export interface UpsertDetectedRelationshipInput {
  sourceArtifactId: string;
  targetArtifactId: string;
  type: RelationshipType;
  confidence: ConfidenceLevel;
  evidence: string | null;
}

export const listRelationships = (db: AdceDb): RelationshipRecord[] =>
  db.select().from(relationships).all().map(toRecord);

export const findRelationshipById = (
  db: AdceDb,
  id: string,
): RelationshipRecord | null => {
  const row = db
    .select()
    .from(relationships)
    .where(eq(relationships.id, id))
    .get();
  return row ? toRecord(row) : null;
};

export const findRelationshipsByIdPrefix = (
  db: AdceDb,
  prefix: string,
): RelationshipRecord[] => {
  if (!prefix) return [];
  return db
    .select()
    .from(relationships)
    .where(like(relationships.id, `${prefix}%`))
    .all()
    .map(toRecord);
};

export const findRelationshipByEdge = (
  db: AdceDb,
  sourceArtifactId: string,
  targetArtifactId: string,
  type: RelationshipType,
): RelationshipRecord | null => {
  const row = db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.sourceArtifactId, sourceArtifactId),
        eq(relationships.targetArtifactId, targetArtifactId),
        eq(relationships.type, type),
      ),
    )
    .get();
  return row ? toRecord(row) : null;
};

export const insertManualRelationship = (
  db: AdceDb,
  input: InsertManualRelationshipInput,
): RelationshipRecord => {
  const now = new Date().toISOString();
  const created: RelationshipRecord = {
    id: crypto.randomUUID(),
    sourceArtifactId: input.sourceArtifactId,
    targetArtifactId: input.targetArtifactId,
    type: input.type,
    origin: "MANUAL",
    confidence: "CONFIRMED",
    verification: "VERIFIED",
    evidence: null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(relationships)
    .values({
      id: created.id,
      sourceArtifactId: created.sourceArtifactId,
      targetArtifactId: created.targetArtifactId,
      type: created.type,
      origin: created.origin,
      confidence: created.confidence,
      verification: created.verification,
      evidence: created.evidence,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
    .run();
  return created;
};

export const deleteRelationshipById = (db: AdceDb, id: string): boolean => {
  const result = db.delete(relationships).where(eq(relationships.id, id)).run();
  return result.changes > 0;
};

export const countRelationships = (db: AdceDb): number =>
  db.select().from(relationships).all().length;

export const upsertDetectedRelationship = (
  db: AdceDb,
  input: UpsertDetectedRelationshipInput,
): RelationshipRecord => {
  const existing = findRelationshipByEdge(
    db,
    input.sourceArtifactId,
    input.targetArtifactId,
    input.type,
  );

  // Human / rejection win — inference must not touch these
  if (existing?.origin === "MANUAL") return existing;
  if (existing?.verification === "REJECTED") return existing;

  const now = new Date().toISOString();

  if (existing) {
    // Refresh evidence/confidence only; keep verification/origin/id
    db.update(relationships)
      .set({
        confidence: input.confidence,
        evidence: input.evidence,
        updatedAt: now,
      })
      .where(eq(relationships.id, existing.id))
      .run();

    return {
      ...existing,
      confidence: input.confidence,
      evidence: input.evidence,
      updatedAt: now,
    };
  }

  const created: RelationshipRecord = {
    id: crypto.randomUUID(),
    sourceArtifactId: input.sourceArtifactId,
    targetArtifactId: input.targetArtifactId,
    type: input.type,
    origin: "DETECTED",
    confidence: input.confidence,
    verification: "UNREVIEWED",
    evidence: input.evidence,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(relationships)
    .values({
      id: created.id,
      sourceArtifactId: created.sourceArtifactId,
      targetArtifactId: created.targetArtifactId,
      type: created.type,
      origin: created.origin,
      confidence: created.confidence,
      verification: created.verification,
      evidence: created.evidence,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
    .run();

  return created;
};

export const setRelationshipVerification = (
  db: AdceDb,
  id: string,
  verification: VerificationState,
): RelationshipRecord | null => {
  const existing = findRelationshipById(db, id);
  if (!existing) return null;

  const updatedAt = new Date().toISOString();
  db.update(relationships)
    .set({ verification, updatedAt })
    .where(eq(relationships.id, id))
    .run();

  return { ...existing, verification, updatedAt };
};
