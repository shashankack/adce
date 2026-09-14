import {
  AdceNotInitializedError,
  listArtifactsForReview,
  rejectProjectArtifact,
  verifyProjectArtifact,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";
import {
  createReviewReadline,
  promptArtifactReview,
} from "../ui/review-prompt.js";

export const runArtifactsReview = async (
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const queue = await listArtifactsForReview(rootPath);

    if (queue.length === 0) {
      log.ok("Nothing to review. All DETECTED artifacts are reviewed.");
      return;
    }

    log.step(`Reviewing ${queue.length} unreviewed artifact(s)`);

    let verified = 0;
    let rejected = 0;
    let skipped = 0;

    const rl = createReviewReadline();
    try {
      for (let i = 0; i < queue.length; i++) {
        const artifact = queue[i]!;
        const choice = await promptArtifactReview(
          artifact,
          i + 1,
          queue.length,
          rl,
        );

        if (choice === "quit") {
          log.warn("Review stopped early.");
          break;
        }

        if (choice === "verify") {
          await verifyProjectArtifact(rootPath, artifact.id);
          verified += 1;
          log.ok(`Verified ${artifact.path ?? artifact.name}`);
          continue;
        }

        if (choice === "reject") {
          await rejectProjectArtifact(rootPath, artifact.id);
          rejected += 1;
          log.ok(`Rejected ${artifact.path ?? artifact.name}`);
          continue;
        }

        skipped += 1;
        log.step(`Skipped ${artifact.path ?? artifact.name}`);
      }
    } finally {
      rl.close();
    }

    console.log("");
    log.ok(
      `Review summary: ${verified} verified, ${rejected} rejected, ${skipped} skipped`,
    );
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
