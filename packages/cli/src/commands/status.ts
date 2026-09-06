import { getProjectStatus } from "@adce/core";

export async function runStatus(cwd = process.cwd()): Promise<void> {
  const status = await getProjectStatus(cwd);
  if (!status.initialized) {
    console.log("ADCE is not initialized in this directory.");
    console.log("Run `adce init` first.");
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
