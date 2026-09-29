/** Convert a single glob (no top-level `{a,b}`) to a regex body. */
const globToRegexBody = (glob: string): string =>
  glob
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "(?:.*/)?")
    .replace(/\/\*\*/g, "(?:/.*)?")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");

/**
 * Minimal glob matcher for structure profiles (`*`, `**`, `{a,b}`).
 * Brace alternatives are each converted as their own glob (so `**` inside `{}` works).
 */
export const matchGlob = (filePath: string, glob: string): boolean => {
  const norm = filePath.replace(/\\/g, "/");
  let pattern = glob.replace(/\\/g, "/");

  const braces: string[] = [];
  pattern = pattern.replace(/\{([^}]+)\}/g, (_, alt: string) => {
    const idx = braces.length;
    const options = alt
      .split(",")
      .map((s: string) => s.trim())
      .map((s: string) => globToRegexBody(s))
      .join("|");
    braces.push(`(${options})`);
    return `__BRACE${idx}__`;
  });

  pattern = globToRegexBody(pattern);

  for (let i = 0; i < braces.length; i += 1) {
    pattern = pattern.replace(`__BRACE${i}__`, braces[i]!);
  }

  return new RegExp(`^${pattern}$`, "i").test(norm);
};
