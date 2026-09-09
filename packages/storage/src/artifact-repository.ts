import { and, eq, isNotNull, inArray } from "drizzle-orm";
import type { ArtifactRecord, ArtifactType } from "@adce/shared";
import type { AdceDb } from "./database.js";
import { artifacts } from "./schema.js";

const toRecord = (row: typeof artifacts.$inferSelect): ArtifactRecord => {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    type: row.type as ArtifactRecord["type"],
    origin: row.origin as ArtifactRecord["origin"],
    verification: row.verification as ArtifactRecord["verification"],
    health: row.health as ArtifactRecord["health"],
    authority: row.authority as ArtifactRecord["authority"],
    contentHash: row.contentHash,
    sizeBytes: row.sizeBytes,
    mtimeMs: row.mtimeMs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export interface ListArtifactOptions {
  types?: ArtifactType[];
}

export const listArtifacts = (
  db: AdceDb,
  options: ListArtifactOptions = {},
): ArtifactRecord[] => {
  const { types } = options;

  if (types && types.length > 0) {
    return db
      .select()
      .from(artifacts)
      .where(inArray(artifacts.type, types))
      .all()
      .map(toRecord);
  }
  return db.select().from(artifacts).all().map(toRecord);
};

export const listDetectedPathArtifacts = (db: AdceDb): ArtifactRecord[] =>
  db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.origin, "DETECTED"), isNotNull(artifacts.path)))
    .all()
    .map(toRecord);

export const findArtifactByPath = (
  db: AdceDb,
  filePath: string,
): ArtifactRecord | null => {
  const row = db
    .select()
    .from(artifacts)
    .where(eq(artifacts.path, filePath))
    .get();
  return row ? toRecord(row) : null;
};

export const findArtifactById = (
  db: AdceDb,
  id: string,
): ArtifactRecord | null => {
  const row = db.select().from(artifacts).where(eq(artifacts.id, id)).get();
  return row ? toRecord(row) : null;
};

export function upsertDetectedByPath(
  db: AdceDb,
  incoming: Omit<ArtifactRecord, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): ArtifactRecord {
  const existing = incoming.path ? findArtifactByPath(db, incoming.path) : null;

  const now = incoming.updatedAt;
  if (existing) {
    // Preserve human fields later; for now preserve id + createdAt
    const updated: ArtifactRecord = {
      ...existing,
      name: incoming.name,
      type: incoming.type,
      contentHash: incoming.contentHash,
      sizeBytes: incoming.sizeBytes,
      mtimeMs: incoming.mtimeMs,
      updatedAt: now,
    };
    db.update(artifacts)
      .set({
        name: updated.name,
        type: updated.type,
        contentHash: updated.contentHash,
        sizeBytes: updated.sizeBytes,
        mtimeMs: updated.mtimeMs,
        updatedAt: updated.updatedAt,
      })
      .where(eq(artifacts.id, existing.id))
      .run();
    return updated;
  }

  const created: ArtifactRecord = {
    id: incoming.id ?? crypto.randomUUID(),
    path: incoming.path,
    name: incoming.name,
    type: incoming.type,
    origin: "DETECTED",
    verification: "UNREVIEWED",
    health: "UNKNOWN",
    authority: "UNKNOWN",
    contentHash: incoming.contentHash,
    sizeBytes: incoming.sizeBytes,
    mtimeMs: incoming.mtimeMs,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(artifacts)
    .values({
      id: created.id,
      path: created.path,
      name: created.name,
      type: created.type,
      origin: created.origin,
      verification: created.verification,
      health: created.health,
      authority: created.authority,
      contentHash: created.contentHash,
      sizeBytes: created.sizeBytes,
      mtimeMs: created.mtimeMs,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
    .run();
  return created;
}

export const deleteArtifactById = (db: AdceDb, id: string): void => {
  db.delete(artifacts).where(eq(artifacts.id, id)).run();
};

export const countArtifacts = (db: AdceDb): number => {
  return db.select().from(artifacts).all().length;
};
