import type { ContextBundle } from "@adce/shared";
import { AdceNotInitializedError, buildProjectContext } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunContextOptions {
  task?: string;
  budget?: number;
  format?: "text" | "json" | "markdown";
  /** When true, skip ADCE_ML_URL /v1/pack enrichment. */
  skipPack?: boolean;
}

const loc = (path: string | null, name: string) => path ?? name;

const formatMarkdown = (bundle: ContextBundle): string => {
  const lines: string[] = [];
  lines.push(`# ADCE Context`);
  lines.push("");
  lines.push(`- **Root:** \`${bundle.rootPath}\``);
  if (bundle.task) lines.push(`- **Task:** ${bundle.task}`);
  lines.push(`- **Generated:** ${bundle.generatedAt}`);
  lines.push("");

  for (const note of bundle.notes) {
    lines.push(`> ${note}`);
  }
  lines.push("");

  lines.push(`## MUST READ`);
  lines.push("");
  if (bundle.brief.mustRead.length === 0) {
    lines.push("- (none)");
  } else {
    for (const a of bundle.brief.mustRead) {
      lines.push(
        `- \`${loc(a.path, a.name)}\` (${a.type}, score ${a.score}) — ${a.reason}`,
      );
    }
  }
  lines.push("");

  lines.push(`## CAUTION`);
  lines.push("");
  if (bundle.brief.caution.length === 0) {
    lines.push("- (none)");
  } else {
    for (const c of bundle.brief.caution) {
      lines.push(
        `- **${c.severity}** ${c.category}: ${c.summary} (\`${c.conflictId.slice(0, 8)}\`)`,
      );
    }
  }
  lines.push("");

  lines.push(`## TRUST ORDER`);
  lines.push("");
  if (bundle.brief.trustOrder.length === 0) {
    lines.push("- (none — set authority with `adce authority set`)");
  } else {
    for (const a of bundle.brief.trustOrder) {
      lines.push(`- \`${loc(a.path, a.name)}\` — ${a.reason}`);
    }
  }
  lines.push("");

  lines.push(`## ALSO RELEVANT`);
  lines.push("");
  if (bundle.brief.alsoRelevant.length === 0) {
    lines.push("- (none)");
  } else {
    for (const a of bundle.brief.alsoRelevant.slice(0, 8)) {
      lines.push(`- \`${loc(a.path, a.name)}\` (${a.type}) — ${a.reason}`);
    }
  }
  lines.push("");

  return lines.join("\n");
};

const formatText = (bundle: ContextBundle): void => {
  console.log(`Context for ${bundle.rootPath}`);
  if (bundle.task) console.log(`Task: ${bundle.task}`);
  console.log(`Generated: ${bundle.generatedAt}`);
  console.log("");

  for (const note of bundle.notes) {
    console.log(`! ${note}`);
  }
  console.log("");

  console.log("MUST READ:");
  if (bundle.brief.mustRead.length === 0) {
    console.log("  (none)");
  } else {
    for (const a of bundle.brief.mustRead) {
      console.log(
        `  [${a.score}] ${loc(a.path, a.name)} (${a.type}) — ${a.reason}`,
      );
    }
  }
  console.log("");

  console.log("CAUTION:");
  if (bundle.brief.caution.length === 0) {
    console.log("  (none)");
  } else {
    for (const c of bundle.brief.caution) {
      console.log(
        `  ${c.severity} ${c.category}: ${c.summary} (${c.conflictId.slice(0, 8)})`,
      );
    }
  }
  console.log("");

  console.log("TRUST ORDER:");
  if (bundle.brief.trustOrder.length === 0) {
    console.log("  (none — set authority with adce authority set)");
  } else {
    for (const a of bundle.brief.trustOrder) {
      console.log(`  ${loc(a.path, a.name)} — ${a.reason}`);
    }
  }
  console.log("");

  console.log("ALSO RELEVANT:");
  if (bundle.brief.alsoRelevant.length === 0) {
    console.log("  (none)");
  } else {
    for (const a of bundle.brief.alsoRelevant.slice(0, 8)) {
      console.log(`  ${loc(a.path, a.name)} (${a.type}) — ${a.reason}`);
    }
  }
};

export const runContext = async (
  options: RunContextOptions = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const bundle = await buildProjectContext(rootPath, {
      task: options.task,
      budget: options.budget,
      pack: options.skipPack ? false : undefined,
    });

    if (options.format === "json") {
      console.log(JSON.stringify(bundle, null, 2));
      return;
    }

    if (options.format === "markdown") {
      console.log(formatMarkdown(bundle));
      return;
    }

    formatText(bundle);
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
