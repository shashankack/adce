import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildAnalyticsBundle,
  findForbiddenKey,
  hashProjectId,
  initializeProject,
  pathPattern,
  sanitizeConflictSummary,
  scanProject,
} from "@adce/core";
import { contextTokenLogPath } from "../src/context/token-metrics-log.js";
import { localFeedbackLogPath } from "../src/analytics/bundle.js";
import { metricsDir } from "../src/project/paths.js";

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("analytics sanitize", () => {
  it("hashes project id and never echoes root path", () => {
    const a = hashProjectId("C:\\Users\\alice\\proj");
    const b = hashProjectId("C:\\Users\\alice\\proj");
    const c = hashProjectId("C:\\Users\\bob\\proj");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain("alice");
    expect(a).toHaveLength(32);
  });

  it("coarsens paths and drops secrets", () => {
    expect(pathPattern("src/lib/device.ts")).toBe("src/**/*.ts");
    expect(pathPattern("requirements/overview.md")).toBe(
      "requirements/**/*.md",
    );
    expect(pathPattern(".env")).toBeNull();
    expect(pathPattern("secrets/token.pem")).toBeNull();
  });

  it("redacts summaries", () => {
    const s = sanitizeConflictSummary(
      "See C:\\Users\\alice\\code\\src\\auth.ts and https://evil.example/x user@x.com",
    );
    expect(s).not.toMatch(/alice/i);
    expect(s).not.toMatch(/https?:\/\//);
    expect(s).not.toMatch(/@/);
    expect(s).toContain("[path]");
  });

  it("bundle has no forbidden keys, rootPath, or raw file paths", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-analytics-"));
    temps.push(root);
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "package.json"), '{"name":"t"}');
    await writeFile(path.join(root, "README.md"), "# t\n");
    await writeFile(path.join(root, "src", "index.ts"), "export {};\n");
    await initializeProject(root, { fillStructure: false });
    await scanProject({ rootPath: root, full: true });

    await mkdir(metricsDir(root), { recursive: true });
    await writeFile(
      contextTokenLogPath(root),
      `${JSON.stringify({
        ts: new Date().toISOString(),
        rootPath: root,
        task: "secret task with C:\\\\Users\\\\alice\\\\x",
        compact: false,
        packUsed: false,
        mlUrlSet: false,
        tokensFull: 100,
        tokensDelivered: 80,
        tokensSaved: 20,
        savingsPercent: 20,
        tokensIfCompact: 60,
        potentialSaved: 40,
        potentialPercent: 40,
        mustRead: 1,
        caution: 0,
        trustOrder: 1,
        alsoRelevant: 0,
        estimator: "chars_div_4",
      })}\n`,
    );
    await writeFile(
      localFeedbackLogPath(root),
      `${JSON.stringify({
        ts: new Date().toISOString(),
        action: "confirm",
        conflictId: "abc123",
        category: "TEMPORAL_MISMATCH",
        summary: "drift in src/auth/login.ts",
        score: 0.7,
      })}\n`,
    );

    const { bundle } = await buildAnalyticsBundle(root);
    expect(findForbiddenKey(bundle)).toBeNull();
    const wire = JSON.stringify(bundle);
    expect(wire).not.toContain(root);
    expect(wire).not.toContain("alice");
    expect(wire).not.toContain("secret task");
    expect(wire).not.toContain("src/auth/login.ts");
    expect(bundle.metrics[0]).toMatchObject({
      projectId: bundle.projectId,
      taskPresent: true,
      tokensFull: 100,
    });
    expect(bundle.feedback[0]?.summary).not.toContain("login.ts");
    for (const e of bundle.events) {
      if (e.sourcePathPattern) {
        expect(String(e.sourcePathPattern)).toMatch(/\/\*\*\/\*|\*/);
      }
    }
  });
});
