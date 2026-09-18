import {
  AdceNotInitializedError,
  AmbiguousArtifactIdError,
  ArtifactNotFoundError,
  getArtifactHistory,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export const runHistory = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const report = await getArtifactHistory(rootPath, id);

    console.log(`Artifact: ${report.artifactId}`);
    console.log(`Name: ${report.artifactName}`);
    console.log(`Path: ${report.artifactPath ?? "(none)"}`);
    console.log("");

    if (report.events.length === 0) {
      console.log("No temporal events found.");
      return;
    }

    console.log(`History (${report.events.length}):`);
    console.log("");
    for (const event of report.events) {
      console.log(
        `${event.at}  [${event.provider}]  ${event.kind}  (${event.confidence})`,
      );
      console.log(`  ${event.summary}`);
      if (event.evidence) {
        console.log(`  evidence: ${event.evidence}`);
      }
      console.log("");
    }
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ArtifactNotFoundError ||
      error instanceof AmbiguousArtifactIdError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
