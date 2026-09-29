import {
  AdceNotInitializedError,
  checkProjectStructure,
  fillStructureStubs,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export const runStructure = async (
  options: {
    profile?: string;
    format?: "text" | "json";
    fill?: boolean;
  } = {},
  cwd = process.cwd(),
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    let report = await checkProjectStructure(rootPath, {
      profileId: options.profile,
    });

    if (options.fill) {
      const filled = await fillStructureStubs(rootPath, report);
      if (filled.created.length > 0) {
        log.ok(`Created stubs: ${filled.created.join(", ")}`);
      }
      if (filled.skipped.length > 0) {
        log.step(`Skipped (wildcard or exists): ${filled.skipped.join(", ")}`);
      }
      report = await checkProjectStructure(rootPath, {
        profileId: options.profile,
      });
    }

    if (options.format === "json") {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(`Structure check (${report.profileId}) for ${report.rootPath}`);
    console.log(
      `Present ${report.summary.present} · Missing ${report.summary.missing} · Suggested ${report.summary.suggested} · Weak ${report.summary.weak}`,
    );
    console.log("");

    for (const status of ["MISSING", "SUGGESTED", "WEAK", "PRESENT"] as const) {
      const group = report.findings.filter((f) => f.status === status);
      if (group.length === 0) continue;
      console.log(`${status}:`);
      for (const f of group) {
        console.log(`  - [${f.ruleId}] ${f.summary}`);
        if (f.evidence) console.log(`      evidence: ${f.evidence}`);
        if (f.hint) console.log(`      hint: ${f.hint}`);
      }
      console.log("");
    }
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Unknown structure profile")
    ) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
