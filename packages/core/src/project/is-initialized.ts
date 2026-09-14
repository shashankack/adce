import { access } from "node:fs/promises";
import { closeDatabase, getMeta, openDatabase } from "@adce/storage";
import { adceDir, dbPath } from "./paths.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

/** True when `.adce/` exists, `state.db` exists, and `createdAt` meta is set. */
export const isAdceInitialized = async (
  rootPath: string,
): Promise<boolean> => {
  if (!(await exists(adceDir(rootPath)))) return false;
  if (!(await exists(dbPath(rootPath)))) return false;

  const db = openDatabase(dbPath(rootPath));
  try {
    const createdAt = getMeta(db, "createdAt");
    return Boolean(createdAt && createdAt.length > 0);
  } finally {
    closeDatabase(db);
  }
};

export class AdceIncompleteError extends Error {
  readonly rootPath: string;

  constructor(rootPath: string) {
    super(
      `ADCE folder found at ${rootPath} but it is incomplete (missing database meta). ` +
        `Run \`adce init --repair\` or remove \`.adce\` and run \`adce init\`.`,
    );
    this.name = "AdceIncompleteError";
    this.rootPath = rootPath;
  }
}
