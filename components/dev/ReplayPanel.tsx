"use client";

import { CheckCircle2, RotateCcw, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";

import { replayEvaluation } from "@/lib/api/actions";
import { formatDateTime } from "@/lib/api/format";
import type { ReplayResultOut } from "@/lib/api/types";

/**
 * Recompute a finalized score from stored signals and diff it.
 *
 * This is the strongest answer the product has to "how do we know the number
 * isn't the model's opinion?" — the arithmetic is re-run from recorded
 * evidence with NO model call, and the result is compared with what was
 * finalized. The contract in one line: extraction is recorded; everything
 * downstream of extraction is replayable.
 *
 * `llm_calls` is displayed even on a MATCH, and prominently, because it is the
 * claim being tested. A non-zero value would mean the replay was not actually
 * deterministic, which is a finding in its own right rather than a footnote.
 *
 * `resume_score` is deliberately absent from the diff: it is a function of
 * live configuration rather than of stored evidence, so a change there is not
 * a reproducibility failure.
 */
export default function ReplayPanel({ evaluationId }: { evaluationId: string }) {
  const [result, setResult] = useState<ReplayResultOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      const outcome = await replayEvaluation(evaluationId);
      if (outcome.ok) setResult(outcome.data);
      else {
        setError(outcome.error);
        setResult(null);
      }
    });
  };

  const matched = result?.status === "MATCH";

  return (
    <section className="recruiter-panel replay-panel">
      <h2>
        <RotateCcw size={17} /> Replay
      </h2>
      <p className="panel-note">
        Recomputes this score from the stored signals and compares it with what
        was finalized. No model call, no regenerated question, no re-created
        answer — so a match means the arithmetic is reproducible, not that the
        model agreed with itself twice.
      </p>

      <button className="outline-button" onClick={run} disabled={pending}>
        {pending ? "Recomputing…" : "Replay this evaluation"}
      </button>

      {error && <p className="form-error">{error}</p>}

      {result && (
        <div className={`replay-result ${matched ? "replay-match" : "replay-mismatch"}`}>
          <div className="replay-verdict">
            {matched ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
            <b>{result.status}</b>
            <span>{formatDateTime(result.replayed_at)}</span>
          </div>

          <dl className="kv-list">
            <div>
              <dt>model calls</dt>
              <dd className={result.llm_calls === 0 ? "replay-zero" : "replay-nonzero"}>
                {result.llm_calls}
              </dd>
            </div>
            <div>
              <dt>claims replayed</dt>
              <dd>{result.claims_replayed}</dd>
            </div>
            <div>
              <dt>answers replayed</dt>
              <dd>{result.answers_replayed}</dd>
            </div>
          </dl>

          {result.llm_calls > 0 && (
            <p className="form-error">
              A replay is supposed to spend zero model calls. {result.llm_calls}{" "}
              means something downstream of extraction is not deterministic —
              that is the finding, regardless of whether the numbers matched.
            </p>
          )}

          {result.note && <p className="panel-note">{result.note}</p>}

          {result.differences.length > 0 && (
            <>
              <h3 className="replay-subhead">What moved</h3>
              <div className="table-scroll">
                <table className="validation-table replay-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Finalized</th>
                      <th>Replayed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.differences.map((d) => (
                      <tr key={d.field}>
                        <td>{d.field}</td>
                        <td>{d.stored}</td>
                        <td className="winning">{d.replayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.provenance_drift.length > 0 && (
            <>
              <h3 className="replay-subhead">Version drift since finalization</h3>
              <p className="panel-note">
                {matched
                  ? "These inputs changed and the numbers still matched — which is the reassurance."
                  : "These inputs changed, and are the likeliest explanation for the mismatch above."}
              </p>
              <div className="table-scroll">
                <table className="validation-table replay-table">
                  <thead>
                    <tr>
                      <th>Input</th>
                      <th>At finalization</th>
                      <th>Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.provenance_drift.map((d) => (
                      <tr key={d.field}>
                        <td>{d.field}</td>
                        <td>{d.stored}</td>
                        <td>{d.replayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
