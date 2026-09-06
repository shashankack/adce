import { readFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import type { AdceConfig } from "../config/schema.js";

export interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
}

export const discoverFiles = async (
  rootPath: string,
  config: AdceConfig,
): Promise<DiscoveredFile[]> => {
  const ig = ignore();
  ig.add(config.ignore);

  try {
    const gitignore = await readFile(path.join(rootPath, ".gitignore"), "utf8");
    ig.add(gitignore);
  } catch {}

  const entries = await fg("**/*", {
    cwd: rootPath,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: config.scan.followSymlinks,
    absolute: false,
  });
  const files: DiscoveredFile[] = [];
  for (const relativePath of entries) {
    const normalized = relativePath.replace(/\\/g, "/");
    if (ig.ignores(normalized)) continue;
    files.push({
      relativePath: normalized,
      absolutePath: path.join(rootPath, normalized),
    });
  }
  return files;
};
