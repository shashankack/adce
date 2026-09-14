// Imports
import {
  AdceNotInitializedError,
  AmbiguousArtifactIdError,
  ArtifactEditError,
  ArtifactNotFoundError,
  ArtifactPathConflictError,
  InvalidArtifactTypeError,
  addManualArtifact,
  editProjectArtifact,
  getProjectArtifact,
  ignoreProjectArtifact,
  rejectProjectArtifact,
  verifyProjectArtifact,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

// Interfaces
export interface RunArtifactAddOptions {
  name: string;
  type: string;
  path?: string | null;
  manual?: boolean;
  stub?: boolean;
}

export interface RunArtifactEditOptions {
  name?: string;
  type?: string;
}

const handleLookupError = (error: unknown): boolean => {
  if (
    error instanceof AdceNotInitializedError ||
    error instanceof ArtifactNotFoundError ||
    error instanceof AmbiguousArtifactIdError
  ) {
    log.error(error.message);
    return true;
  }
  return false;
};

export const runArtifact = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await getProjectArtifact(rootPath, id);

    console.log(`ID: ${a.id}`);
    console.log(`Name: ${a.name}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Type: ${a.type}`);
    console.log(`Origin: ${a.origin}`);
    console.log(`Verification: ${a.verification}`);
    console.log(`Health: ${a.health}`);
    console.log(`Authority: ${a.authority}`);
    console.log(`Hash: ${a.contentHash ?? "(none)"}`);
    console.log(`Size: ${a.sizeBytes ?? "(none)"}`);
    console.log(`Mtime ms: ${a.mtimeMs ?? "(none)"}`);
    console.log(`Created at: ${a.createdAt}`);
    console.log(`Updated at: ${a.updatedAt}`);
  } catch (error) {
    if (handleLookupError(error)) return;
    throw error;
  }
};

export const runArtifactAdd = async (
  options: RunArtifactAddOptions,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const artifact = await addManualArtifact(rootPath, {
      name: options.name,
      type: options.type,
      path: options.path,
      manual: options.manual,
      stub: options.stub,
    });
    log.ok(`Added manual artifact ${artifact.id}`);
    console.log(`Name: ${artifact.name}`);
    console.log(`Type: ${artifact.type}`);
    console.log(`Origin: ${artifact.origin}`);
    console.log(`Path: ${artifact.path ?? "(none)"}`);
    console.log(`Verification: ${artifact.verification}`);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof InvalidArtifactTypeError ||
      error instanceof ArtifactPathConflictError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};

export const runArtifactEdit = async (
  id: string,
  options: RunArtifactEditOptions,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await editProjectArtifact(rootPath, id, {
      name: options.name,
      type: options.type,
    });
    log.ok(`Updated artifact ${a.id}`);
    console.log(`Name: ${a.name}`);
    console.log(`Type: ${a.type}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (handleLookupError(error)) return;
    if (
      error instanceof ArtifactEditError ||
      error instanceof InvalidArtifactTypeError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};

export const runArtifactVerify = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await verifyProjectArtifact(rootPath, id);
    console.log(`Verified: ${a.id}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (handleLookupError(error)) return;
    throw error;
  }
};

export const runArtifactReject = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await rejectProjectArtifact(rootPath, id);
    console.log(`Rejected: ${a.id}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (handleLookupError(error)) return;
    throw error;
  }
};

export const runArtifactIgnore = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await ignoreProjectArtifact(rootPath, id);
    console.log(`Ignored: ${a.id}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (handleLookupError(error)) return;
    throw error;
  }
};
