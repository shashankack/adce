import { useCallback, useState } from "react";

interface ModeRow {
  mode: string;
  engine: string;
  categoryRecall: number | null;
  categoryPrecision?: number | null;
  mlSuggestionCount: number;
  heuristicSuggestionCount: number;
  suggestionCount: number;
  mlLift?: number | null;
  briefCautionCoverage?: number | null;
  elapsedMs: number;
}

interface Scenario {
  fixture: string;
  modes: { rule: ModeRow; hybrid: ModeRow };
}

interface BenchPayload {
  generatedAt: string;
  mlUrl: string | null;
  scenarios: Scenario[];
}

const fmt = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? "n/a" : n.toFixed(2);

export const App = () => {
  const [mlUrl, setMlUrl] = useState("http://127.0.0.1:8000");
  const [health, setHealth] = useState<string>("—");
  const [bench, setBench] = useState<BenchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ping = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${mlUrl.replace(/\/+$/, "")}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>;
      setHealth(
        `${data.status} · ${data.embedder ?? "?"} · arms ${data.banditArms ?? "?"}`,
      );
    } catch (e) {
      setHealth("unreachable");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [mlUrl]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      setBench(JSON.parse(text) as BenchPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main>
      <h1>ADCE</h1>
      <p className="lede">
        Local research dashboard — ML health + v0.7 ablation JSON from{" "}
        <span className="mono">pnpm bench:analyze</span>.
      </p>

      <section className="panel">
        <h2>ML service</h2>
        <div className="row">
          <input
            type="text"
            value={mlUrl}
            onChange={(e) => setMlUrl(e.target.value)}
            aria-label="ML base URL"
          />
          <button type="button" className="primary" onClick={() => void ping()}>
            Check /health
          </button>
        </div>
        <p className={health.startsWith("ok") ? "ok" : "warn"}>
          {health}
        </p>
        {error ? <p className="warn mono">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Benchmark results</h2>
        <div className="row">
          <label className="file">
            Load results JSON
            <input
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {bench ? (
            <span className="mono">
              {bench.generatedAt}
              {bench.mlUrl ? ` · ML ${bench.mlUrl}` : " · no ML URL"}
            </span>
          ) : null}
        </div>

        {bench ? (
          <table>
            <thead>
              <tr>
                <th>Fixture</th>
                <th>Mode</th>
                <th>Engine</th>
                <th>Recall</th>
                <th>Prec</th>
                <th>ML lift</th>
                <th>Brief</th>
                <th>h/ml/tot</th>
                <th>ms</th>
              </tr>
            </thead>
            <tbody>
              {bench.scenarios.flatMap((s) =>
                (["rule", "hybrid"] as const).map((mode) => {
                  const m = s.modes[mode];
                  return (
                    <tr key={`${s.fixture}-${mode}`}>
                      <td>{s.fixture}</td>
                      <td>{mode}</td>
                      <td>{m.engine}</td>
                      <td>{fmt(m.categoryRecall)}</td>
                      <td>{fmt(m.categoryPrecision)}</td>
                      <td>{m.mlLift == null ? "—" : m.mlLift}</td>
                      <td>{fmt(m.briefCautionCoverage)}</td>
                      <td className="mono">
                        {m.heuristicSuggestionCount}/{m.mlSuggestionCount}/
                        {m.suggestionCount}
                      </td>
                      <td>{m.elapsedMs}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        ) : (
          <p className="lede" style={{ margin: 0 }}>
            Drop in{" "}
            <span className="mono">benchmarks/results/latest.json</span> or a
            golden hybrid run.
          </p>
        )}
      </section>
    </main>
  );
};
