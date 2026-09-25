import { mkdtemp, cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkProjectStructure,
  initializeProject,
  scanProject,
} from "@adce/core";
import { matchGlob } from "../src/structure/match-glob.js";

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

describe("structure matchGlob", () => {
  it("matches brace and globstar patterns", () => {
    expect(matchGlob("src/index.ts", "src/**/*.{ts,tsx,js,jsx}")).toBe(true);
    expect(matchGlob("src/index.test.ts", "**/*.{test,spec}.{ts,tsx}")).toBe(
      true,
    );
    expect(matchGlob("README.md", "README.md")).toBe(true);
    expect(matchGlob("docs/overview.md", "README.md")).toBe(false);
  });
});

describe("v0.5 structure check", () => {
  it("reports present rules on basic-typescript", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const report = await checkProjectStructure(root, {
      profileId: "typescript-lib",
    });

    expect(report.profileId).toBe("typescript-lib");
    expect(
      report.findings.some((f) => f.ruleId === "readme" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.some((f) => f.ruleId === "source" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.some((f) => f.ruleId === "tests" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.some((f) => f.ruleId === "agents" && f.status === "PRESENT"),
    ).toBe(true);
    expect(report.summary.missing).toBe(0);
  });

  it("reports missing required rules on empty-project", async () => {
    const root = await copyFixture("empty-project");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const report = await checkProjectStructure(root, {
      profileId: "typescript-lib",
    });

    expect(report.summary.missing).toBeGreaterThan(0);
    expect(
      report.findings.some((f) => f.ruleId === "source" && f.status === "MISSING"),
    ).toBe(true);
  });
});
