import { loadConfig } from "../config/loader.js";
import {
  buildAnalyticsBundle,
  saveAnalyticsCursor,
  type AnalyticsBundle,
} from "./bundle.js";
import { findForbiddenKey } from "./sanitize.js";

export class AnalyticsDisabledError extends Error {
  constructor() {
    super(
      "Analytics sync is disabled. Set analytics.enabled: true in .adce/config.yaml, or pass --force.",
    );
    this.name = "AnalyticsDisabledError";
  }
}

export class AnalyticsUrlMissingError extends Error {
  constructor() {
    super(
      "No analytics URL. Set ADCE_ML_URL or pass --url (same host as the ML server).",
    );
    this.name = "AnalyticsUrlMissingError";
  }
}

export interface PushAnalyticsOptions {
  baseUrl?: string | null;
  dryRun?: boolean;
  /** Bypass config analytics.enabled (still requires URL). */
  force?: boolean;
  fetchImpl?: typeof fetch;
}

export interface PushAnalyticsResult {
  ok: boolean;
  dryRun: boolean;
  projectId: string;
  metrics: number;
  feedback: number;
  events: number;
  skipped: number;
  status?: number;
  detail?: string;
}

export const pushProjectAnalytics = async (
  rootPath: string,
  options: PushAnalyticsOptions = {},
): Promise<PushAnalyticsResult> => {
  const config = await loadConfig(rootPath);
  // Dry-run always allowed so users can inspect the bundle before opting in.
  if (!options.dryRun && !config.analytics?.enabled && !options.force) {
    throw new AnalyticsDisabledError();
  }

  const baseUrl =
    options.baseUrl ?? process.env.ADCE_ML_URL ?? process.env.ADCE_ANALYTICS_URL;
  if (!baseUrl && !options.dryRun) {
    throw new AnalyticsUrlMissingError();
  }

  const { bundle, nextCursor, skipped } = await buildAnalyticsBundle(rootPath);
  const forbidden = findForbiddenKey(bundle);
  if (forbidden) {
    throw new Error(`Refusing to send: forbidden key ${forbidden}`);
  }

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      projectId: bundle.projectId,
      metrics: bundle.metrics.length,
      feedback: bundle.feedback.length,
      events: bundle.events.length,
      skipped: skipped.length,
      detail: "dry-run (nothing sent)",
    };
  }

  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  if (!fetchFn) {
    throw new Error("fetch is not available in this runtime");
  }

  const url = `${baseUrl!.replace(/\/+$/, "")}/v1/analytics`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(bundle satisfies AnalyticsBundle),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      dryRun: false,
      projectId: bundle.projectId,
      metrics: bundle.metrics.length,
      feedback: bundle.feedback.length,
      events: bundle.events.length,
      skipped: skipped.length,
      status: res.status,
      detail,
    };
  }

  await saveAnalyticsCursor(rootPath, nextCursor);
  return {
    ok: true,
    dryRun: false,
    projectId: bundle.projectId,
    metrics: bundle.metrics.length,
    feedback: bundle.feedback.length,
    events: bundle.events.length,
    skipped: skipped.length,
    status: res.status,
  };
};
