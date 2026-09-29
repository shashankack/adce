/**
 * v0.7 analyze ablation: rule-only vs ML/hybrid on fixture ground truth.
 *
 * Usage (repo root):
 *   pnpm bench:analyze
 *   ADCE_ML_URL=http://127.0.0.1:8000 pnpm bench:analyze
 */
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeProject,
  buildProjectContext,
  checkProjectStructure,
  initializeProject,
  listProjectConflicts,
  scanProject,
} from "../packages/core/src/index.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const fixturesRoot = path.join(repoRoot, "fixtures");
const groundTruthDir = path.join(here, "ground-truth");
const resultsDir = path.join(here, "results");
const goldenDir = path.join(here, "golden");

interface GroundTruth {
  fixture: string;
  profile?: string;
  description?: string;
  expectedConflictCategories: string[];
}

interface ModeResult {
  mode: "rule" | "hybrid";
  engine: string;
  elapsedMs: number;
  suggestionCount: number;
  mlSuggestionCount: number;
  heuristicSuggestionCount: number;
  notes: string[];
  categoryRecall: number | null;
  categoryPrecision: number | null;
  detectedCategories: string[];
  structureMissing: number | null;
  /** Fraction of mustRead items that mention an open conflict path (brief adherence proxy). */
  briefCautionCoverage: number | null;
  mlLift: number | null;
}

const loadGroundTruth = async (): Promise<GroundTruth[]> => {
  const files = (await readdir(groundTruthDir))
    .filter((f) => f.endsWith(".json"))
    .sort();
  const out: GroundTruth[] = [];
  for (const f of files) {
    const raw = await readFile(path.join(groundTruthDir, f), "utf8");
    out.push(JSON.parse(raw) as GroundTruth);
  }
  return out;
};

const categoryRecall = (
  detected: string[],
  expected: string[],
): number | null => {
  if (expected.length === 0) return null;
  const set = new Set(detected);
  const hit = expected.filter((c) => set.has(c)).length;
  return hit / expected.length;
};

/** Among detected categories, fraction that were expected (when expected non-empty). */
const categoryPrecision = (
  detected: string[],
  expected: string[],
): number | null => {
  if (expected.length === 0 || detected.length === 0) return null;
  const set = new Set(expected);
  const hit = detected.filter((c) => set.has(c)).length;
  return hit / detected.length;
};

const runMode = async (
  root: string,
  mode: "rule" | "hybrid",
  expected: string[],
): Promise<ModeResult> => {
  const started = Date.now();
  const report = await analyzeProject(root, {
    useCache: false,
    apply: false,
    deep: true,
    skipMl: mode === "rule",
    mlScript: null,
    mlUrl: mode === "rule" ? null : process.env.ADCE_ML_URL,
  });
  const elapsedMs = Date.now() - started;

  const conflicts = await listProjectConflicts(root, { includeClosed: false });
  const detectedCategories = [
    ...new Set(conflicts.map((c) => c.category)),
  ].sort();

  let briefCautionCoverage: number | null = null;
  try {
    const ctx = await buildProjectContext(root, {
      task: "fix conflicts from analyze",
      pack: mode === "hybrid",
      mlUrl: mode === "rule" ? null : process.env.ADCE_ML_URL,
    });
    if (ctx.brief.caution.length === 0) {
      briefCautionCoverage = conflicts.length === 0 ? 1 : 0;
    } else if (conflicts.length === 0) {
      briefCautionCoverage = 0;
    } else {
      const cautionIds = new Set(ctx.brief.caution.map((c) => c.conflictId));
      const covered = conflicts.filter((c) => cautionIds.has(c.id)).length;
      briefCautionCoverage = covered / conflicts.length;
    }
  } catch {
    briefCautionCoverage = null;
  }

  return {
    mode,
    engine: report.engine,
    elapsedMs,
    suggestionCount: report.suggestions.length,
    mlSuggestionCount: report.suggestions.filter((s) => s.source === "ml")
      .length,
    heuristicSuggestionCount: report.suggestions.filter(
      (s) => s.source === "heuristic",
    ).length,
    notes: report.notes,
    categoryRecall: categoryRecall(detectedCategories, expected),
    categoryPrecision: categoryPrecision(detectedCategories, expected),
    detectedCategories,
    structureMissing: null,
    briefCautionCoverage,
    mlLift: null,
  };
};

const runScenario = async (gt: GroundTruth) => {
  const fixturePath = path.join(fixturesRoot, gt.fixture);
  const tmp = await mkdtemp(path.join(os.tmpdir(), `adce-bench-${gt.fixture}-`));
  try {
    await cp(fixturePath, tmp, { recursive: true });
    await initializeProject(tmp);
    await scanProject({ rootPath: tmp, full: true });

    let structureMissing: number | null = null;
    if (gt.profile) {
      const structure = await checkProjectStructure(tmp, {
        profileId: gt.profile,
      });
      structureMissing = structure.summary.missing;
    }

    const rule = await runMode(tmp, "rule", gt.expectedConflictCategories);
    const hybrid = await runMode(tmp, "hybrid", gt.expectedConflictCategories);
    rule.structureMissing = structureMissing;
    hybrid.structureMissing = structureMissing;
    hybrid.mlLift =
      hybrid.mlSuggestionCount - rule.mlSuggestionCount;

    return {
      fixture: gt.fixture,
      description: gt.description ?? "",
      expectedConflictCategories: gt.expectedConflictCategories,
      modes: { rule, hybrid },
    };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
};

const main = async (): Promise<void> => {
  const scenarios = await loadGroundTruth();
  const generatedAt = new Date().toISOString();
  const mlUrl = process.env.ADCE_ML_URL ?? null;

  const results = [];
  for (const gt of scenarios) {
    console.log(`→ Scenario ${gt.fixture}`);
    results.push(await runScenario(gt));
  }

  const payload = {
    generatedAt,
    mlUrl,
    lock: "rule vs hybrid (heuristic+ML when ADCE_ML_URL reachable)",
    metrics: [
      "categoryRecall",
      "categoryPrecision",
      "mlLift",
      "briefCautionCoverage",
      "elapsedMs",
    ],
    scenarios: results,
  };

  await mkdir(resultsDir, { recursive: true });
  const outName = `analyze-${generatedAt.replace(/[:.]/g, "-")}.json`;
  const outPath = path.join(resultsDir, outName);
  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(
    path.join(resultsDir, "latest.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const hybridMl = results.reduce(
    (n, s) => n + s.modes.hybrid.mlSuggestionCount,
    0,
  );
  if (mlUrl && hybridMl > 0) {
    await mkdir(goldenDir, { recursive: true });
    const goldenPath = path.join(goldenDir, "analyze-hybrid-latest.json");
    await writeFile(goldenPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Golden (ML-up): ${goldenPath}`);
  }

  console.log("");
  console.log(
    "| Fixture | Mode | Engine | Recall | Prec | ML lift | Brief | Suggestions (h/ml/total) | ms |",
  );
  console.log(
    "|---------|------|--------|--------|------|---------|-------|--------------------------|----|",
  );
  for (const s of results) {
    for (const mode of ["rule", "hybrid"] as const) {
      const m = s.modes[mode];
      const recall =
        m.categoryRecall == null ? "n/a" : m.categoryRecall.toFixed(2);
      const prec =
        m.categoryPrecision == null ? "n/a" : m.categoryPrecision.toFixed(2);
      const lift = m.mlLift == null ? "—" : String(m.mlLift);
      const brief =
        m.briefCautionCoverage == null
          ? "n/a"
          : m.briefCautionCoverage.toFixed(2);
      console.log(
        `| ${s.fixture} | ${mode} | ${m.engine} | ${recall} | ${prec} | ${lift} | ${brief} | ${m.heuristicSuggestionCount}/${m.mlSuggestionCount}/${m.suggestionCount} | ${m.elapsedMs} |`,
      );
    }
  }
  console.log("");
  console.log(`Wrote ${outPath}`);
  console.log(`Also wrote ${path.join(resultsDir, "latest.json")}`);
  if (!mlUrl) {
    console.log(
      "Note: ADCE_ML_URL unset — hybrid arm falls back to heuristic-only (still valid ablation).",
    );
  }
};

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
