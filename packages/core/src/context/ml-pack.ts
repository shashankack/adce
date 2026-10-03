import type { ContextBrief } from "@adce/shared";
import { mlRequestHeaders } from "../analyze/ml-headers.js";

export interface PackRequest {
  task?: string | null;
  brief: ContextBrief;
}

export interface PackResponse {
  brief: ContextBrief;
  notes: string[];
  engine: string;
}

/** POST /v1/pack — reorder/annotate a local brief. Returns null if ML down. */
export const packContextBrief = async (
  payload: PackRequest,
  opts?: { baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<PackResponse | null> => {
  const baseUrl = opts?.baseUrl ?? process.env.ADCE_ML_URL;
  if (!baseUrl) return null;
  const fetchFn = opts?.fetchImpl ?? globalThis.fetch;
  if (!fetchFn) return null;

  try {
    const res = await fetchFn(`${baseUrl.replace(/\/+$/, "")}/v1/pack`, {
      method: "POST",
      headers: mlRequestHeaders(),
      body: JSON.stringify({
        task: payload.task ?? null,
        brief: payload.brief,
      }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PackResponse;
  } catch {
    return null;
  }
};
