import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { adceDir } from "../project/paths.js";

export interface ContextTokenMetricEvent {
  ts: string;
  rootPath: string;
  task: string | null;
  compact: boolean;
  packUsed: boolean;
  mlUrlSet: boolean;
  tokensFull: number;
  tokensDelivered: number;
  tokensSaved: number;
  savingsPercent: number;
  /** What size would be if --compact were applied. */
  tokensIfCompact: number;
  potentialSaved: number;
  potentialPercent: number;
  mustRead: number;
  caution: number;
  trustOrder: number;
  alsoRelevant: number;
  estimator: "chars_div_4";
}

export const contextTokenLogPath = (rootPath: string): string =>
  path.join(adceDir(rootPath), "metrics", "context-tokens.jsonl");

/** Append one privacy-safe token metric row. Never throws to callers. */
export const appendContextTokenMetric = async (
  rootPath: string,
  event: Omit<ContextTokenMetricEvent, "ts" | "rootPath" | "estimator">,
): Promise<string | null> => {
  const record: ContextTokenMetricEvent = {
    ts: new Date().toISOString(),
    rootPath,
    estimator: "chars_div_4",
    ...event,
  };
  try {
    const file = contextTokenLogPath(rootPath);
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
    return file;
  } catch {
    return null;
  }
};
