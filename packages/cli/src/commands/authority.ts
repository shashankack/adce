import {
  AdceNotInitializedError,
  AmbiguousArtifactIdError,
  ArtifactNotFoundError,
  InvalidAuthorityLevelError,
  clearProjectArtifactAuthority,
  setProjectArtifactAuthority,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

const handleError = (error: unknown): boolean => {
  if (
    error instanceof AdceNotInitializedError ||
    error instanceof ArtifactNotFoundError ||
    error instanceof AmbiguousArtifactIdError ||
    error instanceof InvalidAuthorityLevelError
  ) {
    log.error(error.message);
    return true;
  }
  return false;
};

export const runAuthoritySet = async (
  id: string,
  level: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await setProjectArtifactAuthority(rootPath, id, level);
    log.ok(
      `Set authority ${a.authority} on ${a.path ?? a.name} (${a.id.slice(0, 8)})`,
    );
  } catch (error) {
    if (handleError(error)) return;
    throw error;
  }
};

export const runAuthorityClear = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const a = await clearProjectArtifactAuthority(rootPath, id);
    log.ok(
      `Cleared authority on ${a.path ?? a.name} (${a.id.slice(0, 8)}) → UNKNOWN`,
    );
  } catch (error) {
    if (handleError(error)) return;
    throw error;
  }
};
