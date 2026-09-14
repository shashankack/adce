import { mkdtemp, cp, rm, mkdir, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  AdceNotInitializedError,
  findAdceRoot,
  getProjectArtifact,
  getProjectStatus,
  initializeProject,
  listProjectArtifacts,
  rejectProjectArtifact,
  scanProject,
  verifyProjectArtifact,
} from "@adce/core";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const temps: string[] = [];

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

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

describe("v0.2 findAdceRoot", () => {
  it("finds .adce from a subdirectory", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);

    const nested = path.join(root, "src");
    const resolution = await findAdceRoot(nested);

    expect(resolution.rootPath).toBe(root);
    expect(resolution.cwd).toBe(path.resolve(nested));
    expect(resolution.sameAsCwd).toBe(false);
  });

  it("sameAsCwd is true when already at root", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);

    const resolution = await findAdceRoot(root);
    expect(resolution.rootPath).toBe(root);
    expect(resolution.sameAsCwd).toBe(true);
  });

  it("throws when no .adce exists above cwd", async () => {
    const empty = await mkdtemp(path.join(os.tmpdir(), "adce-empty-"));
    temps.push(empty);

    await expect(findAdceRoot(empty)).rejects.toBeInstanceOf(
      AdceNotInitializedError,
    );
  });
});

describe("v0.2 artifacts list / get / verify / reject", () => {
  it("lists and gets artifacts after scan", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    expect(artifacts.length).toBeGreaterThan(0);

    const first = artifacts[0]!;
    const got = await getProjectArtifact(root, first.id);

    expect(got.id).toBe(first.id);
    expect(got.path).toBe(first.path);
    expect(got.verification).toBe("UNREVIEWED");
  });

  it("verify survives a later scan", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const target =
      artifacts.find((a) => a.path === "src/index.ts") ?? artifacts[0]!;

    expect(target.path).toBeTruthy();

    const verified = await verifyProjectArtifact(root, target.id);
    expect(verified.verification).toBe("VERIFIED");

    // Change the backing file so scan does real work
    await writeFile(
      path.join(root, target.path!),
      'export function hello(): string {\n  return "changed";\n}\n',
      "utf8",
    );
    await scanProject({ rootPath: root });

    const after = await getProjectArtifact(root, target.id);
    expect(after.verification).toBe("VERIFIED");
  });

  it("reject updates verification", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [target] = await listProjectArtifacts(root);
    expect(target).toBeDefined();

    const rejected = await rejectProjectArtifact(root, target!.id);
    expect(rejected.verification).toBe("REJECTED");

    const again = await getProjectArtifact(root, target!.id);
    expect(again.verification).toBe("REJECTED");
  });
});
