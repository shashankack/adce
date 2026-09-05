#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("adce")
  .description("Artifact-Driven Context Engine")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize ADCE in the current project")
  .action(() => {
    console.log("adce init - not implemented yet");
  });

program
  .command("scan")
  .description("Scan the current project")
  .action(() => {
    console.log("adce scan - not implemented yet");
  });

program
  .command("status")
  .description("Show ADCE project status")
  .action(() => {
    console.log("adce status - not implemented yet");
  });

program.parse();
