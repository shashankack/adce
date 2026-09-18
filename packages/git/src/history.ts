import { simpleGit } from "simple-git";
import { isGitRepository } from "./detect.js";

export interface GitCommitEvent {
  hash: string;
  date: string;
  message: string;
  author: string;
}

/** Best-effort file history. Returns [] when Git is absent or path has no log. */
export const getPathCommitHistory = async (
  rootPath: string,
  relativePath: string,
  limit = 10,
): Promise<GitCommitEvent[]> => {
  if (!(await isGitRepository(rootPath))) return [];
  if (!relativePath) return [];

  try {
    const git = simpleGit(rootPath);
    const log = await git.log({
      file: relativePath.replace(/\\/g, "/"),
      maxCount: limit,
      strictDate: true,
    });
    return log.all.map((entry) => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author: entry.author_name,
    }));
  } catch {
    return [];
  }
};
