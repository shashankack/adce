import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type GitignoreAdceAction = "appended" | "unchanged" | "skipped";

const ENTRY = ".adce/";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

/** True if .gitignore already ignores .adce (with or without trailing slash). */
export const gitignoreHasAdce = (content: string): boolean => {
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line === ".adce" || line === ".adce/" || line === "/.adce" || line === "/.adce/") {
      return true;
    }
    // Common variants
    if (line === "**/.adce/" || line === "**/.adce") return true;
  }
  return false;
};

/**
 * If `.gitignore` exists and does not yet ignore `.adce/`, append the entry.
 * Does not create `.gitignore` when missing.
 */
export const ensureGitignoreAdce = async (
  rootPath: string,
): Promise<GitignoreAdceAction> => {
  const gitignorePath = path.join(rootPath, ".gitignore");
  if (!(await exists(gitignorePath))) {
    return "skipped";
  }

  const existing = await readFile(gitignorePath, "utf8");
  if (gitignoreHasAdce(existing)) {
    return "unchanged";
  }

  const needsNewline = existing.length > 0 && !existing.endsWith("\n");
  const block = `${needsNewline ? "\n" : ""}\n# ADCE local project intelligence (regenerable via adce scan)\n${ENTRY}\n`;
  await writeFile(gitignorePath, existing + block, "utf8");
  return "appended";
};
