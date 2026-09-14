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

const program = new Command();

program
  .name("adce")
  .description("Artifact-Driven Context Engine")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize ADCE in the current project")
  .option("-y, --yes", "Skip confirmation; use detected project root", false)
  .action(async (option: { yes?: boolean }) => {
    await runInit(process.cwd(), { yes: option.yes });
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
  .action(async () => {
    await runStatus();
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

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
