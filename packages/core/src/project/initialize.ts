import { access, mkdir, writeFile } from "node:fs/promises";
import { isGitRepository } from "@adce/git";
import { closeDatabase, openDatabase, setMeta } from "@adce/storage";
import { writeDefaultConfig } from "../config/loader.js";
import { AGENTS_TEMPLATE } from "./agents-template.js";
import {
  adceDir,
  agentsPath,
  artifactsDir,
  cacheDir,
  dbPath,
  logsDir,
} from "./paths.js";

export interface InitResult {
  rootPath: string;
  gitDetected: boolean;
  created: {
    adceDir: boolean;
    config: boolean;
    database: boolean;
    agentsMd: boolean;
  };
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function initializeProject(rootPath: string): Promise<InitResult> {
  const dir = adceDir(rootPath);
  if (await exists(dir)) {
    throw new Error(`ADCE already initialized at ${dir}`);
  }

  await mkdir(dir, { recursive: true });
  await mkdir(artifactsDir(rootPath), { recursive: true });
  await mkdir(cacheDir(rootPath), { recursive: true });
  await mkdir(logsDir(rootPath), { recursive: true });

  await writeDefaultConfig(rootPath);

  const gitDetected = await isGitRepository(rootPath);
  const db = openDatabase(dbPath(rootPath));
  try {
    const now = new Date().toISOString();
    setMeta(db, "rootPath", rootPath);
    setMeta(db, "createdAt", now);
    setMeta(db, "gitDetected", gitDetected ? "true" : "false");
    setMeta(db, "lastScanAt", "");
  } finally {
    closeDatabase(db);
  }

  const agents = agentsPath(rootPath);
  let createdAgents = false;
  if (!(await exists(agents))) {
    await writeFile(agents, AGENTS_TEMPLATE, "utf8");
    createdAgents = true;
  }

  return {
    rootPath,
    gitDetected,
    created: {
      adceDir: true,
      config: true,
      database: true,
      agentsMd: createdAgents,
    },
  };
}
