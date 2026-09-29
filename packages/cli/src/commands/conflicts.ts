import {
  AdceNotInitializedError,
  AmbiguousConflictIdError,
  ConflictNotFoundError,
  confirmProjectConflict,
  getProjectConflict,
  ignoreProjectConflict,
  listProjectConflicts,
  postConflictFeedback,
  rejectProjectConflict,
  resolveProjectConflict,
  type FeedbackAction,
} from "@adce/core";
import type { ConflictRecord } from "@adce/shared";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

const handleConflictError = (error: unknown): boolean => {
  if (
    error instanceof AdceNotInitializedError ||
    error instanceof ConflictNotFoundError ||
    error instanceof AmbiguousConflictIdError
  ) {
    log.error(error.message);
    return true;
  }
  return false;
};

/** Best-effort ML feedback; never fails the CLI command. */
const sendFeedback = (action: FeedbackAction, c: ConflictRecord): void => {
  void postConflictFeedback({
    action,
    conflictId: c.id,
    category: c.category,
    severity: c.severity,
    confidence: c.confidence,
    summary: c.summary,
    sourceArtifactId: c.sourceArtifactId,
    targetArtifactId: c.targetArtifactId,
  }).then((ok) => {
    if (ok) log.step(`ML feedback logged (${action}).`);
  });
};

export const runConflicts = async (
  options: { all?: boolean; format?: "text" | "json" } = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const conflicts = await listProjectConflicts(rootPath, {
      includeClosed: options.all,
    });

    if (options.format === "json") {
      console.log(
        JSON.stringify(
          {
            rootPath,
            includeClosed: Boolean(options.all),
            count: conflicts.length,
            conflicts,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (conflicts.length === 0) {
      console.log(
        options.all
          ? "No conflicts stored."
          : "No open conflicts. Use `adce conflicts --all` to include closed ones.",
      );
      return;
    }

    console.log(`Conflicts (${conflicts.length}):`);
    console.log("");
    for (const c of conflicts) {
      console.log(
        `${c.id} ${c.category.padEnd(24)} ${c.severity.padEnd(6)} ${c.lifecycle.padEnd(10)} ${c.confidence.padEnd(10)} ${c.summary}`,
      );
    }
    console.log("");
    console.log("Use `adce conflict show <id-or-prefix>` for details.");
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};

export const runConflictShow = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const c = await getProjectConflict(rootPath, id);
    console.log(`ID: ${c.id}`);
    console.log(`Category: ${c.category}`);
    console.log(`Lifecycle: ${c.lifecycle}`);
    console.log(`Confidence: ${c.confidence}`);
    console.log(`Severity: ${c.severity}`);
    console.log(`Source artifact: ${c.sourceArtifactId ?? "(none)"}`);
    console.log(`Target artifact: ${c.targetArtifactId ?? "(none)"}`);
    console.log(`Relationship: ${c.relationshipId ?? "(none)"}`);
    console.log(`Summary: ${c.summary}`);
    console.log(`Evidence: ${c.evidence ?? "(none)"}`);
    console.log(`Created at: ${c.createdAt}`);
    console.log(`Updated at: ${c.updatedAt}`);
  } catch (error) {
    if (handleConflictError(error)) return;
    throw error;
  }
};

export const runConflictReject = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const c = await rejectProjectConflict(rootPath, id);
    log.ok(`Conflict rejected: ${c.id}`);
    console.log(`Lifecycle: ${c.lifecycle}`);
    sendFeedback("reject", c);
  } catch (error) {
    if (handleConflictError(error)) return;
    throw error;
  }
};

export const runConflictIgnore = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const c = await ignoreProjectConflict(rootPath, id);
    log.ok(`Conflict ignored: ${c.id}`);
    console.log(`Lifecycle: ${c.lifecycle}`);
    sendFeedback("ignore", c);
  } catch (error) {
    if (handleConflictError(error)) return;
    throw error;
  }
};

export const runConflictConfirm = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const c = await confirmProjectConflict(rootPath, id);
    log.ok(`Conflict confirmed: ${c.id}`);
    console.log(`Lifecycle: ${c.lifecycle}`);
    sendFeedback("confirm", c);
  } catch (error) {
    if (handleConflictError(error)) return;
    throw error;
  }
};

export const runConflictResolve = async (
  id: string,
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const c = await resolveProjectConflict(rootPath, id);
    log.ok(`Conflict resolved: ${c.id}`);
    console.log(`Lifecycle: ${c.lifecycle}`);
    sendFeedback("resolve", c);
  } catch (error) {
    if (handleConflictError(error)) return;
    throw error;
  }
};
