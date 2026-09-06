import { scanProject } from "@adce/core";

export async function runScan(
  cwd = process.cwd(),
  opts: { full?: boolean } = {},
): Promise<void> {
  const result = await scanProject({ rootPath: cwd, full: opts.full });
  console.log(`Scan complete (${result.mode})`);
  console.log(`Files seen: ${result.filesSeen}`);
  console.log(`Added: ${result.added}`);
  console.log(`Changed: ${result.changed}`);
  console.log(`Unchanged: ${result.unchanged}`);
  console.log(`Removed: ${result.removed}`);
  console.log(`Git detected: ${result.gitDetected ? "yes" : "no"}`);
}
