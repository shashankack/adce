import { mkdtemp, cp, rm, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  AGENT_SESSION_NUDGE,
  CURSOR_ADCE_RULE_RELATIVE,
  initializeProject,
  runProjectDoctor,
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

describe("doctor + mid-session nudge", () => {
  it("exports a paste-ready AGENT_SESSION_NUDGE", () => {
    expect(AGENT_SESSION_NUDGE).toContain("adce context");
    expect(AGENT_SESSION_NUDGE).toContain("MUST READ");
  });

  it("reports errors when not initialized", async () => {
    const root = await copyFixture("empty-project");
    const report = await runProjectDoctor(root);
    expect(report.ok).toBe(false);
    expect(report.agentsMdReady).toBe(false);
    expect(report.cursorRuleReady).toBe(false);
    expect(report.checks.some((c) => c.id === "initialized" && c.severity === "error")).toBe(
      true,
    );
  });

  it("passes after init + scan and writes Cursor rule", async () => {
    const root = await copyFixture("basic-typescript");
    const init = await initializeProject(root);
    expect(init.cursorRuleAction).toBe("created");

    const rulePath = path.join(root, CURSOR_ADCE_RULE_RELATIVE);
    const rule = await readFile(rulePath, "utf8");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("adce context");

    await scanProject({ rootPath: root });
    const report = await runProjectDoctor(root);
    expect(report.ok).toBe(true);
    expect(report.agentsMdReady).toBe(true);
    expect(report.cursorRuleReady).toBe(true);
    expect(report.checks.every((c) => c.severity !== "error")).toBe(true);
    expect(report.checks.find((c) => c.id === "scan")?.severity).toBe("ok");
  });

  it("warns when Cursor rule is missing after init was partial", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await rm(path.join(root, ".cursor"), { recursive: true, force: true });
    const report = await runProjectDoctor(root);
    expect(report.ok).toBe(true);
    expect(report.cursorRuleReady).toBe(false);
    expect(
      report.checks.find((c) => c.id === "cursor-rule")?.severity,
    ).toBe("warn");
  });

  it("repair recreates Cursor rule and refreshes agents section", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await rm(path.join(root, ".cursor"), { recursive: true, force: true });
    await writeFile(
      path.join(root, "AGENTS.md"),
      "# Custom\n\nNo ADCE here.\n",
      "utf8",
    );

    const repaired = await initializeProject(root, { repair: true });
    expect(repaired.cursorRuleAction).toBe("created");
    expect(repaired.agentsMdAction).toBe("merged");

    const report = await runProjectDoctor(root);
    expect(report.agentsMdReady).toBe(true);
    expect(report.cursorRuleReady).toBe(true);
  });
});
