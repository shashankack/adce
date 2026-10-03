import { describe, expect, it } from "vitest";
import { classifyArtifact } from "../src/artifacts/classifier.js";

describe("classifyArtifact", () => {
  it("classifies Go and Python test filenames as TEST", () => {
    expect(classifyArtifact("hello_test.go")).toBe("TEST");
    expect(classifyArtifact("pkg/foo_test.go")).toBe("TEST");
    expect(classifyArtifact("tests/test_hello.py")).toBe("TEST");
    expect(classifyArtifact("util_test.py")).toBe("TEST");
    expect(classifyArtifact("hello.go")).toBe("SOURCE");
  });

  it("classifies Next / tooling configs as BUILD", () => {
    expect(classifyArtifact("next.config.ts")).toBe("BUILD");
    expect(classifyArtifact("postcss.config.mjs")).toBe("BUILD");
    expect(classifyArtifact("eslint.config.mjs")).toBe("BUILD");
    expect(classifyArtifact("tailwind.config.ts")).toBe("BUILD");
    expect(classifyArtifact("components.json")).toBe("BUILD");
    expect(classifyArtifact("tsconfig.json")).toBe("BUILD");
  });

  it("classifies git/tool config as CONFIGURATION", () => {
    expect(classifyArtifact(".gitignore")).toBe("CONFIGURATION");
    expect(classifyArtifact(".editorconfig")).toBe("CONFIGURATION");
    expect(classifyArtifact(".npmrc")).toBe("CONFIGURATION");
  });

  it("classifies app and script sources as SOURCE", () => {
    expect(classifyArtifact("src/app/page.tsx")).toBe("SOURCE");
    expect(classifyArtifact("src/app/globals.css")).toBe("SOURCE");
    expect(classifyArtifact("scripts/add-admin.mjs")).toBe("SOURCE");
  });

  it("classifies agent instruction files as DOCUMENTATION", () => {
    expect(classifyArtifact("AGENTS.md")).toBe("DOCUMENTATION");
    expect(classifyArtifact("CLAUDE.md")).toBe("DOCUMENTATION");
    expect(classifyArtifact(".cursor/rules/adce.mdc")).toBe("DOCUMENTATION");
  });

  it("classifies ADCE knowledge folders by role", () => {
    expect(classifyArtifact("requirements/overview.md")).toBe("REQUIREMENT");
    expect(classifyArtifact("design/overview.md")).toBe("DESIGN");
    expect(classifyArtifact("architecture/overview.md")).toBe("ARCHITECTURE");
    expect(
      classifyArtifact("decisions/0001-record-architecture-decisions.md"),
    ).toBe("DECISION");
    expect(classifyArtifact("docs/adr/0002-use-sqlite.md")).toBe("DECISION");
    expect(classifyArtifact("security/policy.md")).toBe("POLICY");
    expect(classifyArtifact("docs/testing/strategy.md")).toBe("SPECIFICATION");
    expect(classifyArtifact("specs/auth.md")).toBe("SPECIFICATION");
    expect(classifyArtifact("schemas/example.schema.json")).toBe("SCHEMA");
  });
});
