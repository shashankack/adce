import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const hashFile = async (absolutePath: string): Promise<string> => {
  const buf = await readFile(absolutePath);
  return createHash("sha256").update(buf).digest("hex");
};
