import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearCredentials,
  isCredentialExpired,
  mlRequestHeaders,
  readCredentials,
  resolveMlAuthToken,
  writeCredentials,
} from "@adce/core";

const temps: string[] = [];
const prevHome = process.env.ADCE_HOME;
const prevToken = process.env.ADCE_ML_TOKEN;

afterEach(async () => {
  if (prevHome === undefined) delete process.env.ADCE_HOME;
  else process.env.ADCE_HOME = prevHome;
  if (prevToken === undefined) delete process.env.ADCE_ML_TOKEN;
  else process.env.ADCE_ML_TOKEN = prevToken;
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("ML credentials + headers", () => {
  it("prefers ADCE_ML_TOKEN env over credentials file", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "adce-home-"));
    temps.push(home);
    process.env.ADCE_HOME = home;
    await writeCredentials({
      mlUrl: "http://ml.test",
      token: "file-token",
      login: "alice",
      expiresAt: "2030-01-01T00:00:00.000Z",
      provider: "github",
    });
    process.env.ADCE_ML_TOKEN = "env-admin";
    expect(resolveMlAuthToken()).toBe("env-admin");
    const headers = mlRequestHeaders();
    expect(headers.authorization).toBe("Bearer env-admin");
  });

  it("loads non-expired credentials when env unset", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "adce-home-"));
    temps.push(home);
    process.env.ADCE_HOME = home;
    delete process.env.ADCE_ML_TOKEN;
    await writeCredentials({
      mlUrl: "http://ml.test",
      token: "jwt-from-file",
      login: "bob",
      expiresAt: "2030-01-01T00:00:00.000Z",
      provider: "github",
    });
    expect(resolveMlAuthToken()).toBe("jwt-from-file");
    const creds = await readCredentials();
    expect(creds?.login).toBe("bob");
    expect(isCredentialExpired(creds!)).toBe(false);
    await clearCredentials();
    expect(await readCredentials()).toBeNull();
  });

  it("ignores expired credentials", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "adce-home-"));
    temps.push(home);
    process.env.ADCE_HOME = home;
    delete process.env.ADCE_ML_TOKEN;
    await mkdir(home, { recursive: true });
    await writeFile(
      path.join(home, "credentials.json"),
      JSON.stringify({
        mlUrl: "http://ml.test",
        token: "old",
        login: "x",
        expiresAt: "2020-01-01T00:00:00.000Z",
        provider: "github",
      }),
    );
    expect(resolveMlAuthToken()).toBeNull();
  });
});
