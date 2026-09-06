import path from "node:path";
import { ADCE_AGENTS_FILE, ADCE_DB_FILE, ADCE_DIR } from "@adce/shared";

export const adceDir = (rootPath: string): string =>
  path.join(rootPath, ADCE_DIR);

export function dbPath(rootPath: string): string {
  return path.join(rootPath, ADCE_DIR, ADCE_DB_FILE);
}
export function agentsPath(rootPath: string): string {
  return path.join(rootPath, ADCE_AGENTS_FILE);
}
export function artifactsDir(rootPath: string): string {
  return path.join(rootPath, ADCE_DIR, "artifacts");
}
export function cacheDir(rootPath: string): string {
  return path.join(rootPath, ADCE_DIR, "cache");
}
export function logsDir(rootPath: string): string {
  return path.join(rootPath, ADCE_DIR, "logs");
}
