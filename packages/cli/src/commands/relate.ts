import {
  AdceNotInitializedError,
  acceptRelationshipSuggestion,
  rejectRelationshipSuggestion,
  resetProjectRelationships,
  suggestProjectRelationships,
} from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";
import {
  createRelateReadline,
  promptRelationshipSuggestion,
} from "../ui/relate-prompt.js";

export interface RunRelateOptions {
  limit?: number;
  skipMl?: boolean;
  /** Non-interactive: print suggestions only */
  list?: boolean;
  /** Hard-delete every relationship (incl. REJECTED) */
  reset?: boolean;
  /** Skip confirm for --reset */
  yes?: boolean;
}

export const runRelate = async (
  cwd = process.cwd(),
  options: RunRelateOptions = {},
): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);

    if (options.reset) {
      if (!options.yes) {
        const rl = createRelateReadline();
        try {
          const answer = (
            await rl.question(
              `Delete ALL relationships under ${rootPath}? [y/N]: `,
            )
          )
            .trim()
            .toLowerCase();
          if (answer !== "y" && answer !== "yes") {
            log.warn("Reset aborted.");
            return;
          }
        } finally {
          rl.close();
        }
      }
      const removed = await resetProjectRelationships(rootPath);
      log.ok(`Removed ${removed} relationship(s).`);
      log.step("Next: adce scan --full && adce relate");
      return;
    }

    log.step("Gathering relationship suggestions (MiniLM deep + heuristics)…");

    const { suggestions, engine } = await suggestProjectRelationships(rootPath, {
      limit: options.limit ?? 24,
      skipMl: options.skipMl,
    });

    if (suggestions.length === 0) {
      log.ok("No relationship suggestions. Graph may already be covered.");
      return;
    }

    log.step(
      `${suggestions.length} suggestion(s) via ${engine}` +
        (process.env.ADCE_ML_URL ? "" : " (set ADCE_ML_URL for MiniLM)"),
    );

    if (options.list) {
      for (const s of suggestions) {
        console.log(
          `${s.score.toFixed(2)} ${s.sourcePath} --${s.type}--> ${s.targetPath}  (${s.source})`,
        );
      }
      return;
    }

    let accepted = 0;
    let rejected = 0;
    let skipped = 0;

    const rl = createRelateReadline();
    try {
      for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i]!;
        const choice = await promptRelationshipSuggestion(
          s,
          i + 1,
          suggestions.length,
          rl,
        );

        if (choice === "quit") {
          log.warn("Relate stopped early.");
          break;
        }
        if (choice === "skip") {
          skipped += 1;
          continue;
        }
        if (choice === "yes") {
          await acceptRelationshipSuggestion(rootPath, s);
          accepted += 1;
          log.ok(`Linked ${s.sourcePath} --${s.type}--> ${s.targetPath}`);
          continue;
        }
        if (choice === "no") {
          await rejectRelationshipSuggestion(rootPath, s);
          rejected += 1;
          log.step(`Rejected suggestion ${s.sourcePath} ↔ ${s.targetPath}`);
        }
      }
    } finally {
      rl.close();
    }

    console.log("");
    log.ok(
      `Relate summary: ${accepted} accepted, ${rejected} rejected, ${skipped} skipped`,
    );
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
};
