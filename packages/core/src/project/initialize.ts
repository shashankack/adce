import { access, mkdir, writeFile } from "node:fs/promises";
import { isGitRepository } from "@adce/git";
import {
  closeDatabase,
  getMeta,
  openDatabase,
  setMeta,
} from "@adce/storage";
import { loadConfig, writeDefaultConfig } from "../config/loader.js";
import { AGENTS_TEMPLATE } from "./agents-template.js";
import { isAdceInitialized } from "./is-initialized.js";
import {
  adceDir,
  agentsPath,
  artifactsDir,
  cacheDir,
  dbPath,
  logsDir,
} from "./paths.js";

export interface InitOptions {
  /** Repair an existing `.adce` that is missing meta / dirs / config. */
  repair?: boolean;
}

export interface InitResult {
  rootPath: string;
  gitDetected: boolean;
  repaired: boolean;
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

const ensureLayout = async (rootPath: string): Promise<void> => {
  await mkdir(adceDir(rootPath), { recursive: true });
  await mkdir(artifactsDir(rootPath), { recursive: true });
  await mkdir(cacheDir(rootPath), { recursive: true });
  await mkdir(logsDir(rootPath), { recursive: true });
};

const writeFreshMeta = async (rootPath: string): Promise<boolean> => {
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
  return gitDetected;
};

export async function initializeProject(
  rootPath: string,
  options: InitOptions = {},
): Promise<InitResult> {
  const dir = adceDir(rootPath);
  const dirExists = await exists(dir);
  const fullyInitialized = dirExists && (await isAdceInitialized(rootPath));

  if (fullyInitialized && !options.repair) {
    throw new Error(`ADCE already initialized at ${dir}`);
  }

  if (dirExists && !fullyInitialized && !options.repair) {
    throw new Error(
      `ADCE folder exists at ${dir} but is incomplete. Run \`adce init --repair\`.`,
    );
  }

  await ensureLayout(rootPath);

  let createdConfig = false;
  try {
    await loadConfig(rootPath);
  } catch {
    await writeDefaultConfig(rootPath);
    createdConfig = true;
  }

  let gitDetected: boolean;
  let createdDatabase = false;

  if (!(await isAdceInitialized(rootPath))) {
    gitDetected = await writeFreshMeta(rootPath);
    createdDatabase = true;
  } else {
    // Healthy repair: refresh rootPath / gitDetected; keep createdAt / lastScanAt.
    const db = openDatabase(dbPath(rootPath));
    try {
      gitDetected = await isGitRepository(rootPath);
      setMeta(db, "rootPath", rootPath);
      setMeta(db, "gitDetected", gitDetected ? "true" : "false");
      if (!getMeta(db, "createdAt")) {
        setMeta(db, "createdAt", new Date().toISOString());
      }
      if (getMeta(db, "lastScanAt") === null) {
        setMeta(db, "lastScanAt", "");
      }
    } finally {
      closeDatabase(db);
    }
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
    repaired: Boolean(options.repair && dirExists),
    created: {
      adceDir: !dirExists,
      config: createdConfig,
      database: createdDatabase,
      agentsMd: createdAgents,
    },
  };
}
