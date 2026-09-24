import { mkdtemp, cp, rm, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  analyzeProject,
  initializeProject,
  listProjectConflicts,
  scanProject,
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

describe("v0.6 analyze", () => {
  it("runs heuristic analyze, marks conflicts ANALYZED, and caches", async () => {
    const root = await copyFixture("parser-conflicts");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const before = await listProjectConflicts(root);
    expect(before.length).toBeGreaterThan(0);

    const report = await analyzeProject(root, {
      mlScript: null,
      useCache: true,
    });
    expect(report.engine).toBe("heuristic");
    expect(report.cached).toBe(false);
    expect(report.suggestions.length).toBeGreaterThan(0);

    const after = await listProjectConflicts(root);
    expect(after.every((c) => c.lifecycle === "ANALYZED")).toBe(true);

    const cached = await analyzeProject(root, {
      mlScript: null,
      useCache: true,
      apply: false,
    });
    expect(cached.cached).toBe(true);
    expect(cached.engine).toBe("heuristic");
  });

  it("analyzes a single conflict by prefix", async () => {
    const root = await copyFixture("basic-typescript");
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    await utimes(path.join(root, "README.md"), old, old);
    await utimes(path.join(root, "src/index.ts"), recent, recent);

    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [conflict] = await listProjectConflicts(root);
    expect(conflict).toBeDefined();

    const report = await analyzeProject(root, {
      conflictId: conflict!.id.slice(0, 8),
      mlScript: null,
      useCache: false,
    });

    expect(report.mode).toBe("default");
    const open = await listProjectConflicts(root);
    const analyzed = open.find((c) => c.id === conflict!.id);
    expect(analyzed?.lifecycle).toBe("ANALYZED");
  });
});
