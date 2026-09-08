import { access, stat } from "node:fs/promises";
import path from "node:path";

export interface RootEvidence {
  directory: string;
  marker: string;
  weight: number;
}

export interface ProjectRootDiscovery {
  cwd: string;
  detectedRoot: string | null;
  evidence: RootEvidence[];
  sameAsCwd: boolean;
}

const MARKERS: { name: string; weight: number }[] = [
  { name: ".git", weight: 100 },
  { name: "pnpm-workspace.yaml", weight: 90 },
  { name: "lerna.json", weight: 85 },
  { name: "package.json", weight: 70 },
  { name: "tsconfig.json", weight: 65 },
  { name: "yarn.lock", weight: 60 },
  { name: "bun.lockb", weight: 70 },
  { name: "cargo.toml", weight: 70 },
  { name: "go.mod", weight: 70 },
  { name: "pyproject.toml", weight: 70 },
  { name: "requirements.txt", weight: 70 },
  { name: "pom.xml", weight: 70 },
  { name: "composer.json", weight: 70 },
  { name: "build.gradle", weight: 70 },
];

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const collectEvidence = async (directory: string): Promise<RootEvidence[]> => {
  const hits: RootEvidence[] = [];

  for (const marker of MARKERS) {
    const full = path.join(directory, marker.name);
    if (!(await pathExists(full))) continue;
    if (marker.name === ".git") {
      const info = await stat(full);
      if (!info.isDirectory() && !info.isFile()) continue;
    }

    hits.push({ directory, marker: marker.name, weight: marker.weight });
  }
  return hits;
};

const score = (evidence: RootEvidence[]): number => {
  return evidence.reduce((sum, e) => sum + e.weight, 0);
};

export const discoverProjectRoot = async (
  startDir: string,
): Promise<ProjectRootDiscovery> => {
  const cwd = path.resolve(startDir);

  let current = cwd;
  let bestDir: string | null = null;
  let bestScore = 0;
  let bestEvidence: RootEvidence[] = [];

  while (true) {
    const evidence = await collectEvidence(current);
    const currentScore = score(evidence);

    if (currentScore > 0 && currentScore >= bestScore) {
      bestScore = currentScore;
      bestDir = current;
      bestEvidence = evidence;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const detectedRoot = bestDir;
  const sameAsCwd =
    detectedRoot === null ? true : path.resolve(detectedRoot) === cwd;

  return {
    cwd,
    detectedRoot,
    evidence: bestEvidence,
    sameAsCwd,
  };
};
