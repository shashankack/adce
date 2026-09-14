#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runScan } from "./commands/scan.js";
import { runStatus } from "./commands/status.js";
import {
  runArtifact,
  runArtifactVerify,
  runArtifactReject,
} from "./commands/artifact.js";
import { runArtifacts } from "./commands/artifacts.js";
import { error } from "node:console";

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

program
  .command("artifacts")
  .description("List stored artifacts")
  .action(async () => {
    await runArtifacts();
  });

const artifact = program
  .command("artifact")
  .description("Inspect or update a single artifact");

artifact
  .command("show")
  .description("Show a single artifact by id")
  .argument("<id>", "Full artifact id")
  .action(async (id: string) => {
    await runArtifact(id);
  });

artifact
  .command("verify")
  .description("Mark an artifact as VERIFIED")
  .argument("<id>", "Full artifact id")
  .action(async (id: string) => {
    await runArtifactVerify(id);
  });

artifact
  .command("reject")
  .description("Mark an artifact as REJECTED")
  .argument("<id>", "Full artifact id")
  .action(async (id: string) => {
    await runArtifactReject(id);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
