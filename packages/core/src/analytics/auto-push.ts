import { loadConfig } from "../config/loader.js";
import { buildAnalyticsBundle } from "./bundle.js";
import { pushProjectAnalytics } from "./push.js";

const lastAutoAt = new Map<string, number>();
const DEBOUNCE_MS = 15_000;

/**
 * Fire-and-forget analytics sync when `analytics.enabled` is true and
 * ADCE_ML_URL (or ADCE_ANALYTICS_URL) is set. No-op otherwise.
 * Never throws — safe to call from hot paths (context / analyze / feedback).
 */
export const maybeAutoPushAnalytics = (rootPath: string): void => {
  void (async () => {
    try {
      const config = await loadConfig(rootPath);
      if (!config.analytics?.enabled) return;

      const url =
        process.env.ADCE_ML_URL ?? process.env.ADCE_ANALYTICS_URL ?? "";
      if (!url) return;

      const now = Date.now();
      const prev = lastAutoAt.get(rootPath) ?? 0;
      if (now - prev < DEBOUNCE_MS) return;

      const { bundle } = await buildAnalyticsBundle(rootPath);
      // Avoid spamming the server with conflict-event-only repeats.
      if (bundle.metrics.length === 0 && bundle.feedback.length === 0) {
        return;
      }

      lastAutoAt.set(rootPath, now);
      await pushProjectAnalytics(rootPath);
    } catch {
      /* intentional: auto-push must never break CLI commands */
    }
  })();
};
