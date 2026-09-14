import { access } from "node:fs/promises";
import type { RelationshipRecord } from "@adce/shared";
import {
  closeDatabase,
  findArtifactById,
  listRelationships,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import { AdceNotInitializedError } from "../artifacts/query.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export interface GraphEdgeView {
  relationship: RelationshipRecord;
  sourceLabel: string;
  targetLabel: string;
}

const artifactLabel = (
  db: Parameters<typeof findArtifactById>[0],
  artifactId: string,
): string => {
  const artifact = findArtifactById(db, artifactId);
  if (!artifact) return artifactId;
  return artifact.path ?? artifact.name;
};

export const listProjectGraph = async (
  rootPath: string,
): Promise<GraphEdgeView[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return listRelationships(db).map((relationship) => ({
      relationship,
      sourceLabel: artifactLabel(db, relationship.sourceArtifactId),
      targetLabel: artifactLabel(db, relationship.targetArtifactId),
    }));
  } finally {
    closeDatabase(db);
  }
};
