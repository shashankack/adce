import { mkdtemp, cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  InvalidRelationshipTypeError,
  RelationshipExistsError,
  RelationshipSelfLinkError,
  initializeProject,
  linkProjectArtifacts,
  listProjectArtifacts,
  listProjectGraph,
  listProjectRelationships,
  scanProject,
  unlinkProjectRelationship,
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

describe("v0.3 relationships", () => {
  it("links two artifacts and lists graph", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const source =
      artifacts.find((a) => a.path === "src/index.ts") ?? artifacts[0]!;
    const target =
      artifacts.find((a) => a.path === "README.md") ??
      artifacts.find((a) => a.id !== source.id)!;

    expect(target).toBeDefined();

    const rel = await linkProjectArtifacts(root, {
      sourceIdOrPrefix: source.id.slice(0, 8),
      targetIdOrPrefix: target!.id.slice(0, 8),
      type: "RELATED_TO",
    });

    expect(rel.origin).toBe("MANUAL");
    expect(rel.verification).toBe("VERIFIED");
    expect(rel.type).toBe("RELATED_TO");

    const all = await listProjectRelationships(root);
    expect(all).toHaveLength(1);

    const graph = await listProjectGraph(root);
    expect(graph).toHaveLength(1);
    expect(graph[0]!.sourceLabel).toBe(source.path);
    expect(graph[0]!.targetLabel).toBe(target!.path);
  });

  it("rejects duplicate edge", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);
    expect(a).toBeDefined();
    expect(b).toBeDefined();

    await linkProjectArtifacts(root, {
      sourceIdOrPrefix: a!.id,
      targetIdOrPrefix: b!.id,
      type: "TESTS",
    });

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: b!.id,
        type: "TESTS",
      }),
    ).rejects.toBeInstanceOf(RelationshipExistsError);
  });

  it("rejects self link and invalid type", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: a!.id,
        type: "RELATED_TO",
      }),
    ).rejects.toBeInstanceOf(RelationshipSelfLinkError);

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: b!.id,
        type: "NOT_A_TYPE",
      }),
    ).rejects.toBeInstanceOf(InvalidRelationshipTypeError);
  });

  it("unlinks by relationship id prefix", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);
    const rel = await linkProjectArtifacts(root, {
      sourceIdOrPrefix: a!.id,
      targetIdOrPrefix: b!.id,
      type: "DOCUMENTS",
    });

    await unlinkProjectRelationship(root, rel.id.slice(0, 8));

    const after = await listProjectRelationships(root);
    expect(after).toHaveLength(0);
  });
});
