import { describe, expect, it } from "vitest";
import { compactBrief, estimateBriefTokens } from "../src/context/token-budget.js";

describe("token-budget", () => {
  it("estimates tokens and compact drops alsoRelevant", () => {
    const brief = {
      mustRead: [
        {
          id: "1",
          path: "src/a.ts",
          name: "a.ts",
          type: "SOURCE",
          score: 10,
          reason: "type SOURCE; authority CANONICAL",
        },
        {
          id: "2",
          path: "src/b.ts",
          name: "b.ts",
          type: "SOURCE",
          score: 9,
          reason: "type SOURCE",
        },
        {
          id: "3",
          path: "src/c.ts",
          name: "c.ts",
          type: "SOURCE",
          score: 8,
          reason: "type SOURCE",
        },
        {
          id: "4",
          path: "src/d.ts",
          name: "d.ts",
          type: "SOURCE",
          score: 7,
          reason: "type SOURCE",
        },
      ],
      caution: [],
      trustOrder: [],
      alsoRelevant: [
        {
          id: "5",
          path: "README.md",
          name: "README.md",
          type: "DOCUMENTATION",
          score: 4,
          reason: "docs",
        },
      ],
    };
    const before = estimateBriefTokens(brief);
    const compact = compactBrief(brief);
    const after = estimateBriefTokens(compact);
    expect(compact.mustRead).toHaveLength(3);
    expect(compact.alsoRelevant).toHaveLength(0);
    expect(compact.mustRead[0]?.reason).toBe("type SOURCE");
    expect(after).toBeLessThan(before);
  });
});
