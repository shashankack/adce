import { execFile } from "node:child_process";
import { mkdtemp, cp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  getArtifactHistory,
  initializeProject,
  listProjectArtifacts,
  scanProject,
} from "@adce/core";

const execFileAsync = promisify(execFile);
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

describe("v0.3 artifact history", () => {
  it("returns filesystem and ADCE snapshot events without Git", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const source =
      artifacts.find((a) => a.path === "src/index.ts") ?? artifacts[0]!;

    const history = await getArtifactHistory(root, source.id.slice(0, 8));
    expect(history.artifactId).toBe(source.id);
    expect(history.events.length).toBeGreaterThan(0);

    const providers = new Set(history.events.map((e) => e.provider));
    expect(providers.has("adce_snapshot")).toBe(true);
    expect(providers.has("filesystem")).toBe(true);
    expect(providers.has("git")).toBe(false);

    expect(history.events.some((e) => e.kind === "ARTIFACT_CREATED")).toBe(
      true,
    );
    expect(history.events.some((e) => e.kind === "SCAN_COMPLETED")).toBe(true);

    // Newest first
    for (let i = 1; i < history.events.length; i++) {
      expect(
        history.events[i - 1]!.at >= history.events[i]!.at,
      ).toBe(true);
    }
  });

  it("includes git commits when the project is a git repo", async () => {
    const root = await copyFixture("basic-typescript");
    await execFileAsync("git", ["init"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "ADCE Test"], {
      cwd: root,
    });
    await execFileAsync("git", ["config", "user.email", "test@adce.local"], {
      cwd: root,
    });
    await execFileAsync("git", ["add", "."], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "initial fixture"], {
      cwd: root,
    });

    await writeFile(
      path.join(root, "src/index.ts"),
      'export const add = (a: number, b: number): number => a + b + 1;\n',
      "utf8",
    );
    await execFileAsync("git", ["add", "src/index.ts"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "bump add"], { cwd: root });

    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const source = artifacts.find((a) => a.path === "src/index.ts")!;
    const history = await getArtifactHistory(root, source.id);

    const gitEvents = history.events.filter((e) => e.provider === "git");
    expect(gitEvents.length).toBeGreaterThan(0);
    expect(gitEvents.some((e) => e.summary.includes("bump add"))).toBe(true);
  });
});
