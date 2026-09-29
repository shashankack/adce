import { mkdtemp, cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkProjectStructure,
  fillStructureStubs,
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

  it("converts globs inside brace alternatives", () => {
    const pyTests = "{**/test_*.py,**/*_test.py,tests/**/*.py}";
    expect(matchGlob("tests/test_hello.py", pyTests)).toBe(true);
    expect(matchGlob("pkg/foo_test.py", pyTests)).toBe(true);
    expect(matchGlob("src/hello.py", pyTests)).toBe(false);
    expect(
      matchGlob("pyproject.toml", "{pyproject.toml,requirements.txt}"),
    ).toBe(true);
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

  it("reports present rules on basic-python with python profile", async () => {
    const root = await copyFixture("basic-python");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const report = await checkProjectStructure(root, { profileId: "python" });
    expect(report.profileId).toBe("python");
    expect(report.summary.missing).toBe(0);
    expect(
      report.findings.some((f) => f.ruleId === "manifest" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.some((f) => f.ruleId === "source" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.some((f) => f.ruleId === "tests" && f.status === "PRESENT"),
    ).toBe(true);
  });

  it("reports present rules on basic-go with go profile", async () => {
    const root = await copyFixture("basic-go");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const report = await checkProjectStructure(root, { profileId: "go" });
    expect(report.profileId).toBe("go");
    expect(report.summary.missing).toBe(0);
    expect(
      report.findings.some((f) => f.ruleId === "tests" && f.status === "PRESENT"),
    ).toBe(true);
    expect(
      report.findings.find((f) => f.ruleId === "source")?.evidence,
    ).not.toMatch(/_test\.go/);
  });

  it("rejects unknown profile ids", async () => {
    const root = await copyFixture("empty-project");
    await initializeProject(root);
    await expect(
      checkProjectStructure(root, { profileId: "nope" }),
    ).rejects.toThrow(/Unknown structure profile/);
  });

  it("typescript-api requires openapi on conflicting-api fixture", async () => {
    const root = await copyFixture("conflicting-api");
    await initializeProject(root);
    await scanProject({ rootPath: root });
    const report = await checkProjectStructure(root, {
      profileId: "typescript-api",
    });
    expect(report.profileId).toBe("typescript-api");
    expect(
      report.findings.some(
        (f) => f.ruleId === "openapi" && f.status === "PRESENT",
      ),
    ).toBe(true);
  });

  it("structure --fill creates concrete stubs", async () => {
    const root = await copyFixture("empty-project");
    await initializeProject(root);
    const before = await checkProjectStructure(root, {
      profileId: "typescript-lib",
    });
    const filled = await fillStructureStubs(root, before);
    expect(filled.created.length).toBeGreaterThan(0);
    expect(filled.created).toEqual(
      expect.arrayContaining(["README.md", "package.json"]),
    );
  });
});
