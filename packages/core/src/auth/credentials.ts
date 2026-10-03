import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface AdceCredentials {
  mlUrl: string;
  token: string;
  login: string;
  expiresAt: string;
  provider: string;
}

export const adceHomeDir = (): string =>
  process.env.ADCE_HOME?.trim() || path.join(os.homedir(), ".adce");

export const credentialsPath = (): string =>
  path.join(adceHomeDir(), "credentials.json");

export const readCredentials = async (): Promise<AdceCredentials | null> => {
  try {
    const raw = await readFile(credentialsPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AdceCredentials>;
    if (
      !parsed.token ||
      !parsed.mlUrl ||
      !parsed.login ||
      !parsed.expiresAt
    ) {
      return null;
    }
    return {
      mlUrl: String(parsed.mlUrl),
      token: String(parsed.token),
      login: String(parsed.login),
      expiresAt: String(parsed.expiresAt),
      provider: String(parsed.provider ?? "github"),
    };
  } catch {
    return null;
  }
};

export const isCredentialExpired = (creds: AdceCredentials): boolean => {
  const exp = Date.parse(creds.expiresAt);
  if (Number.isNaN(exp)) return true;
  // 60s skew
  return Date.now() >= exp - 60_000;
};

export const writeCredentials = async (
  creds: AdceCredentials,
): Promise<string> => {
  const dir = adceHomeDir();
  await mkdir(dir, { recursive: true });
  const file = credentialsPath();
  await writeFile(file, `${JSON.stringify(creds, null, 2)}\n`, "utf8");
  try {
    await chmod(file, 0o600);
  } catch {
    /* Windows may ignore mode */
  }
  return file;
};

export const clearCredentials = async (): Promise<boolean> => {
  try {
    await rm(credentialsPath(), { force: true });
    return true;
  } catch {
    return false;
  }
};

/** Sync-friendly token for ML headers (env wins). */
export const resolveMlBearerToken = async (): Promise<string | null> => {
  const env = (process.env.ADCE_ML_TOKEN ?? "").trim();
  if (env) return env;
  const creds = await readCredentials();
  if (!creds || isCredentialExpired(creds)) return null;
  return creds.token;
};
