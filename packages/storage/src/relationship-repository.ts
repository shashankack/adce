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
  const result = db
    .delete(relationships)
    .where(eq(relationships.id, id))
    .run();
  return result.changes > 0;
};

export const countRelationships = (db: AdceDb): number =>
  db.select().from(relationships).all().length;
