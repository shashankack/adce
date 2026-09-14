import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ArtifactTypes,
  type ArtifactRecord,
  type ArtifactType,
} from "@adce/shared";
import {
  closeDatabase,
  findArtifactByPath,
  insertManualArtifact,
  openDatabase,
} from "@adce/storage";
import { adceDir, artifactsDir, dbPath } from "../project/paths.js";
import { AdceNotInitializedError } from "./query.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export class InvalidArtifactTypeError extends Error {
  constructor(value: string) {
    super(
      `Invalid artifact type: ${value}. Allowed: ${ArtifactTypes.join(", ")}`,
    );
    this.name = "InvalidArtifactTypeError";
  }
}

export class ArtifactPathConflictError extends Error {
  constructor(filePath: string) {
    super(`An artifact already exists for path: ${filePath}`);
    this.name = "ArtifactPathConflictError";
  }
}

export interface AddManualArtifactInput {
  name: string;
  type: string;
  /** Relative path inside the project, or null/undefined for virtual */
  path?: string | null;
  manual?: boolean;
  /** When creating a virtual artifact, also write a stub under `.adce/artifacts/` */
  stub?: boolean;
}

const slugify = (name: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug.slice(0, 48) : "artifact";
};

export const addManualArtifact = async (
  rootPath: string,
  input: AddManualArtifactInput,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const type = input.type.trim().toUpperCase();
  if (!(ArtifactTypes as readonly string[]).includes(type)) {
    throw new InvalidArtifactTypeError(input.type);
  }

  const isManual = input.manual === true || !input.path;
  let relativePath: string | null = null;
  const id = crypto.randomUUID();

  if (!isManual && input.path) {
    relativePath = input.path.replace(/\\/g, "/").replace(/^\.\//, "");
    const absolute = path.join(rootPath, relativePath);
    if (!(await exists(absolute))) {
      throw new Error(`File not found: ${relativePath}`);
    }
  } else if (isManual && input.stub) {
    relativePath = `.adce/artifacts/${slugify(input.name)}-${id.slice(0, 8)}.md`;
    const absolute = path.join(rootPath, relativePath);
    await mkdir(artifactsDir(rootPath), { recursive: true });
    const body = [
      `# ${input.name.trim()}`,
      "",
      `Type: ${type}`,
      "",
      "Manual ADCE artifact stub.",
      "",
    ].join("\n");
    await writeFile(absolute, body, "utf8");
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    if (relativePath) {
      const existing = findArtifactByPath(db, relativePath);
      if (existing) {
        throw new ArtifactPathConflictError(relativePath);
      }
    }

    return insertManualArtifact(db, {
      id,
      name: input.name.trim(),
      type: type as ArtifactType,
      path: relativePath,
    });
  } finally {
    closeDatabase(db);
  }
};
