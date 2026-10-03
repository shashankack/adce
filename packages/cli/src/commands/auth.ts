import { exec } from "node:child_process";
import { platform } from "node:os";
import {
  AdceNotInitializedError,
  clearCredentials,
  credentialsPath,
  readCredentials,
  writeCredentials,
} from "@adce/core";
import { log } from "../ui/logger.js";

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const openBrowser = (url: string): void => {
  const cmd =
    platform() === "win32"
      ? `start "" "${url}"`
      : platform() === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    /* ignore open failures — user can paste URL */
  });
};

const mlBaseUrl = (explicit?: string): string => {
  const url = (explicit ?? process.env.ADCE_ML_URL ?? "").replace(/\/+$/, "");
  if (!url) {
    throw new Error(
      "Set ADCE_ML_URL to your ML server (e.g. http://127.0.0.1:8000)",
    );
  }
  return url;
};

export const runLogin = async (opts: { url?: string } = {}): Promise<void> => {
  const baseUrl = mlBaseUrl(opts.url);
  log.step(`Logging in via GitHub device flow (${baseUrl})…`);

  const codeRes = await fetch(`${baseUrl}/v1/auth/device/code`, {
    method: "POST",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!codeRes.ok) {
    const detail = await codeRes.text();
    throw new Error(
      `Device code failed (${codeRes.status}): ${detail || codeRes.statusText}`,
    );
  }
  const started = (await codeRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    interval?: number;
    expires_in?: number;
  };

  const verifyUrl =
    started.verification_uri_complete ?? started.verification_uri;
  console.log("");
  console.log(`  Open:  ${verifyUrl}`);
  console.log(`  Code:  ${started.user_code}`);
  console.log("");
  openBrowser(verifyUrl);
  log.step("Waiting for GitHub authorization…");

  const deadline = Date.now() + (started.expires_in ?? 900) * 1000;
  let intervalMs = Math.max(5, started.interval ?? 5) * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const poll = await fetch(`${baseUrl}/v1/auth/device/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ device_code: started.device_code }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!poll.ok) {
      const detail = await poll.text();
      throw new Error(`Token poll failed (${poll.status}): ${detail}`);
    }
    const body = (await poll.json()) as {
      status: string;
      interval?: number;
      token?: string;
      expires_at?: string;
      login?: string;
      provider?: string;
      error?: string;
    };

    if (body.status === "pending") continue;
    if (body.status === "slow_down") {
      intervalMs = Math.max(intervalMs + 1000, (body.interval ?? 5) * 1000);
      continue;
    }
    if (body.status === "expired") {
      throw new Error("Device code expired — run `adce login` again.");
    }
    if (body.status === "denied") {
      throw new Error("GitHub authorization denied.");
    }
    if (body.status === "error") {
      throw new Error(body.error ?? "GitHub auth error");
    }
    if (body.status === "success" && body.token && body.login && body.expires_at) {
      const file = await writeCredentials({
        mlUrl: baseUrl,
        token: body.token,
        login: body.login,
        expiresAt: body.expires_at,
        provider: body.provider ?? "github",
      });
      log.ok(`Logged in as ${body.login} (${body.provider ?? "github"})`);
      log.step(`Credentials saved → ${file}`);
      return;
    }
  }

  throw new Error("Timed out waiting for GitHub authorization.");
};

export const runWhoami = async (opts: { url?: string } = {}): Promise<void> => {
  const creds = await readCredentials();
  const envToken = (process.env.ADCE_ML_TOKEN ?? "").trim();

  if (envToken) {
    const baseUrl = mlBaseUrl(opts.url ?? creds?.mlUrl);
    const res = await fetch(`${baseUrl}/v1/auth/whoami`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${envToken}`,
        "x-adce-token": envToken,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      log.error(`whoami failed (${res.status}) with ADCE_ML_TOKEN`);
      process.exitCode = 1;
      return;
    }
    const body = (await res.json()) as { login?: string; provider?: string };
    log.ok(`${body.login ?? "admin"}  provider=${body.provider ?? "token"}  (env ADCE_ML_TOKEN)`);
    return;
  }

  if (!creds) {
    log.error("Not logged in. Run `adce login` (or set ADCE_ML_TOKEN).");
    process.exitCode = 1;
    return;
  }

  const baseUrl = mlBaseUrl(opts.url ?? creds.mlUrl);
  const res = await fetch(`${baseUrl}/v1/auth/whoami`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${creds.token}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    log.error(
      `whoami failed (${res.status}). Token may be expired — run \`adce login\` again.`,
    );
    process.exitCode = 1;
    return;
  }
  const body = (await res.json()) as { login?: string; provider?: string };
  console.log(`Login:     ${body.login ?? creds.login}`);
  console.log(`Provider:  ${body.provider ?? creds.provider}`);
  console.log(`Expires:   ${creds.expiresAt}`);
  console.log(`ML URL:    ${creds.mlUrl}`);
  console.log(`Creds:     ${credentialsPath()}`);
};

export const runLogout = async (): Promise<void> => {
  const existed = await readCredentials();
  await clearCredentials();
  if (existed) {
    log.ok(`Logged out (${existed.login}). Removed ${credentialsPath()}`);
  } else {
    log.step("Already logged out (no credentials file).");
  }
};

export const handleAuthError = (error: unknown): boolean => {
  if (error instanceof AdceNotInitializedError) {
    log.error(error.message);
    process.exitCode = 1;
    return true;
  }
  if (error instanceof Error) {
    log.error(error.message);
    process.exitCode = 1;
    return true;
  }
  return false;
};
