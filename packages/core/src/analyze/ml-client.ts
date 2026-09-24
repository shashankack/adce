// packages/core/src/analyze/ml-client.ts
import { spawn } from "node:child_process";
import type { AnalyzeRequest, AnalyzeSuggestion } from "@adce/shared";

export const runMlAnalyze = async (
  req: AnalyzeRequest,
  opts: { pythonBin?: string; scriptPath: string; timeoutMs?: number },
): Promise<AnalyzeSuggestion[] | null> => {
  const bin = opts.pythonBin ?? process.env.ADCE_PYTHON ?? "python";
  const timeoutMs = opts.timeoutMs ?? 60_000;

  return new Promise((resolve) => {
    const child = spawn(bin, [opts.scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve(null);
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += String(d)));
    child.stderr.on("data", (d) => (stderr += String(d)));
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null); // Python missing → caller falls back
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return resolve(null);
      try {
        const parsed = JSON.parse(stdout) as {
          suggestions?: AnalyzeSuggestion[];
        };
        resolve(parsed.suggestions ?? []);
      } catch {
        resolve(null);
      }
    });

    child.stdin.write(JSON.stringify(req));
    child.stdin.end();
  });
};
