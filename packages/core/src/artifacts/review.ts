import { access } from "node:fs/promises";
import type { ArtifactRecord } from "@adce/shared";
import {
  closeDatabase,
  listUnreviewedDetectedArtifacts,
  openDatabase,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import { AdceNotInitializedError } from "./query.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

/** DETECTED + UNREVIEWED artifacts, sorted by path then name. */
export const listArtifactsForReview = async (
  rootPath: string,
): Promise<ArtifactRecord[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return listUnreviewedDetectedArtifacts(db);
  } finally {
    closeDatabase(db);
  }
};
