import { mkdtemp, cp, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  ADCE_AGENTS_BEGIN,
  initializeProject,
} from "@adce/core";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const temps: string[] = [];

const copyFixture = async (name: string): Promise<string> => {
  const dest = await mkdtemp(path.join(os.tmpdir(), `adce-${name}-`));
  temps.push(dest);
  await cp(path.join(repoRoot, "fixtures", name), dest, { recursive: true });
  return dest;
};

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("init AGENTS.md merge", () => {
  it("merges ADCE section into a pre-existing AGENTS.md", async () => {
    const root = await copyFixture("basic-typescript");
    await writeFile(
      path.join(root, "AGENTS.md"),
      "# Existing agents file\n\nProject rules here.\n",
      "utf8",
    );

    const init = await initializeProject(root);
    expect(init.created.agentsMd).toBe(false);
    expect(init.agentsMdAction).toBe("merged");

    const text = await readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(text).toContain("# Existing agents file");
    expect(text).toContain("Project rules here.");
    expect(text).toContain(ADCE_AGENTS_BEGIN);
    expect(text).toContain("adce context");
    expect(text).toContain("adce structure");
  });
});
