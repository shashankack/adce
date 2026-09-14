import {
  AdceNotInitializedError,
  InvalidArtifactTypeError,
  listProjectArtifacts,
} from "@adce/core";
import { ArtifactTypes, type ArtifactType } from "@adce/shared";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunArtifactsOptions {
  type?: string;
}

const parseTypes = (raw: string): ArtifactType[] => {
  const parts = raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new InvalidArtifactTypeError(raw);
  }
  for (const part of parts) {
    if (!(ArtifactTypes as readonly string[]).includes(part)) {
      throw new InvalidArtifactTypeError(part);
    }
  }
  return parts as ArtifactType[];
};

export const runArtifacts = async (
  options: RunArtifactsOptions = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const types = options.type ? parseTypes(options.type) : undefined;
    const artifacts = await listProjectArtifacts(rootPath, { types });

    if (artifacts.length === 0) {
      console.log(
        types
          ? "No artifacts matched the type filter."
          : "No artifacts stored. Run `adce scan` first.",
      );
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
    console.log("Use `adce artifact show <id-or-prefix>` for details.");
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof InvalidArtifactTypeError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
