import { access } from "node:fs/promises";
import {
  ArtifactTypes,
  type ArtifactRecord,
  type ArtifactType,
} from "@adce/shared";
import {
  closeDatabase,
  openDatabase,
  updateArtifactMetadata,
} from "@adce/storage";
import { adceDir, dbPath } from "../project/paths.js";
import { InvalidArtifactTypeError } from "./manual-artifact.js";
import {
  AdceNotInitializedError,
  resolveArtifactId,
} from "./query.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export class ArtifactEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactEditError";
  }
}

export interface EditProjectArtifactInput {
  name?: string;
  type?: string;
}

export const editProjectArtifact = async (
  rootPath: string,
  idOrPrefix: string,
  input: EditProjectArtifactInput,
): Promise<ArtifactRecord> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const name =
    input.name !== undefined ? input.name.trim() : undefined;
  const typeRaw =
    input.type !== undefined ? input.type.trim().toUpperCase() : undefined;

  if (name === undefined && typeRaw === undefined) {
    throw new ArtifactEditError("Provide --name and/or --type to edit.");
  }
  if (name !== undefined && name.length === 0) {
    throw new ArtifactEditError("Name cannot be empty.");
  }
  if (
    typeRaw !== undefined &&
    !(ArtifactTypes as readonly string[]).includes(typeRaw)
  ) {
    throw new InvalidArtifactTypeError(input.type!);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const resolved = resolveArtifactId(db, idOrPrefix);
    const updated = updateArtifactMetadata(db, resolved.id, {
      name,
      type: typeRaw as ArtifactType | undefined,
    });
    if (!updated) {
      throw new Error(`Failed to update artifact: ${resolved.id}`);
    }
    return updated;
  } finally {
    closeDatabase(db);
  }
};
