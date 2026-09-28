import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { StatusReport } from "@adce/shared";
import {
  ADCE_AGENTS_BEGIN,
  ADCE_AGENTS_END,
} from "./agents-template.js";
import { CURSOR_ADCE_RULE_RELATIVE } from "./cursor-rule.js";
import { getProjectStatus } from "./status.js";
import { agentsPath } from "./paths.js";

export type DoctorSeverity = "ok" | "warn" | "error";

export interface DoctorCheck {
  id: string;
  severity: DoctorSeverity;
  summary: string;
  hint?: string;
}

export interface DoctorReport {
  rootPath: string;
  generatedAt: string;
  ok: boolean;
  checks: DoctorCheck[];
  status: StatusReport;
  /** True when AGENTS.md contains the marked ADCE instruction block. */
  agentsMdReady: boolean;
  /** True when `.cursor/rules/adce.mdc` exists. */
  cursorRuleReady: boolean;
}

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export const runProjectDoctor = async (
  rootPath: string,
): Promise<DoctorReport> => {
  const checks: DoctorCheck[] = [];
  const status = await getProjectStatus(rootPath);

  if (!status.initialized) {
    checks.push({
      id: "initialized",
      severity: "error",
      summary: "ADCE is not initialized",
      hint: "Run `adce init -y`",
    });
  } else {
    checks.push({
      id: "initialized",
      severity: "ok",
      summary: "ADCE is initialized",
    });
  }

  const agents = agentsPath(rootPath);
  let agentsMdReady = false;
  if (!(await exists(agents))) {
    checks.push({
      id: "agents-md",
      severity: "error",
      summary: "AGENTS.md is missing",
      hint: "Run `adce init --repair` to create/merge ADCE instructions",
    });
  } else {
    const text = await readFile(agents, "utf8");
    const hasBegin = text.includes(ADCE_AGENTS_BEGIN);
    const hasEnd = text.includes(ADCE_AGENTS_END);
    const hasContext = text.includes("adce context");
    agentsMdReady = hasBegin && hasEnd && hasContext;
    if (agentsMdReady) {
      checks.push({
        id: "agents-md",
        severity: "ok",
        summary: "AGENTS.md contains the ADCE instruction block",
      });
    } else if (hasContext && !hasBegin) {
      checks.push({
        id: "agents-md",
        severity: "warn",
        summary:
          "AGENTS.md mentions ADCE but is missing update markers",
        hint: "Run `adce init --repair` to wrap/refresh the marked ADCE section",
      });
    } else {
      checks.push({
        id: "agents-md",
        severity: "error",
        summary: "AGENTS.md is missing ADCE agent instructions",
        hint: "Run `adce init --repair` to merge the ADCE section",
      });
    }
  }

  const cursorRulePath = path.join(rootPath, CURSOR_ADCE_RULE_RELATIVE);
  const cursorRuleReady = await exists(cursorRulePath);
  if (cursorRuleReady) {
    checks.push({
      id: "cursor-rule",
      severity: "ok",
      summary: "Cursor rule `.cursor/rules/adce.mdc` is present",
    });
  } else {
    checks.push({
      id: "cursor-rule",
      severity: "warn",
      summary: "Cursor ADCE rule is missing",
      hint: "Run `adce init --repair` to write `.cursor/rules/adce.mdc`",
    });
  }

  if (status.initialized) {
    if (!status.lastScanAt) {
      checks.push({
        id: "scan",
        severity: "warn",
        summary: "No scan recorded yet",
        hint: "Run `adce scan` before context / structure / conflicts",
      });
    } else {
      checks.push({
        id: "scan",
        severity: "ok",
        summary: `Last scan at ${status.lastScanAt} (${status.artifactCount} artifacts)`,
      });
    }
  }

  const ok = checks.every((c) => c.severity !== "error");

  return {
    rootPath,
    generatedAt: new Date().toISOString(),
    ok,
    checks,
    status,
    agentsMdReady,
    cursorRuleReady,
  };
};
