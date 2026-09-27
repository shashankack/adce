#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runScan } from "./commands/scan.js";
import { runStatus } from "./commands/status.js";
import {
  runArtifact,
  runArtifactAdd,
  runArtifactEdit,
  runArtifactIgnore,
  runArtifactVerify,
  runArtifactReject,
} from "./commands/artifact.js";
import { runArtifacts } from "./commands/artifacts.js";
import { runArtifactsReview } from "./commands/artifacts-review.js";
import { runGraph } from "./commands/graph.js";
import { runLink } from "./commands/link.js";
import { runUnlink } from "./commands/unlink.js";
import { runHistory } from "./commands/history.js";
import {
  runConflictConfirm,
  runConflictIgnore,
  runConflictReject,
  runConflictResolve,
  runConflictShow,
  runConflicts,
} from "./commands/conflicts.js";
import { runContext } from "./commands/context.js";
import { runAuthorityClear, runAuthoritySet } from "./commands/authority.js";
import { runAnalyze } from "./commands/analyze.js";
import { runStructure } from "./commands/structure.js";

const program = new Command();

program
  .name("adce")
  .description("Artifact-Driven Context Engine")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize ADCE in the current project")
  .option("-y, --yes", "Skip confirmation; use detected project root", false)
  .option(
    "--repair",
    "Repair an incomplete .adce (rewrite missing meta / layout)",
    false,
  )
  .action(async (option: { yes?: boolean; repair?: boolean }) => {
    await runInit(process.cwd(), { yes: option.yes, repair: option.repair });
  });

program
  .command("scan")
  .description("Scan the current project")
  .option("--full", "Force a full scan", false)
  .action(async (options: { full?: boolean }) => {
    await runScan(process.cwd(), { full: options.full });
  });

program
  .command("status")
  .description("Show ADCE project status")
  .option("--format <format>", "text or json", "text")
  .action(async (options: { format?: string }) => {
    await runStatus({
      format: options.format === "json" ? "json" : "text",
    });
  });

const artifacts = program
  .command("artifacts")
  .description("List stored artifacts")
  .option(
    "-t, --type <types>",
    "Comma-separated artifact types (e.g. SOURCE,TEST)",
  )
  .action(async (options: { type?: string }) => {
    await runArtifacts({ type: options.type });
  });

artifacts
  .command("review")
  .description("Interactively review UNREVIEWED DETECTED artifacts")
  .action(async () => {
    await runArtifactsReview();
  });

const artifact = program
  .command("artifact")
  .description("Inspect or update a single artifact");

artifact
  .command("show")
  .description("Show a single artifact by id or unique prefix")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runArtifact(id);
  });

artifact
  .command("verify")
  .description("Mark an artifact as VERIFIED")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runArtifactVerify(id);
  });

artifact
  .command("reject")
  .description("Mark an artifact as REJECTED")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runArtifactReject(id);
  });

artifact
  .command("ignore")
  .description("Mark an artifact as IGNORED")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runArtifactIgnore(id);
  });

artifact
  .command("edit")
  .description("Edit artifact name and/or type")
  .argument("<id>", "Artifact id or unique prefix")
  .option("-n, --name <name>", "New artifact name")
  .option("-t, --type <type>", "New artifact type")
  .action(async (id: string, options: { name?: string; type?: string }) => {
    await runArtifactEdit(id, { name: options.name, type: options.type });
  });

artifact
  .command("add")
  .description("Add a manual artifact (optionally with no backing file)")
  .requiredOption("-n, --name <name>", "Artifact name")
  .requiredOption(
    "-t, --type <type>",
    "Artifact type (e.g. REQUIREMENT, POLICY, DOCUMENTATION)",
  )
  .option("-p, --path <path>", "Optional project-relative file path")
  .option(
    "-m, --manual",
    "Create a virtual artifact with no backing file",
    false,
  )
  .option(
    "--stub",
    "For virtual artifacts, write a stub under .adce/artifacts/",
    false,
  )
  .action(
    async (options: {
      name: string;
      type: string;
      path?: string;
      manual?: boolean;
      stub?: boolean;
    }) => {
      await runArtifactAdd({
        name: options.name,
        type: options.type,
        path: options.path,
        manual: options.manual,
        stub: options.stub,
      });
    },
  );

program
  .command("graph")
  .description("List artifact relationships")
  .action(async () => {
    await runGraph();
  });

program
  .command("link")
  .description("Create a manual relationship between two artifacts")
  .argument("<source>", "Source artifact id or unique prefix")
  .argument("<target>", "Target artifact id or unique prefix")
  .requiredOption(
    "-t, --type <type>",
    "Relationship type (e.g. TESTS, IMPLEMENTS, DOCUMENTS)",
  )
  .action(async (source: string, target: string, options: { type: string }) => {
    await runLink({ source, target, type: options.type });
  });

program
  .command("unlink")
  .description("Reject a relationship by id or unique prefix (tombstone)")
  .argument("<id>", "Relationship id or unique prefix")
  .action(async (id: string) => {
    await runUnlink(id);
  });

program
  .command("history")
  .description("Show temporal history for an artifact")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runHistory(id);
  });

program
  .command("conflicts")
  .description("List open conflicts")
  .option("--all", "Include rejected / ignored / resolved conflicts", false)
  .option("--format <format>", "text or json", "text")
  .action(async (options: { all?: boolean; format?: string }) => {
    await runConflicts({
      all: options.all,
      format: options.format === "json" ? "json" : "text",
    });
  });

const conflict = program
  .command("conflict")
  .description("Inspect or update a single conflict");

conflict
  .command("show")
  .description("Show a conflict by id or unique prefix")
  .argument("<id>", "Conflict id or unique prefix")
  .action(async (id: string) => {
    await runConflictShow(id);
  });

conflict
  .command("reject")
  .description("Mark a conflict as REJECTED (survives future scans)")
  .argument("<id>", "Conflict id or unique prefix")
  .action(async (id: string) => {
    await runConflictReject(id);
  });

conflict
  .command("ignore")
  .description("Mark a conflict as IGNORED (survives future scans)")
  .argument("<id>", "Conflict id or unique prefix")
  .action(async (id: string) => {
    await runConflictIgnore(id);
  });

conflict
  .command("confirm")
  .description("Mark a conflict as CONFIRMED")
  .argument("<id>", "Conflict id or unique prefix")
  .action(async (id: string) => {
    await runConflictConfirm(id);
  });

conflict
  .command("resolve")
  .description("Mark a conflict as RESOLVED")
  .argument("<id>", "Conflict id or unique prefix")
  .action(async (id: string) => {
    await runConflictResolve(id);
  });

program
  .command("context")
  .description("Generate ranked project context for agents")
  .option("-t, --task <task>", "Task description to bias ranking")
  .option("--budget <n>", "Max primary artifacts", (v) => Number(v), 12)
  .option("--format <format>", "text, json, or markdown", "text")
  .action(
    async (options: { task?: string; budget?: number; format?: string }) => {
      const format =
        options.format === "json"
          ? "json"
          : options.format === "markdown"
            ? "markdown"
            : "text";
      await runContext({
        task: options.task,
        budget: options.budget,
        format,
      });
    },
  );

const authority = program
  .command("authority")
  .description("Set or clear artifact authority");

authority
  .command("set")
  .description("Set artifact authority level")
  .argument("<id>", "Artifact id or unique prefix")
  .requiredOption(
    "-l, --level <level>",
    "CANONICAL | AUTHORITATIVE | SUPPORTING | INFERRED | UNKNOWN",
  )
  .action(async (id: string, options: { level: string }) => {
    await runAuthoritySet(id, options.level);
  });

authority
  .command("clear")
  .description("Clear artifact authority back to UNKNOWN")
  .argument("<id>", "Artifact id or unique prefix")
  .action(async (id: string) => {
    await runAuthorityClear(id);
  });

program
  .command("analyze")
  .description("Analyze conflicts (heuristic + optional ML)")
  .argument("[conflictId]", "Optional conflict id or unique prefix")
  .option("--all", "Include closed conflicts as analysis input", false)
  .option("--deep", "Deeper heuristic / ML feature set", false)
  .option("--format <format>", "text or json", "text")
  .option("--no-cache", "Bypass analyze cache", false)
  .option("--skip-ml", "Skip Python / ML even if available", false)
  .option("--no-apply", "Do not mark conflicts ANALYZED", false)
  .option("--ml-script <path>", "Path to Python ML CLI script")
  .action(
    async (
      conflictId: string | undefined,
      options: {
        all?: boolean;
        deep?: boolean;
        format?: string;
        noCache?: boolean;
        skipMl?: boolean;
        noApply?: boolean;
        mlScript?: string;
      },
    ) => {
      await runAnalyze({
        conflictId,
        all: options.all,
        deep: options.deep,
        format: options.format === "json" ? "json" : "text",
        noCache: options.noCache,
        noMl: options.skipMl,
        noApply: options.noApply,
        mlScript: options.mlScript,
      });
    },
  );

program
  .command("structure")
  .description("Check project against a recommended artifact structure")
  .option("-p, --profile <id>", "Profile id", "typescript-lib")
  .option("--format <format>", "text or json", "text")
  .action(async (opts) => {
    await runStructure({
      profile: opts.profile,
      format: opts.format === "json" ? "json" : "text",
    });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
