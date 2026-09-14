import {
  AdceIncompleteError,
  AdceNotInitializedError,
  scanProject,
} from "@adce/core";
import { log } from "../ui/logger.js";
import { resolveAdceRoot } from "../project-root.js";

export async function runScan(
  cwd = process.cwd(),
  opts: { full?: boolean } = {},
): Promise<void> {
  try {
    const rootPath = await resolveAdceRoot(cwd);

    log.step(`Scanning ${rootPath}`);
    const result = await scanProject({ rootPath, full: opts.full });

    log.ok(`Scan complete (${result.mode})`);
    log.step(`Files seen: ${result.filesSeen}`);
    log.step(`Added: ${result.added}`);
    log.step(`Changed: ${result.changed}`);
    log.step(`Unchanged: ${result.unchanged}`);
    log.step(`Removed: ${result.removed}`);
    log.step(`Git detected: ${result.gitDetected ? "yes" : "no"}`);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof AdceIncompleteError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
}
