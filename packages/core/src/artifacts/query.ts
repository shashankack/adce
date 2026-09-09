import { access } from "node:fs/promises";
import type { ArtifactRecord } from "@adce/shared";
import {
  closeDatabase,
  findArtifactById,
  listArtifacts as listArtifactsFromDb,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export class AdceNotInitializedError extends Error {
  constructor(rootPath: string) {
    super(`ADCE is not initialized in ${rootPath}. Run \`adce init\` first.`);
    this.name = "AdceNotInitializedError";
  }
}

export class ArtifactNotFoundError extends Error {
  constructor(id: string) {
    super(`Artifact not found: ${id}`);
    this.name = "ArtifactNotFoundError";
  }
}

export const listProjectArtifacts = async (
  rootPath: string,
): Promise<ArtifactRecord[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return listArtifactsFromDb(db);
  } finally {
    closeDatabase(db);
  }
};

export const getProjectArtifact = async (
  rootPath: string,
  id: string,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const artifact = findArtifactById(db, id);
    if (!artifact) {
      throw new ArtifactNotFoundError(id);
    }
    return artifact;
  } finally {
    closeDatabase(db);
  }
};
