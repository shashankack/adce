/**
 * Hard-delete every relationship in the current project's .adce DB
 * (including REJECTED tombstones). Re-run `adce scan` / `adce relate` after.
 *
 * Usage (from an ADCE project root, or this repo):
 *   pnpm reset:relationships
 *   pnpm reset:relationships -- --yes
 *   pnpm reset:relationships -- --root C:\path\to\project
 */
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import {
  AdceNotInitializedError,
  findAdceRoot,
  resetProjectRelationships,
} from "../packages/core/src/index.ts";

const args = process.argv.slice(2);
const yes = args.includes("--yes") || args.includes("-y");
const rootFlag = args.findIndex((a) => a === "--root");
const cwd =
  rootFlag >= 0 && args[rootFlag + 1]
    ? path.resolve(args[rootFlag + 1]!)
    : process.cwd();

const confirm = async (rootPath: string): Promise<boolean> => {
  if (yes) return true;
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (
      await rl.question(
        `Delete ALL relationships under ${rootPath}? [y/N]: `,
      )
    )
      .trim()
      .toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
};

const main = async (): Promise<void> => {
  const { rootPath } = await findAdceRoot(cwd);
  if (!(await confirm(rootPath))) {
    console.log("Aborted.");
    process.exitCode = 1;
    return;
  }
  const removed = await resetProjectRelationships(rootPath);
  console.log(`Removed ${removed} relationship(s) from ${rootPath}`);
  console.log("Next: adce scan --full && adce relate");
};

main().catch((error: unknown) => {
  if (error instanceof AdceNotInitializedError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
