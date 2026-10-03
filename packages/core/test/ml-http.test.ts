import { describe, expect, it, vi } from "vitest";
import type { AnalyzeRequest } from "@adce/shared";
import { filterAnalyzeRequestForMl } from "../src/analyze/privacy.js";
import { runMlHttpAnalyze } from "../src/analyze/ml-http.js";
import { runProjectAnalyze } from "../src/analyze/run-analyze.js";

const baseReq = (): AnalyzeRequest => ({
  rootPath: "/tmp/proj",
  mode: "default",
  conflictIds: null,
  artifacts: [
    {
      id: "a1",
      path: "README.md",
      name: "README.md",
      type: "DOCUMENTATION",
      verification: "UNVERIFIED",
      health: "HEALTHY",
      authority: "UNKNOWN",
      contentHash: "h1",
      excerpt: "SECRET TOKEN abc",
    },
    {
      id: "a2",
      path: ".env",
      name: ".env",
      type: "CONFIGURATION",
      verification: "UNVERIFIED",
      health: "HEALTHY",
      authority: "UNKNOWN",
      contentHash: "h2",
      excerpt: "API_KEY=1",
    },
    {
      id: "a3",
      path: null,
      name: "PII policy",
      type: "POLICY",
      verification: "UNVERIFIED",
      health: "HEALTHY",
      authority: "UNKNOWN",
      contentHash: "h3",
      excerpt: null,
    },
  ],
  conflicts: [
    {
      id: "c1",
      category: "DOCUMENTATION_MISMATCH",
      lifecycle: "DETECTED",
      confidence: "POTENTIAL",
      severity: "LOW",
      sourceArtifactId: "a1",
      targetArtifactId: "a2",
      summary: "stale",
      evidence: "raw snippet must not leave",
    },
  ],
  relationships: [],
});

describe("ML HTTP + privacy", () => {
  it("strips excerpts, evidence, secretish paths; keeps null-path manuals", () => {
    const filtered = filterAnalyzeRequestForMl(baseReq());
    expect(filtered.artifacts.every((a) => a.excerpt === null)).toBe(true);
    expect(filtered.artifacts.some((a) => a.path === ".env")).toBe(false);
    expect(filtered.artifacts.some((a) => a.path === "README.md")).toBe(true);
    expect(filtered.artifacts.some((a) => a.path === null)).toBe(true);
    expect(filtered.conflicts[0]?.evidence).toBeNull();
  });

  it("POSTs to /v1/analyze and merges as hybrid via HTTP", async () => {
    const prev = process.env.ADCE_ML_TOKEN;
    process.env.ADCE_ML_TOKEN = "unit-test-token";
    const fetchImpl = vi.fn(async () =>
      Response.json({
        suggestions: [
          {
            kind: "conflict_confidence",
            conflictId: "c1",
            confidence: "LIKELY",
            score: 0.9,
            reason: "http ml",
            source: "ml",
          },
        ],
      }),
    );

    try {
      const suggestions = await runMlHttpAnalyze(baseReq(), {
        baseUrl: "http://ml.test/",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      });
      expect(suggestions).toHaveLength(1);

      expect(fetchImpl).toHaveBeenCalledOnce();
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe("http://ml.test/v1/analyze");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers["content-type"]).toBe("application/json");
      expect(headers.authorization).toBe("Bearer unit-test-token");
      expect(headers["x-adce-token"]).toBe("unit-test-token");
      const body = JSON.parse(String(init?.body)) as AnalyzeRequest;
      expect(body.artifacts.some((a) => a.path === ".env")).toBe(false);
      expect(body.artifacts.every((a) => a.excerpt === null)).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.ADCE_ML_TOKEN;
      else process.env.ADCE_ML_TOKEN = prev;
    }

    const report = await runProjectAnalyze(baseReq(), {
      useCache: false,
      skipMl: false,
      mlUrl: "http://ml.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(report.engine).toBe("hybrid");
    expect(report.notes[0]).toContain("ML HTTP");
  });

  it("falls back to heuristic when HTTP fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    });
    const report = await runProjectAnalyze(baseReq(), {
      useCache: false,
      mlUrl: "http://ml.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipMl: false,
    });
    expect(report.engine).toBe("heuristic");
    expect(report.notes[0]).toMatch(/unavailable|skipped/i);
  });
});
