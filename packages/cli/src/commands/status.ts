import { getProjectStatus } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export interface RunStatusOptions {
  format?: "text" | "json";
}

export async function runStatus(
  options: RunStatusOptions = {},
  cwd = process.cwd(),
): Promise<void> {
  const rootPath = await resolveAdceRoot(cwd);
  const status = await getProjectStatus(rootPath);

  if (options.format === "json") {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (!status.initialized) {
    log.error("ADCE is not initialized in this directory.");
    log.step("Run `adce init` first.");
    return;
  }

  console.log(`Root: ${status.rootPath}`);
  console.log(`Git detected: ${status.gitDetected ? "yes" : "no"}`);
  console.log(`Created: ${status.createdAt}`);
  console.log(`Last scan: ${status.lastScanAt ?? "(none)"}`);
  console.log(`Artifacts: ${status.artifactCount}`);
  if (status.lastScan) {
    console.log(
      `Last scan mode: ${status.lastScan.mode} (unchanged ${status.lastScan.unchanged}, changed ${status.lastScan.changed})`,
    );
  }
}
