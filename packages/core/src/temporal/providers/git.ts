import { getPathCommitHistory } from "@adce/git";
import type { TemporalEvent } from "@adce/shared";
import type { TemporalProviderFn } from "./provider.js";

export const gitTemporalProvider: TemporalProviderFn = async ({
  rootPath,
  artifact,
}) => {
  if (!artifact.path) return [];

  const commits = await getPathCommitHistory(rootPath, artifact.path, 10);
  return commits.map(
    (commit): TemporalEvent => ({
      at: new Date(commit.date).toISOString(),
      provider: "git",
      kind: "GIT_COMMIT",
      summary: commit.message.split("\n")[0] ?? commit.message,
      confidence: "CONFIRMED",
      evidence: `${commit.hash.slice(0, 8)} by ${commit.author}`,
    }),
  );
};
