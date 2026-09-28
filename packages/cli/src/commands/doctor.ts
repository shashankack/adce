import {
  AdceIncompleteError,
  AdceNotInitializedError,
  runProjectDoctor,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { printAgentSessionNudge } from "../ui/agent-nudge.js";
import { log } from "../ui/logger.js";

export interface RunDoctorOptions {
  format?: "text" | "json";
  /** Always print the mid-session paste nudge for coding agents. */
  nudge?: boolean;
}

export const runDoctor = async (
  options: RunDoctorOptions = {},
  cwd = process.cwd(),
): Promise<void> => {
  let rootPath: string;
  try {
    rootPath = await resolveAdceRoot(cwd);
  } catch (error) {
    if (
      error instanceof AdceNotInitializedError ||
      error instanceof AdceIncompleteError
    ) {
      rootPath = cwd;
    } else {
      throw error;
    }
  }

  const report = await runProjectDoctor(rootPath);

  if (options.format === "json") {
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
    return;
  }

  console.log(`Doctor for ${report.rootPath}`);
  console.log(`Generated: ${report.generatedAt}`);
  console.log("");

  for (const check of report.checks) {
    const mark =
      check.severity === "ok" ? "✓" : check.severity === "warn" ? "!" : "✗";
    console.log(`${mark} [${check.id}] ${check.summary}`);
    if (check.hint) console.log(`    hint: ${check.hint}`);
  }

  console.log("");
  if (report.ok) {
    log.ok("Doctor checks passed (no errors).");
  } else {
    log.error("Doctor found issues — see hints above.");
    process.exitCode = 1;
  }

  if (options.nudge) {
    printAgentSessionNudge();
  } else {
    console.log("");
    console.log(
      "Tip: for an already-open agent chat, run `adce doctor --nudge` and paste the block.",
    );
  }
};
