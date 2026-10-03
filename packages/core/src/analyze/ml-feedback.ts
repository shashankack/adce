import { mlRequestHeaders } from "./ml-headers.js";

export type FeedbackAction = "confirm" | "reject" | "resolve" | "ignore";

export interface ConflictFeedbackPayload {
  action: FeedbackAction;
  conflictId: string;
  category?: string;
  severity?: string;
  confidence?: string;
  summary?: string;
  sourceArtifactId?: string | null;
  targetArtifactId?: string | null;
  projectHash?: string | null;
  /** Optional 0–1 score from last ML suggestion (LinUCB context). */
  score?: number | null;
}

export const postConflictFeedback = async (
  payload: ConflictFeedbackPayload,
  opts?: { baseUrl?: string; baseURL?: string; fetchImpl?: typeof fetch },
): Promise<boolean> => {
  const baseUrl =
    opts?.baseUrl ?? opts?.baseURL ?? process.env.ADCE_ML_URL;
  if (!baseUrl) return false;
  const fetchFn = opts?.fetchImpl ?? globalThis.fetch;
  if (!fetchFn) return false;
  try {
    const res = await fetchFn(`${baseUrl.replace(/\/+$/, "")}/v1/feedback`, {
      method: "POST",
      headers: mlRequestHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
};
