import {
  AdceNotInitializedError,
  AmbiguousArtifactIdError,
  ArtifactNotFoundError,
  InvalidRelationshipTypeError,
  RelationshipExistsError,
  RelationshipSelfLinkError,
  linkProjectArtifacts,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunLinkOptions {
  source: string;
  target: string;
  type: string;
}

export const runLink = async (
  options: RunLinkOptions,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const relationship = await linkProjectArtifacts(rootPath, {
      sourceIdOrPrefix: options.source,
      targetIdOrPrefix: options.target,
      type: options.type,
    });
    log.ok(`Linked ${relationship.id}`);
    console.log(`Type: ${relationship.type}`);
    console.log(`Source artifact: ${relationship.sourceArtifactId}`);
    console.log(`Target artifact: ${relationship.targetArtifactId}`);
    console.log(`Origin: ${relationship.origin}`);
    console.log(`Verification: ${relationship.verification}`);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ArtifactNotFoundError ||
      error instanceof AmbiguousArtifactIdError ||
      error instanceof InvalidRelationshipTypeError ||
      error instanceof RelationshipExistsError ||
      error instanceof RelationshipSelfLinkError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
