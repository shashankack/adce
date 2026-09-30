import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureGitignoreAdce,
  gitignoreHasAdce,
  initializeProject,
} from "@adce/core";

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("gitignore .adce", () => {
  it("detects existing .adce entries", () => {
    expect(gitignoreHasAdce("node_modules/\n.adce/\n")).toBe(true);
    expect(gitignoreHasAdce("node_modules/\n.adce\n")).toBe(true);
    expect(gitignoreHasAdce("node_modules/\n")).toBe(false);
  });

  it("appends .adce/ when .gitignore exists without it", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-gi-"));
    temps.push(root);
    await writeFile(path.join(root, ".gitignore"), "node_modules/\n", "utf8");
    const action = await ensureGitignoreAdce(root);
    expect(action).toBe("appended");
    const text = await readFile(path.join(root, ".gitignore"), "utf8");
    expect(text).toContain(".adce/");
    expect(await ensureGitignoreAdce(root)).toBe("unchanged");
  });

  it("skips when .gitignore is missing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-gi-miss-"));
    temps.push(root);
    expect(await ensureGitignoreAdce(root)).toBe("skipped");
  });

  it("init appends .adce/ to existing gitignore", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-gi-init-"));
    temps.push(root);
    await writeFile(path.join(root, ".gitignore"), "dist/\n", "utf8");
    const result = await initializeProject(root);
    expect(result.gitignoreAdceAction).toBe("appended");
    const text = await readFile(path.join(root, ".gitignore"), "utf8");
    expect(text).toMatch(/\.adce\//);
  });
});
