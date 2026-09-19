import { describe, expect, it } from "vitest";
import {
  majorNodeVersion,
  normalizeImportSpecifier,
  parseJsonSchema,
  parseJsonValue,
  parseModuleSymbols,
  parsePackageManifest,
  topLevelKeys,
} from "../src/index.js";

describe("@adce/parsers", () => {
  it("extracts exports and named imports from TS source", () => {
    const mod = parseModuleSymbols(
      "src/math.ts",
      `
        export const add = (a: number, b: number) => a + b;
        export function mul(a: number, b: number) { return a * b; }
        import { expect } from "vitest";
        import { add as sum, missing } from "./math.js";
      `,
    );
    expect(mod.exports).toEqual(["add", "mul"]);
    expect(mod.namedImports).toContainEqual({
      moduleSpecifier: "./math.js",
      names: ["add", "missing"],
    });
    expect(normalizeImportSpecifier("./math.js")).toBe("math");
  });

  it("parses JSON Schema required fields", () => {
    const schema = parseJsonSchema(
      "user.schema.json",
      parseJsonValue(`{
        "type": "object",
        "properties": { "email": {}, "role": {} },
        "required": ["email", "role"]
      }`),
    );
    expect(schema?.required).toEqual(["email", "role"]);
    expect(topLevelKeys({ email: "a", name: "b" })).toEqual(["email", "name"]);
  });

  it("parses package engines and compares node majors", () => {
    const pkg = parsePackageManifest(
      "package.json",
      parseJsonValue(`{"engines":{"node":">=22"},"dependencies":{"zod":"1"}}`),
    );
    expect(pkg?.enginesNode).toBe(">=22");
    expect(majorNodeVersion(pkg!.enginesNode!)).toBe(22);
    expect(majorNodeVersion("18.19.0")).toBe(18);
  });
});
