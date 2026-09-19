import { mkdtemp, cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  initializeProject,
  listProjectConflicts,
  rejectProjectConflict,
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

describe("v0.4 parser-based conflicts", () => {
  it("detects STRUCTURAL, SCHEMA, and CONFIGURATION mismatches", async () => {
    const root = await copyFixture("parser-conflicts");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const open = await listProjectConflicts(root);
    const categories = new Set(open.map((c) => c.category));

    expect(categories.has("STRUCTURAL_MISMATCH")).toBe(true);
    expect(categories.has("SCHEMA_MISMATCH")).toBe(true);
    expect(categories.has("CONFIGURATION_MISMATCH")).toBe(true);

    const structural = open.find((c) => c.category === "STRUCTURAL_MISMATCH")!;
    expect(structural.summary).toContain("subtract");
    expect(structural.confidence).toBe("LIKELY");

    const schema = open.find((c) => c.category === "SCHEMA_MISMATCH")!;
    expect(schema.summary).toContain("role");

    const config = open.find((c) => c.category === "CONFIGURATION_MISMATCH")!;
    expect(config.summary).toMatch(/Node 18/);
  });

  it("keeps rejected parser conflicts closed across rescan", async () => {
    const root = await copyFixture("parser-conflicts");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const structural = (await listProjectConflicts(root)).find(
      (c) => c.category === "STRUCTURAL_MISMATCH",
    )!;
    await rejectProjectConflict(root, structural.id);

    await scanProject({ rootPath: root });
    const open = await listProjectConflicts(root);
    expect(open.find((c) => c.id === structural.id)).toBeUndefined();

    const closed = (await listProjectConflicts(root, { includeClosed: true })).find(
      (c) => c.id === structural.id,
    );
    expect(closed?.lifecycle).toBe("REJECTED");
  });
});
