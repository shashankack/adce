import { describe, expect, it } from "vitest";
import {
  ADCE_AGENTS_BEGIN,
  ADCE_AGENTS_END,
  AGENTS_TEMPLATE,
  mergeAgentsMarkdown,
} from "../src/project/agents-template.js";

describe("mergeAgentsMarkdown", () => {
  it("creates a full template when missing", () => {
    const { content, action } = mergeAgentsMarkdown(null);
    expect(action).toBe("created");
    expect(content).toContain(ADCE_AGENTS_BEGIN);
    expect(content).toContain("adce context");
    expect(content).toContain(ADCE_AGENTS_END);
  });

  it("appends a marked ADCE section to an existing AGENTS.md", () => {
    const existing = `# My Project\n\nDo cool things.\n`;
    const { content, action } = mergeAgentsMarkdown(existing);
    expect(action).toBe("merged");
    expect(content).toContain("# My Project");
    expect(content).toContain("Do cool things.");
    expect(content).toContain(ADCE_AGENTS_BEGIN);
    expect(content).toContain("adce structure");
    expect(content.indexOf("# My Project")).toBeLessThan(
      content.indexOf(ADCE_AGENTS_BEGIN),
    );
  });

  it("updates an existing marked block without duplicating", () => {
    const existing = `# App\n\n${ADCE_AGENTS_BEGIN}\nold body\n${ADCE_AGENTS_END}\n\n## Other\nKeep me.\n`;
    const { content, action } = mergeAgentsMarkdown(existing);
    expect(action).toBe("updated");
    expect(content).toContain("# App");
    expect(content).toContain("## Other");
    expect(content).toContain("Keep me.");
    expect(content).toContain("adce context");
    expect(content).not.toContain("old body");
    expect(content.split(ADCE_AGENTS_BEGIN).length - 1).toBe(1);
  });

  it("is unchanged when the marked block already matches", () => {
    const { content: once } = mergeAgentsMarkdown("# X\n");
    const again = mergeAgentsMarkdown(once);
    expect(again.action).toBe("unchanged");
    expect(again.content).toBe(once);
  });

  it("AGENTS_TEMPLATE includes markers", () => {
    expect(AGENTS_TEMPLATE).toContain(ADCE_AGENTS_BEGIN);
    expect(AGENTS_TEMPLATE).toContain(ADCE_AGENTS_END);
  });
});
