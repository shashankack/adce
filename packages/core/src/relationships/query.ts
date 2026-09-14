import { access } from "node:fs/promises";
import type { RelationshipRecord } from "@adce/shared";
import {
  closeDatabase,
  findRelationshipById,
  findRelationshipsByIdPrefix,
  listRelationships,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import { AdceNotInitializedError } from "../artifacts/query.js";
import {
  AmbiguousRelationshipIdError,
  RelationshipNotFoundError,
} from "./errors.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export const resolveRelationshipId = (
  db: Parameters<typeof findRelationshipById>[0],
  idOrPrefix: string,
): RelationshipRecord => {
  const trimmed = idOrPrefix.trim();
  if (!trimmed) {
    throw new RelationshipNotFoundError(idOrPrefix);
  }

  const exact = findRelationshipById(db, trimmed);
  if (exact) return exact;

  const matches = findRelationshipsByIdPrefix(db, trimmed);
  if (matches.length === 0) {
    throw new RelationshipNotFoundError(trimmed);
  }
  if (matches.length > 1) {
    throw new AmbiguousRelationshipIdError(
      trimmed,
      matches.map((m) => m.id),
    );
  }
  return matches[0]!;
};

export const listProjectRelationships = async (
  rootPath: string,
): Promise<RelationshipRecord[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return listRelationships(db);
  } finally {
    closeDatabase(db);
  }
};

export const getProjectRelationship = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<RelationshipRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return resolveRelationshipId(db, idOrPrefix);
  } finally {
    closeDatabase(db);
  }
};
