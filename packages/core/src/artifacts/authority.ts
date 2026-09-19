import { access } from "node:fs/promises";
import {
  AuthorityLevels,
  type ArtifactRecord,
  type AuthorityLevel,
} from "@adce/shared";
import {
  closeDatabase,
  openDatabase,
  setArtifactAuthority,
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

export class InvalidAuthorityLevelError extends Error {
  constructor(value: string) {
    super(
      `Invalid authority level "${value}". Allowed: ${AuthorityLevels.join(", ")}`,
    );
    this.name = "InvalidAuthorityLevelError";
  }
}

const parseAuthority = (value: string): AuthorityLevel => {
  const upper = value.trim().toUpperCase();
  if ((AuthorityLevels as readonly string[]).includes(upper)) {
    return upper as AuthorityLevel;
  }
  throw new InvalidAuthorityLevelError(value);
};

export const setProjectArtifactAuthority = async (
  rootPath: string,
  idOrPrefix: string,
  level: string,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const authority = parseAuthority(level);
  const db = openDatabase(dbPath(rootPath));
  try {
    const resolved = resolveArtifactId(db, idOrPrefix);
    const updated = setArtifactAuthority(db, resolved.id, authority);
    if (!updated) {
      throw new Error(`Failed to update artifact: ${resolved.id}`);
    }
    return updated;
  } finally {
    closeDatabase(db);
  }
};

export const clearProjectArtifactAuthority = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ArtifactRecord> => {
  return setProjectArtifactAuthority(rootPath, idOrPrefix, "UNKNOWN");
};
