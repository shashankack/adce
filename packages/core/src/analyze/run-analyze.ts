// packages/core/src/analyze/run-analyze.ts
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AnalyzeReport, AnalyzeRequest } from "@adce/shared";
import { runHeuristicAnalyze } from "./heuristic.js";
import { runMlAnalyze } from "./ml-client.js";

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
  options: { deep?: boolean; useCache?: boolean; mlScript?: string } = {},
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
  let ml = null as Awaited<ReturnType<typeof runMlAnalyze>>;
  if (options.mlScript) {
    ml = await runMlAnalyze(req, { scriptPath: options.mlScript });
  }

  const suggestions = ml ? [...heuristic, ...ml] : heuristic;
  const report: AnalyzeReport = {
    rootPath: req.rootPath,
    generatedAt: new Date().toISOString(),
    mode: req.mode,
    engine: ml ? "hybrid" : "heuristic",
    suggestions,
    notes: ml
      ? ["Hybrid: heuristic + ML suggestions. Review before applying."]
      : ["ML unavailable or skipped; heuristic-only analysis."],
    cached: false,
  };

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, JSON.stringify(report, null, 2), "utf8");
  return report;
};
