import { access } from "node:fs/promises";
import type { ConflictLifecycle, ConflictRecord } from "@adce/shared";
import {
  closeDatabase,
  findConflictById,
  findConflictsByIdPrefix,
  listConflicts,
  listRelationships,
  openDatabase,
  setConflictLifecycle,
} from "@adce/storage";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { adceDir, dbPath } from "../project/paths.js";
import { detectTemporalMismatches } from "./detect-temporal.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export class ConflictNotFoundError extends Error {
  constructor(id: string) {
    super(`Conflict not found: ${id}`);
    this.name = "ConflictNotFoundError";
  }
}

export class AmbiguousConflictIdError extends Error {
  readonly matches: string[];

  constructor(prefix: string, matches: string[]) {
    const preview = matches.slice(0, 5).join(", ");
    const more = matches.length > 5 ? `, … (+${matches.length - 5} more)` : "";
    super(
      `Ambiguous conflict id prefix "${prefix}" matches ${matches.length} conflicts: ${preview}${more}`,
    );
    this.name = "AmbiguousConflictIdError";
    this.matches = matches;
  }
}

export const resolveConflictId = (
  db: Parameters<typeof findConflictById>[0],
  idOrPrefix: string,
): ConflictRecord => {
  const trimmed = idOrPrefix.trim();
  if (!trimmed) throw new ConflictNotFoundError(idOrPrefix);

  const exact = findConflictById(db, trimmed);
  if (exact) return exact;

  const matches = findConflictsByIdPrefix(db, trimmed);
  if (matches.length === 0) throw new ConflictNotFoundError(trimmed);
  if (matches.length > 1) {
    throw new AmbiguousConflictIdError(
      trimmed,
      matches.map((m) => m.id),
    );
  }
  return matches[0]!;
};

export const listProjectConflicts = async (
  rootPath: string,
  options: { includeClosed?: boolean } = {},
): Promise<ConflictRecord[]> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }
  const db = openDatabase(dbPath(rootPath));
  try {
    return listConflicts(db, options);
  } finally {
    closeDatabase(db);
  }
};

export const getProjectConflict = async (
  rootPath: string,
  idOrPrefix: string,
): Promise<ConflictRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }
  const db = openDatabase(dbPath(rootPath));
  try {
    return resolveConflictId(db, idOrPrefix);
  } finally {
    closeDatabase(db);
  }
};

export const setProjectConflictLifecycle = async (
  rootPath: string,
  idOrPrefix: string,
  lifecycle: ConflictLifecycle,
): Promise<ConflictRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }
  const db = openDatabase(dbPath(rootPath));
  try {
    const resolved = resolveConflictId(db, idOrPrefix);
    const updated = setConflictLifecycle(db, resolved.id, lifecycle);
    if (!updated) throw new ConflictNotFoundError(resolved.id);
    return updated;
  } finally {
    closeDatabase(db);
  }
};

export const rejectProjectConflict = (
  rootPath: string,
  idOrPrefix: string,
): Promise<ConflictRecord> =>
  setProjectConflictLifecycle(rootPath, idOrPrefix, "REJECTED");

export const ignoreProjectConflict = (
  rootPath: string,
  idOrPrefix: string,
): Promise<ConflictRecord> =>
  setProjectConflictLifecycle(rootPath, idOrPrefix, "IGNORED");

/** Run deterministic detectors against current graph. */
export const detectProjectConflicts = (db: Parameters<
  typeof listRelationships
>[0]): number => {
  const relationships = listRelationships(db);
  return detectTemporalMismatches(db, relationships);
};
