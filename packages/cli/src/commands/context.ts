import { AdceNotInitializedError, buildProjectContext } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunContextOptions {
  task?: string;
  budget?: number;
  format?: "text" | "json";
}

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
        `  [${a.score}] ${a.type.padEnd(18)} ${a.verification.padEnd(10)} ${a.health.padEnd(12)} ${loc}`,
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
