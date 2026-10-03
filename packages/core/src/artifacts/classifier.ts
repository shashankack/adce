import path from "node:path";
import type { ArtifactType } from "@adce/shared";

/**
 * Deterministic path/name heuristics only — no AST, no ML.
 */
export function classifyArtifact(relativePath: string): ArtifactType {
  const normalized = relativePath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized).toLowerCase();
  const parts = normalized.toLowerCase().split("/");

  if (
    base.endsWith(".test.ts") ||
    base.endsWith(".test.tsx") ||
    base.endsWith(".test.js") ||
    base.endsWith(".spec.ts") ||
    base.endsWith(".spec.tsx") ||
    base.endsWith(".spec.js") ||
    base.endsWith("_test.go") ||
    (base.startsWith("test_") && base.endsWith(".py")) ||
    base.endsWith("_test.py") ||
    parts.includes("__tests__") ||
    parts.includes("tests") ||
    parts.includes("test")
  ) {
    return "TEST";
  }

  if (
    base === "openapi.yaml" ||
    base === "openapi.yml" ||
    base === "openapi.json" ||
    base === "swagger.yaml" ||
    base === "swagger.yml" ||
    base === "swagger.json"
  ) {
    return "API_SPEC";
  }

  if (
    base.endsWith(".schema.json") ||
    base === "schema.prisma" ||
    base.endsWith(".prisma") ||
    (parts.includes("schemas") &&
      (base.endsWith(".sql") || base.endsWith(".json")))
  ) {
    return "SCHEMA";
  }

  if (parts.includes("migrations") || /_v\d+/.test(base)) {
    if (base.endsWith(".sql") || base.endsWith(".prisma")) {
      return "MIGRATION";
    }
  }

  if (
    base === "package.json" ||
    base === "pnpm-lock.yaml" ||
    base === "package-lock.json" ||
    base === "yarn.lock" ||
    base === "bun.lock" ||
    base === "bun.lockb" ||
    base === "requirements.txt" ||
    base === "pyproject.toml" ||
    base === "cargo.toml" ||
    base === "go.mod"
  ) {
    return "DEPENDENCY_MANIFEST";
  }

  if (parts.includes(".github") && parts.includes("workflows")) {
    return "CI";
  }

  // Tooling / bundler / framework config → BUILD (not application SOURCE)
  if (
    base === "dockerfile" ||
    base.startsWith("dockerfile.") ||
    base === "makefile" ||
    base === "tsconfig.json" ||
    base.startsWith("tsconfig.") ||
    base === "jsconfig.json" ||
    base === "vite.config.ts" ||
    base === "vite.config.js" ||
    base === "vite.config.mjs" ||
    base === "webpack.config.js" ||
    base === "webpack.config.ts" ||
    base === "next.config.js" ||
    base === "next.config.mjs" ||
    base === "next.config.ts" ||
    base === "next.config.cjs" ||
    base === "nuxt.config.ts" ||
    base === "nuxt.config.js" ||
    base === "astro.config.mjs" ||
    base === "svelte.config.js" ||
    base === "remix.config.js" ||
    base === "tailwind.config.js" ||
    base === "tailwind.config.ts" ||
    base === "tailwind.config.mjs" ||
    base === "postcss.config.js" ||
    base === "postcss.config.mjs" ||
    base === "postcss.config.cjs" ||
    base === "eslint.config.js" ||
    base === "eslint.config.mjs" ||
    base === "eslint.config.cjs" ||
    base === "eslint.config.ts" ||
    base === "prettier.config.js" ||
    base === "prettier.config.mjs" ||
    base === "vitest.config.ts" ||
    base === "vitest.config.js" ||
    base === "jest.config.js" ||
    base === "jest.config.ts" ||
    base === "playwright.config.ts" ||
    base === "components.json" || // shadcn/ui
    /^vite\.config\./.test(base) ||
    /^next\.config\./.test(base)
  ) {
    return "BUILD";
  }

  if (
    base === ".env.example" ||
    base === ".env.sample" ||
    base === ".env.template" ||
    base === ".nvmrc" ||
    base === ".node-version"
  ) {
    return "ENVIRONMENT_TEMPLATE";
  }

  // Repo / tool configuration
  if (
    base === ".gitignore" ||
    base === ".gitattributes" ||
    base === ".npmrc" ||
    base === ".nvmrc" ||
    base === ".editorconfig" ||
    base === ".prettierrc" ||
    base === ".prettierrc.json" ||
    base === ".prettierrc.yml" ||
    base.startsWith(".prettierrc.") ||
    base.startsWith(".eslintrc") ||
    base === ".eslintignore" ||
    base === ".prettierignore" ||
    base === ".dockerignore" ||
    ((parts.includes("config") || parts.includes("configs")) &&
      (base.endsWith(".json") ||
        base.endsWith(".yml") ||
        base.endsWith(".yaml") ||
        base.endsWith(".toml"))) ||
    base.endsWith(".yml") ||
    base.endsWith(".yaml") ||
    base.endsWith(".toml") ||
    base.endsWith(".ini")
  ) {
    return "CONFIGURATION";
  }

  // Agent / editor instruction files
  if (
    base === "agents.md" ||
    base === "claude.md" ||
    base === "gemini.md" ||
    base.endsWith(".mdc") ||
    parts.includes(".cursor") ||
    (parts.includes(".github") && base === "copilot-instructions.md")
  ) {
    return "DOCUMENTATION";
  }

  // ADCE knowledge folders (before generic .md → DOCUMENTATION)
  const isDocLike =
    base.endsWith(".md") ||
    base.endsWith(".mdx") ||
    base.endsWith(".rst") ||
    base.endsWith(".txt");
  if (isDocLike) {
    if (parts.includes("requirements") || parts.includes("reqs")) {
      return "REQUIREMENT";
    }
    if (parts.includes("design") || parts.includes("designs")) {
      return "DESIGN";
    }
    if (parts.includes("architecture")) {
      return "ARCHITECTURE";
    }
    if (
      parts.includes("decisions") ||
      parts.includes("adr") ||
      parts.includes("adrs")
    ) {
      return "DECISION";
    }
    if (
      parts.includes("security") ||
      parts.includes("policy") ||
      parts.includes("policies") ||
      parts.includes("compliance")
    ) {
      return "POLICY";
    }
    if (
      parts.includes("specifications") ||
      parts.includes("specs") ||
      parts.includes("contracts")
    ) {
      return "SPECIFICATION";
    }
    if (
      parts.includes("testing") ||
      (parts.includes("docs") && parts.includes("test"))
    ) {
      return "SPECIFICATION";
    }
  }

  if (
    base.endsWith(".md") ||
    base.endsWith(".mdx") ||
    base.endsWith(".rst") ||
    parts.includes("docs") ||
    parts.includes("documentation")
  ) {
    return "DOCUMENTATION";
  }

  // Scripts (Node/Python/shell) under scripts/ or tools/
  if (
    (parts[0] === "scripts" || parts[0] === "tools" || parts[0] === "bin") &&
    (base.endsWith(".mjs") ||
      base.endsWith(".cjs") ||
      base.endsWith(".js") ||
      base.endsWith(".ts") ||
      base.endsWith(".py") ||
      base.endsWith(".sh") ||
      base.endsWith(".ps1"))
  ) {
    return "SOURCE";
  }

  if (
    base.endsWith(".ts") ||
    base.endsWith(".tsx") ||
    base.endsWith(".js") ||
    base.endsWith(".jsx") ||
    base.endsWith(".mjs") ||
    base.endsWith(".cjs") ||
    base.endsWith(".css") ||
    base.endsWith(".scss") ||
    base.endsWith(".sass") ||
    base.endsWith(".less") ||
    base.endsWith(".py") ||
    base.endsWith(".go") ||
    base.endsWith(".rs") ||
    base.endsWith(".java") ||
    parts.includes("src") ||
    parts.includes("app")
  ) {
    return "SOURCE";
  }

  return "UNKNOWN";
}
