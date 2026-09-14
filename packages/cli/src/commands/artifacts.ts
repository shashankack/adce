import { AdceNotInitializedError, listProjectArtifacts } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";

export const runArtifacts = async (cwd = process.cwd()): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const artifacts = await listProjectArtifacts(rootPath);

    if (artifacts.length === 0) {
      console.log("No artifacts stored. Run `adce scan` first.");
      return;
    }
    console.log(`Artifacts (${artifacts.length}):`);
    console.log("");
    for (const artifact of artifacts) {
      const location = artifact.path ?? "(no file)";
      console.log(
        `${artifact.id} ${artifact.type.padEnd(22)} ${artifact.origin.padEnd(9)} ${artifact.verification.padEnd(10)} ${location}`,
      );
    }
    console.log("");
    console.log("Use `adce artifact <full-id>` for details.");
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      console.log(error.message);
      return;
    }
    throw error;
  }
};
