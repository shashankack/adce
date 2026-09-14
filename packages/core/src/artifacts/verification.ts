import { access } from "node:fs/promises";
import type { ArtifactRecord, VerificationState } from "@adce/shared";
import {
  closeDatabase,
  openDatabase,
  setArtifactVerification,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import {
  AdceNotInitializedError,
  resolveArtifactId,
} from "./query.js";

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const setVerification = async (
  rootPath: string,
  idOrPrefix: string,
  verification: VerificationState,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath))))
    throw new AdceNotInitializedError(rootPath);

  const db = openDatabase(dbPath(rootPath));
  try {
    const resolved = resolveArtifactId(db, idOrPrefix);
    const updated = setArtifactVerification(db, resolved.id, verification);
    if (!updated) {
      throw new Error(`Failed to update artifact: ${resolved.id}`);
    }
    return updated;
  } finally {
    closeDatabase(db);
  }
};

export const verifyProjectArtifact = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ArtifactRecord> => {
  return setVerification(rootPath, idOrPrefix, "VERIFIED");
};

export const rejectProjectArtifact = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ArtifactRecord> => {
  return setVerification(rootPath, idOrPrefix, "REJECTED");
};

export const ignoreProjectArtifact = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ArtifactRecord> => {
  return setVerification(rootPath, idOrPrefix, "IGNORED");
};
