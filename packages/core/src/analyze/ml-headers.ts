import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const credentialsPath = (): string =>
  path.join(
    process.env.ADCE_HOME?.trim() || path.join(os.homedir(), ".adce"),
    "credentials.json",
  );

const tokenFromCredentialsFile = (): string | null => {
  try {
    const raw = readFileSync(credentialsPath(), "utf8");
    const parsed = JSON.parse(raw) as {
      token?: string;
      expiresAt?: string;
    };
    if (!parsed.token) return null;
    if (parsed.expiresAt) {
      const exp = Date.parse(parsed.expiresAt);
      if (!Number.isNaN(exp) && Date.now() >= exp - 60_000) return null;
    }
    return parsed.token;
  } catch {
    return null;
  }
};

/** Bearer for ML calls: ADCE_ML_TOKEN env (admin) wins, else ~/.adce/credentials.json */
export const resolveMlAuthToken = (): string | null => {
  const env = (process.env.ADCE_ML_TOKEN ?? "").trim();
  if (env) return env;
  return tokenFromCredentialsFile();
};

/** Shared headers for ADCE ML HTTP calls (optional Bearer auth). */
export const mlRequestHeaders = (
  extra?: Record<string, string>,
): Record<string, string> => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    ...extra,
  };
  const token = resolveMlAuthToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
    headers["x-adce-token"] = token;
  }
  return headers;
};
