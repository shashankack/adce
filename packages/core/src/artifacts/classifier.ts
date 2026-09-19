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

  if (
    base === "dockerfile" ||
    base.startsWith("dockerfile.") ||
    base === "makefile" ||
    base === "tsconfig.json" ||
    base.startsWith("tsconfig.") ||
    base === "vite.config.ts" ||
    base === "webpack.config.js"
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

  if (
    (parts.includes("config") || parts.includes("configs")) &&
    base.endsWith(".json")
  ) {
    return "CONFIGURATION";
  }

  if (
    base.endsWith(".yml") ||
    base.endsWith(".yaml") ||
    base.endsWith(".toml") ||
    base.endsWith(".ini") ||
    base === ".editorconfig" ||
    base === ".prettierrc" ||
    base.startsWith(".eslintrc")
  ) {
    return "CONFIGURATION";
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

  if (
    base.endsWith(".ts") ||
    base.endsWith(".tsx") ||
    base.endsWith(".js") ||
    base.endsWith(".jsx") ||
    base.endsWith(".py") ||
    base.endsWith(".go") ||
    base.endsWith(".rs") ||
    base.endsWith(".java") ||
    parts.includes("src")
  ) {
    return "SOURCE";
  }

  return "UNKNOWN";
}
