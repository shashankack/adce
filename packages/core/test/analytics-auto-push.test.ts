import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  initializeProject,
  maybeAutoPushAnalytics,
  pushProjectAnalytics,
} from "@adce/core";
import { configPath } from "../src/config/loader.js";

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("analytics auto-push", () => {
  it("maybeAutoPush is a no-op when analytics.enabled is false", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-autopush-"));
    temps.push(root);
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, "README.md"), "# t\n");
    await initializeProject(root, { fillStructure: false });

    // Must not throw even without ADCE_ML_URL
    maybeAutoPushAnalytics(root);
    await new Promise((r) => setTimeout(r, 50));

    await expect(pushProjectAnalytics(root)).rejects.toThrow(/disabled/i);
  });

  it("config file can enable analytics", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-autopush-"));
    temps.push(root);
    await writeFile(path.join(root, "README.md"), "# t\n");
    await initializeProject(root, { fillStructure: false });
    await writeFile(
      configPath(root),
      "version: 1\nignore: []\nscan:\n  followSymlinks: false\nanalytics:\n  enabled: true\n",
    );

    // Still no URL → push throws url missing (proves enabled gate passed)
    await expect(pushProjectAnalytics(root)).rejects.toThrow(/URL/i);
  });
});
