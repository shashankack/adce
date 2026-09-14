import { access } from "node:fs/promises";
import type { ArtifactRecord, VerificationState } from "@adce/shared";
import {
  closeDatabase,
  openDatabase,
  setArtifactVerification,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import { AdceNotInitializedError, ArtifactNotFoundError } from "./query.js";

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const setVerificaction = async (
  rootPath: string,
  id: string,
  verification: VerificationState,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath))))
    throw new AdceNotInitializedError(rootPath);

  const db = openDatabase(dbPath(rootPath));
  try {
    const updated = setArtifactVerification(db, id, verification);
    if (!updated) {
      throw new ArtifactNotFoundError(id);
    }
    return updated;
  } finally {
    closeDatabase(db);
  }
};

export const verifyProjectArtifact = async (
  rootPath: string,
  id: string,
): Promise<ArtifactRecord> => {
  return setVerificaction(rootPath, id, "VERIFIED");
};

export const rejectProjectArtifact = async (
  rootPath: string,
  id: string,
): Promise<ArtifactRecord> => {
  return setVerificaction(rootPath, id, "REJECTED");
};
