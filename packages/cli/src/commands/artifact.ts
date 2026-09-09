import {
  AdceNotInitializedError,
  ArtifactNotFoundError,
  getProjectArtifact,
} from "@adce/core";

export const runArtifact = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const a = await getProjectArtifact(cwd, id);

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
