import type { ContextBundle } from "@adce/shared";
import { AdceNotInitializedError, buildProjectContext } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunContextOptions {
  task?: string;
  budget?: number;
  format?: "text" | "json" | "markdown";
}

const formatMarkdown = (bundle: ContextBundle): string => {
  const lines: string[] = [];
  lines.push(`# ADCE Context`);
  lines.push("");
  lines.push(`- **Root:** \`${bundle.rootPath}\``);
  if (bundle.task) lines.push(`- **Task:** ${bundle.task}`);
  lines.push(`- **Generated:** ${bundle.generatedAt}`);
  lines.push("");

  if (bundle.notes.length > 0) {
    lines.push("## Notes");
    lines.push("");
    for (const note of bundle.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  lines.push(`## Artifacts (${bundle.artifacts.length})`);
  lines.push("");
  for (const a of bundle.artifacts) {
    const loc = a.path ?? "(no file)";
    lines.push(
      `- **[${a.score}]** \`${loc}\` — ${a.type}, ${a.verification}, ${a.health}, ${a.authority}`,
    );
    if (a.reasons.length > 0) {
      lines.push(`  - ${a.reasons.slice(0, 3).join("; ")}`);
    }
  }
  lines.push("");

  lines.push(`## Relationships (${bundle.relationships.length})`);
  lines.push("");
  if (bundle.relationships.length === 0) {
    lines.push("- (none)");
  } else {
    for (const r of bundle.relationships) {
      lines.push(
        `- \`${r.sourceArtifactId.slice(0, 8)}\` --${r.type}--> \`${r.targetArtifactId.slice(0, 8)}\` (${r.origin})`,
      );
    }
  }
  lines.push("");

  lines.push(`## Open conflicts (${bundle.conflicts.length})`);
  lines.push("");
  if (bundle.conflicts.length === 0) {
    lines.push("- (none)");
  } else {
    for (const c of bundle.conflicts) {
      lines.push(`- **${c.severity}** ${c.category}: ${c.summary}`);
    }
  }
  lines.push("");

  return lines.join("\n");
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
    });

    if (options.format === "json") {
      console.log(JSON.stringify(bundle, null, 2));
      return;
    }

    if (options.format === "markdown") {
      console.log(formatMarkdown(bundle));
      return;
    }

    console.log(`Context for ${bundle.rootPath}`);
    if (bundle.task) console.log(`Task: ${bundle.task}`);
    console.log(`Generated: ${bundle.generatedAt}`);
    console.log("");

    for (const note of bundle.notes) {
      console.log(`! ${note}`);
    }
    console.log("");

    console.log(`Artifacts (${bundle.artifacts.length}):`);
    for (const a of bundle.artifacts) {
      const loc = a.path ?? "(no file)";
      console.log(
        `  [${a.score}] ${a.type.padEnd(18)} ${a.verification.padEnd(10)} ${a.health.padEnd(12)} ${a.authority.padEnd(13)} ${loc}`,
      );
      console.log(`       ${a.reasons.slice(0, 3).join("; ")}`);
    }

    console.log("");
    console.log(`Relationships (${bundle.relationships.length}):`);
    for (const r of bundle.relationships) {
      console.log(
        `  ${r.sourceArtifactId.slice(0, 8)} --${r.type}--> ${r.targetArtifactId.slice(0, 8)} (${r.origin})`,
      );
    }

    console.log("");
    console.log(`Open conflicts (${bundle.conflicts.length}):`);
    if (bundle.conflicts.length === 0) {
      console.log("  (none)");
    } else {
      for (const c of bundle.conflicts) {
        console.log(`  ${c.severity} ${c.category}: ${c.summary}`);
      }
    }
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
