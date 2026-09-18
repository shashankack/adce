import {
  AdceNotInitializedError,
  AmbiguousRelationshipIdError,
  RelationshipNotFoundError,
  unlinkProjectRelationship,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export const runUnlink = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    await unlinkProjectRelationship(rootPath, id);
    log.ok("Relationship rejected (will not be re-inferred on scan).");
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof RelationshipNotFoundError ||
      error instanceof AmbiguousRelationshipIdError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
