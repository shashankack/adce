import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  appendContextTokenMetric,
  contextTokenLogPath,
} from "../src/context/token-metrics-log.js";

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("token metrics log", () => {
  it("appends jsonl under .adce/metrics", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "adce-metrics-"));
    temps.push(root);
    await appendContextTokenMetric(root, {
      task: "demo",
      compact: true,
      packUsed: false,
      mlUrlSet: false,
      tokensFull: 120,
      tokensDelivered: 40,
      tokensSaved: 80,
      savingsPercent: 66.7,
      tokensIfCompact: 40,
      potentialSaved: 80,
      potentialPercent: 66.7,
      mustRead: 3,
      caution: 1,
      trustOrder: 2,
      alsoRelevant: 0,
    });
    const file = contextTokenLogPath(root);
    const raw = await readFile(file, "utf8");
    const row = JSON.parse(raw.trim()) as { tokensSaved: number; task: string };
    expect(row.tokensSaved).toBe(80);
    expect(row.task).toBe("demo");
  });
});
