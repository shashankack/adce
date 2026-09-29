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
});
