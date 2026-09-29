// packages/core/src/analyze/run-analyze.ts
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AnalyzeReport,
  AnalyzeRequest,
  AnalyzeSuggestion,
} from "@adce/shared";
import { runHeuristicAnalyze } from "./heuristic.js";
import { runMlHttpAnalyze } from "./ml-http.js";
import { runMlAnalyze } from "./ml-client.js";
import { filterAnalyzeRequestForMl } from "./privacy.js";

export interface RunAnalyzeOptions {
  useCache?: boolean;
  mlScript?: string;
  mlUrl?: string;
  skipMl?: boolean;
  fetchImpl?: typeof fetch;
}

const cacheKey = (req: AnalyzeRequest): string => {
  const h = createHash("sha256");
  h.update(
    JSON.stringify({
      mode: req.mode,
      conflictIds: req.conflictIds,
      artifacts: req.artifacts.map((a) => [
        a.id,
        a.contentHash,
        a.authority,
        a.verification,
      ]),
      // lifecycle omitted — ANALYZED mark must not bust the cache
      conflicts: req.conflicts.map((c) => [
        c.id,
        c.category,
        c.confidence,
        c.severity,
        c.summary,
      ]),
    }),
  );
  return h.digest("hex").slice(0, 16);
};

export const runProjectAnalyze = async (
  req: AnalyzeRequest,
  options: RunAnalyzeOptions = {},
): Promise<AnalyzeReport> => {
  const cacheDir = path.join(req.rootPath, ".adce", "cache");
  const key = cacheKey(req);
  const cachePath = path.join(cacheDir, `analyze-${key}.json`);

  if (options.useCache !== false) {
    try {
      const raw = await readFile(cachePath, "utf8");
      return { ...(JSON.parse(raw) as AnalyzeReport), cached: true };
    } catch {
      /* miss */
    }
  }

  const heuristic = runHeuristicAnalyze(req);
  let ml: AnalyzeSuggestion[] | null = null;
  let via: "http" | "script" | null = null;
  if (!options.skipMl) {
    const mlUrl = options.mlUrl ?? process.env.ADCE_ML_URL;
    if (mlUrl) {
      ml = await runMlHttpAnalyze(req, {
        baseUrl: mlUrl,
        fetchImpl: options.fetchImpl,
      });
      if (ml) via = "http";
    }
    if (!ml && options.mlScript) {
      ml = await runMlAnalyze(filterAnalyzeRequestForMl(req), {
        scriptPath: options.mlScript,
      });
      if (ml) via = "script";
    }
  }
  const suggestions = ml ? [...heuristic, ...ml] : heuristic;
  const report: AnalyzeReport = {
    rootPath: req.rootPath,
    generatedAt: new Date().toISOString(),
    mode: req.mode,
    engine: ml ? "hybrid" : "heuristic",
    suggestions,
    notes: ml
      ? [
          via === "http"
            ? "Hybrid: heuristic + ML HTTP. Review before applying."
            : "Hybrid: heuristic + local ML script. Review before applying.",
        ]
      : ["ML unavailable or skipped; heuristic-only analysis."],
    cached: false,
  };

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, JSON.stringify(report, null, 2), "utf8");
  return report;
};
