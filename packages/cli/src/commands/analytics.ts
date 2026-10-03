import {
  AdceNotInitializedError,
  AnalyticsDisabledError,
  AnalyticsUrlMissingError,
  pushProjectAnalytics,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunAnalyticsPushOptions {
  dryRun?: boolean;
  force?: boolean;
  url?: string;
}

export const runAnalyticsPush = async (
  options: RunAnalyticsPushOptions = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    log.step(
      options.dryRun
        ? "Building privacy-locked analytics bundle (dry-run)…"
        : "Pushing privacy-locked analytics to ML server…",
    );

    const result = await pushProjectAnalytics(rootPath, {
      dryRun: options.dryRun,
      force: options.force,
      baseUrl: options.url,
    });

    if (!result.ok) {
      log.error(
        `Analytics push failed (${result.status ?? "?"}): ${result.detail ?? "unknown"}`,
      );
      process.exitCode = 1;
      return;
    }

    log.ok(
      `${result.dryRun ? "Dry-run" : "Pushed"} projectId=${result.projectId}`,
    );
    log.step(
      `metrics=${result.metrics}  feedback=${result.feedback}  events=${result.events}  skipped=${result.skipped}`,
    );
    if (result.detail) log.step(result.detail);
    log.step(
      "No file contents, excerpts, or absolute paths are ever sent. Does not train Cursor — only your dashboard / LinUCB store.",
    );
    log.step(
      "With analytics.enabled: true, context/analyze/feedback auto-push (no manual step required).",
    );
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof AnalyticsDisabledError ||
      error instanceof AnalyticsUrlMissingError
    ) {
      log.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
};
