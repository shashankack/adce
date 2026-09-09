#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runScan } from "./commands/scan.js";
import { runStatus } from "./commands/status.js";
import { runArtifact } from "./commands/artifact.js";
import { runArtifacts } from "./commands/artifacts.js";

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

program
  .command("artifact")
  .description("Show a single artifact by id")
  .argument("<id>", "Full artifact id")
  .action(async (id: string) => {
    await runArtifact(id);
  });

program.parse();
