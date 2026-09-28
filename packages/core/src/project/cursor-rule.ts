import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const CURSOR_ADCE_RULE_RELATIVE = path.join(
  ".cursor",
  "rules",
  "adce.mdc",
);

/** Always-apply Cursor rule pointing agents at ADCE CLI. */
export const CURSOR_ADCE_RULE_BODY = `---
description: Use ADCE for artifact context before repository-level changes
alwaysApply: true
---

# ADCE

This repository uses ADCE (Artifact-Driven Context Engine).

Before repository-level modifications:

1. Run \`adce status\` (or \`adce doctor\`).
2. Run \`adce context --task "<current task>" --format markdown\`.
3. Follow brief sections in order: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT.
4. Do not trust CAUTION artifacts over TRUST ORDER / VERIFIED sources.
5. Run \`adce conflicts\` (and \`adce analyze --skip-ml\` if useful) when CAUTION is non-empty.
6. Prefer \`adce authority set\` for known trust; run \`adce structure\` before large changes.
`;

export type CursorRuleAction = "created" | "updated" | "unchanged";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export const ensureCursorAdceRule = async (
  rootPath: string,
): Promise<CursorRuleAction> => {
  const filePath = path.join(rootPath, CURSOR_ADCE_RULE_RELATIVE);
  await mkdir(path.dirname(filePath), { recursive: true });

  if (await exists(filePath)) {
    const current = await readFile(filePath, "utf8");
    if (current === CURSOR_ADCE_RULE_BODY) {
      return "unchanged";
    }
    await writeFile(filePath, CURSOR_ADCE_RULE_BODY, "utf8");
    return "updated";
  }

  await writeFile(filePath, CURSOR_ADCE_RULE_BODY, "utf8");
  return "created";
};
