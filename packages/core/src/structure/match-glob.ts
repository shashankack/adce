/** Minimal glob matcher for structure profiles (`*`, `**`, `{a,b}`). */
export const matchGlob = (filePath: string, glob: string): boolean => {
  const norm = filePath.replace(/\\/g, "/");
  let pattern = glob.replace(/\\/g, "/");

  const braces: string[] = [];
  pattern = pattern.replace(/\{([^}]+)\}/g, (_, alt: string) => {
    const idx = braces.length;
    braces.push(
      `(${alt
        .split(",")
        .map((s: string) => s.trim())
        .join("|")})`,
    );
    return `__BRACE${idx}__`;
  });

  pattern = pattern
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "(?:.*/)?")
    .replace(/\/\*\*/g, "(?:/.*)?")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");

  for (let i = 0; i < braces.length; i += 1) {
    pattern = pattern.replace(`__BRACE${i}__`, braces[i]!);
  }

  return new RegExp(`^${pattern}$`, "i").test(norm);
};
