import { access } from "node:fs/promises";
import type { ArtifactRecord, ArtifactType } from "@adce/shared";
import {
  closeDatabase,
  findArtifactById,
  findArtifactsByIdPrefix,
  listArtifacts as listArtifactsFromDb,
  openDatabase,
  type ListArtifactOptions,
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

export class AmbiguousArtifactIdError extends Error {
  readonly matches: string[];

  constructor(prefix: string, matches: string[]) {
    const preview = matches.slice(0, 5).join(", ");
    const more = matches.length > 5 ? `, … (+${matches.length - 5} more)` : "";
    super(
      `Ambiguous artifact id prefix "${prefix}" matches ${matches.length} artifacts: ${preview}${more}`,
    );
    this.name = "AmbiguousArtifactIdError";
    this.matches = matches;
  }
}

export type ListProjectArtifactsOptions = ListArtifactOptions;

export const listProjectArtifacts = async (
  rootPath: string,
  options: ListProjectArtifactsOptions = {},
): Promise<ArtifactRecord[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return listArtifactsFromDb(db, options);
  } finally {
    closeDatabase(db);
  }
};

/** Resolve full UUID or unique id prefix. */
export const resolveArtifactId = (
  db: Parameters<typeof findArtifactById>[0],
  idOrPrefix: string,
): ArtifactRecord => {
  const trimmed = idOrPrefix.trim();
  if (!trimmed) {
    throw new ArtifactNotFoundError(idOrPrefix);
  }

  const exact = findArtifactById(db, trimmed);
  if (exact) return exact;

  const matches = findArtifactsByIdPrefix(db, trimmed);
  if (matches.length === 0) {
    throw new ArtifactNotFoundError(trimmed);
  }
  if (matches.length > 1) {
    throw new AmbiguousArtifactIdError(
      trimmed,
      matches.map((m) => m.id),
    );
  }
  return matches[0]!;
};

export const getProjectArtifact = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    return resolveArtifactId(db, idOrPrefix);
  } finally {
    closeDatabase(db);
  }
};

export type { ArtifactType };
