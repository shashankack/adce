import type { AnalyzeReport } from "@adce/shared";
import {
  AdceNotInitializedError,
  AmbiguousConflictIdError,
  ConflictNotFoundError,
  analyzeProject,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunAnalyzeOptions {
  conflictId?: string;
  all?: boolean;
  deep?: boolean;
  format?: "text" | "json";
  noCache?: boolean;
  mlScript?: string;
  noMl?: boolean;
  noApply?: boolean;
}

const printText = (report: AnalyzeReport): void => {
  console.log(`Analyze for ${report.rootPath}`);
  console.log(`Mode: ${report.mode}  Engine: ${report.engine}  Cached: ${report.cached}`);
  console.log(`Generated: ${report.generatedAt}`);
  console.log("");

  for (const note of report.notes) {
    console.log(`! ${note}`);
  }
  console.log("");

  console.log(`Suggestions (${report.suggestions.length}):`);
  if (report.suggestions.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const s of report.suggestions) {
    const target = s.conflictId
      ? `conflict ${s.conflictId.slice(0, 8)}`
      : s.artifactId
        ? `artifact ${s.artifactId.slice(0, 8)}`
        : "(general)";
    const score =
      s.score != null ? ` score=${s.score.toFixed(2)}` : "";
    console.log(
      `  [${s.source}] ${s.kind.padEnd(20)} ${target}${score}`,
    );
    console.log(`       ${s.reason}`);
    if (s.confidence) console.log(`       → confidence ${s.confidence}`);
    if (s.authority) console.log(`       → authority ${s.authority} (not auto-applied)`);
    if (s.summary) console.log(`       → ${s.summary}`);
  }
};

export const runAnalyze = async (
  options: RunAnalyzeOptions = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const report = await analyzeProject(rootPath, {
      conflictId: options.conflictId,
      all: options.all,
      deep: options.deep,
      useCache: !options.noCache,
      mlScript: options.noMl ? null : options.mlScript,
      apply: !options.noApply,
    });

    if (options.format === "json") {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printText(report);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof ConflictNotFoundError ||
      error instanceof AmbiguousConflictIdError
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
