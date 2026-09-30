import {
  discoverProjectRoot,
  initializeProject,
} from "@adce/core";
import { confirmInitRoot } from "../ui/confirm-init-root.js";
import { printAgentSessionNudge } from "../ui/agent-nudge.js";
import { log } from "../ui/logger.js";

export interface RunInitOptions {
  /** Skip prompts; if mismatch, use detected root (or cwd if none). */
  yes?: boolean;
  /** Repair incomplete `.adce` (missing meta / layout). */
  repair?: boolean;
}

export const runInit = async (
  cwd = process.cwd(),
  options: RunInitOptions = {},
): Promise<void> => {
  const discovery = await discoverProjectRoot(cwd);

  let targetRoot = discovery.cwd;

  if (!discovery.sameAsCwd && discovery.detectedRoot) {
    if (options.yes || options.repair) {
      targetRoot = discovery.detectedRoot;
      console.log(`Using detected project root: ${targetRoot}`);
    } else {
      const choice = await confirmInitRoot(discovery);
      if (choice === "cancel") {
        console.log("Init cancelled.");
        return;
      }
      targetRoot = choice === "root" ? discovery.detectedRoot : discovery.cwd;
    }
  } else if (!discovery.detectedRoot) {
    console.log(
      "No project root markers found. Initializing in current directory.",
    );
  }

  log.step(
    options.repair
      ? `Repairing ADCE in ${targetRoot}`
      : `Initializing ADCE in ${targetRoot}`,
  );
  const result = await initializeProject(targetRoot, {
    repair: options.repair,
  });
  if (result.repaired) {
    log.ok(`Repaired ADCE in ${result.rootPath}`);
  } else {
    log.ok(`Initialized ADCE in ${result.rootPath}`);
  }
  log.step(`Git detected: ${result.gitDetected ? "yes" : "no"}`);
  if (result.agentsMdAction === "created") {
    log.ok("Created AGENTS.md with ADCE instructions.");
  } else if (result.agentsMdAction === "merged") {
    log.ok("Merged ADCE instructions into existing AGENTS.md.");
  } else if (result.agentsMdAction === "updated") {
    log.ok("Updated ADCE section in AGENTS.md.");
  } else {
    log.step("AGENTS.md already contains the ADCE section.");
  }

  if (result.cursorRuleAction === "created") {
    log.ok("Created Cursor rule `.cursor/rules/adce.mdc`.");
  } else if (result.cursorRuleAction === "updated") {
    log.ok("Updated Cursor rule `.cursor/rules/adce.mdc`.");
  } else {
    log.step("Cursor rule `.cursor/rules/adce.mdc` already up to date.");
  }

  if (result.gitignoreAdceAction === "appended") {
    log.ok("Appended `.adce/` to `.gitignore`.");
  } else if (result.gitignoreAdceAction === "unchanged") {
    log.step("`.gitignore` already ignores `.adce/`.");
  } else {
    log.step("No `.gitignore` found — skipped (did not create one).");
  }

  console.log("");
  log.step("Next: run `adce scan`, then use context/structure/conflicts as needed.");
  printAgentSessionNudge();
};
