import {
  AdceNotInitializedError,
  ArtifactNotFoundError,
  getProjectArtifact,
  verifyProjectArtifact,
  rejectProjectArtifact,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";

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
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ArtifactNotFoundError
    ) {
      console.log(error.message);
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
    const a = await verifyProjectArtifact(cwd, id);
    console.log(`Verified: ${a.id}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ArtifactNotFoundError
    ) {
      console.log(error.message);
      return;
    }
    throw error;
  }
};

export const runArtifactReject = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const a = await rejectProjectArtifact(cwd, id);
    console.log(`Rejected: ${a.id}`);
    console.log(`Path: ${a.path ?? "(none)"}`);
    console.log(`Verification: ${a.verification}`);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ArtifactNotFoundError
    ) {
      console.log(error.message);
      return;
    }
    throw error;
  }
};
