import type { StructureProfile } from "@adce/shared";

export const PROFILES: Record<string, StructureProfile> = {
  "typescript-lib": {
    id: "typescript-lib",
    name: "TypeScript library",
    description: "README, package.json, src, tests",
    rules: [
      {
        id: "manifest",
        level: "required",
        type: "DEPENDENCY_MANIFEST",
        pathGlob: "package.json",
        description: "package.json present",
      },
      {
        id: "readme",
        level: "required",
        type: "DOCUMENTATION",
        pathGlob: "README.md",
        description: "Top-level README",
      },
      {
        id: "source",
        level: "required",
        type: "SOURCE",
        pathGlob: "src/**/*.{ts,tsx,js,jsx}",
        minCount: 1,
        description: "At least one source file under src/",
      },
      {
        id: "tests",
        level: "required",
        type: "TEST",
        pathGlob: "**/*.{test,spec}.{ts,tsx,js,jsx}",
        minCount: 1,
        description: "At least one test file",
      },
      {
        id: "agents",
        level: "recommended",
        type: "DOCUMENTATION",
        pathGlob: "AGENTS.md",
        description: "Agent onboarding file",
      },
      {
        id: "tsconfig",
        level: "recommended",
        type: "BUILD",
        pathGlob: "tsconfig.json",
        description: "TypeScript config",
      },
    ],
    relationshipRules: [
      {
        id: "tests-link",
        level: "recommended",
        relationshipType: "TESTS",
        check: "test-naming-sibling",
        description: "Tests linked to sibling sources",
      },
    ],
  },
};

export const DEFAULT_PROFILE_ID = "typescript-lib";
