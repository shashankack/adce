import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isGitRepository } from "@adce/git";
import {
  closeDatabase,
  getMeta,
  openDatabase,
  setMeta,
} from "@adce/storage";
import { loadConfig, writeDefaultConfig } from "../config/loader.js";
import {
  seedConcreteStructureStubs,
  type StructureFillResult,
} from "../structure/fill-structure.js";
import { DEFAULT_PROFILE_ID } from "../structure/profiles.js";
import {
  mergeAgentsMarkdown,
  type AgentsMdAction,
} from "./agents-template.js";
import {
  ensureCursorAdceRule,
  type CursorRuleAction,
} from "./cursor-rule.js";
import {
  ensureGitignoreAdce,
  type GitignoreAdceAction,
} from "./gitignore-adce.js";
import { isAdceInitialized } from "./is-initialized.js";
import {
  adceDir,
  agentsPath,
  artifactsDir,
  cacheDir,
  dbPath,
  logsDir,
  metricsDir,
} from "./paths.js";

export interface InitOptions {
  /** Repair an existing `.adce` that is missing meta / dirs / config. */
  repair?: boolean;
  /**
   * Seed concrete structure stubs (README, tsconfig, …) from a profile.
   * Default true. Skips paths that already exist.
   */
  fillStructure?: boolean;
  /** Structure profile for `--fill` seeding (default typescript-lib). */
  structureProfileId?: string;
}

export interface InitResult {
  rootPath: string;
  gitDetected: boolean;
  repaired: boolean;
  agentsMdAction: AgentsMdAction;
  cursorRuleAction: CursorRuleAction;
  gitignoreAdceAction: GitignoreAdceAction;
  structureFill: StructureFillResult | null;
  created: {
    adceDir: boolean;
    config: boolean;
    database: boolean;
    /** True when AGENTS.md was newly created (not merged into an existing file). */
    agentsMd: boolean;
    artifactsReadme: boolean;
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

const ARTIFACTS_README = `# ADCE virtual artifacts

This folder holds **manual / virtual** artifact stubs created with:

\`\`\`text
adce artifact add --stub -n "…" -t DOCUMENTATION
\`\`\`

Scanned project files are stored in \`state.db\`, not copied here.
After \`adce scan\`, use \`adce artifacts\` to list them.
`;

const ensureLayout = async (rootPath: string): Promise<boolean> => {
  await mkdir(adceDir(rootPath), { recursive: true });
  await mkdir(artifactsDir(rootPath), { recursive: true });
  await mkdir(cacheDir(rootPath), { recursive: true });
  await mkdir(logsDir(rootPath), { recursive: true });
  await mkdir(metricsDir(rootPath), { recursive: true });

  const readmePath = path.join(artifactsDir(rootPath), "README.md");
  try {
    await writeFile(readmePath, ARTIFACTS_README, { flag: "wx" });
    return true;
  } catch {
    return false;
  }
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

const ensureAgentsMd = async (rootPath: string): Promise<AgentsMdAction> => {
  const agents = agentsPath(rootPath);
  let existing: string | null = null;
  if (await exists(agents)) {
    existing = await readFile(agents, "utf8");
  }
  const { content, action } = mergeAgentsMarkdown(existing);
  if (action !== "unchanged") {
    await writeFile(agents, content, "utf8");
  }
  return action;
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

  const createdArtifactsReadme = await ensureLayout(rootPath);

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

  const agentsMdAction = await ensureAgentsMd(rootPath);
  const cursorRuleAction = await ensureCursorAdceRule(rootPath);
  const gitignoreAdceAction = await ensureGitignoreAdce(rootPath);

  const fillStructure = options.fillStructure !== false;
  let structureFill: StructureFillResult | null = null;
  if (fillStructure) {
    structureFill = await seedConcreteStructureStubs(
      rootPath,
      options.structureProfileId ?? DEFAULT_PROFILE_ID,
    );
  }

  return {
    rootPath,
    gitDetected,
    repaired: Boolean(options.repair && dirExists),
    agentsMdAction,
    cursorRuleAction,
    gitignoreAdceAction,
    structureFill,
    created: {
      adceDir: !dirExists,
      config: createdConfig,
      database: createdDatabase,
      agentsMd: agentsMdAction === "created",
      artifactsReadme: createdArtifactsReadme,
    },
  };
}
