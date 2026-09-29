import type { AnalyzeRequest, AnalyzeSuggestion } from "@adce/shared";
import { filterAnalyzeRequestForMl } from "./privacy.js";

export const runMlHttpAnalyze = async (
  req: AnalyzeRequest,
  opts: {
    baseUrl: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  },
): Promise<AnalyzeSuggestion[] | null> => {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch;
  if (!fetchFn) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  const url = `${opts.baseUrl.replace(/\/+$/, "")}/v1/analyze`;

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(filterAnalyzeRequestForMl(req)),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const parsed = (await res.json()) as { suggestions: AnalyzeSuggestion[] };
    return parsed.suggestions ?? [];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
