import { access } from "node:fs/promises";
import type { RelationshipRecord, RelationshipType } from "@adce/shared";
import { RelationshipTypes } from "@adce/shared";
import {
  closeDatabase,
  deleteRelationshipById,
  findRelationshipByEdge,
  insertManualRelationship,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import {
  AdceNotInitializedError,
  resolveArtifactId,
} from "../artifacts/query.js";
import {
  InvalidRelationshipTypeError,
  RelationshipExistsError,
  RelationshipNotFoundError,
  RelationshipSelfLinkError,
} from "./errors.js";
import { resolveRelationshipId } from "./query.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export interface LinkProjectArtifactsInput {
  sourceIdOrPrefix: string;
  targetIdOrPrefix: string;
  type: string;
}

export const linkProjectArtifacts = async (
  rootPath: string,
  input: LinkProjectArtifactsInput,
): Promise<RelationshipRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const type = input.type.trim().toUpperCase();
  if (!(RelationshipTypes as readonly string[]).includes(type)) {
    throw new InvalidRelationshipTypeError(input.type);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const source = resolveArtifactId(db, input.sourceIdOrPrefix);
    const target = resolveArtifactId(db, input.targetIdOrPrefix);

    if (source.id === target.id) {
      throw new RelationshipSelfLinkError();
    }

    const existing = findRelationshipByEdge(
      db,
      source.id,
      target.id,
      type as RelationshipType,
    );
    if (existing) {
      throw new RelationshipExistsError(source.id, target.id, type);
    }

    return insertManualRelationship(db, {
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: type as RelationshipType,
    });
  } finally {
    closeDatabase(db);
  }
};

export const unlinkProjectRelationship = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<void> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const resolved = resolveRelationshipId(db, idOrPrefix);
    const deleted = deleteRelationshipById(db, resolved.id);
    if (!deleted) {
      throw new RelationshipNotFoundError(resolved.id);
    }
  } finally {
    closeDatabase(db);
  }
};
