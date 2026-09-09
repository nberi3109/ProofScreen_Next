import { Compass, Cpu, FileJson, Fingerprint, Search } from "lucide-react";
import { notFound } from "next/navigation";

import ApiNotice from "@/components/api/ApiNotice";
import ResetPanel from "@/components/dev/ResetPanel";
import TenantPanel from "@/components/dev/TenantPanel";
import {
  detectFamily,
  getFixture,
  getLlmDiagnostics,
  getProvenanceStamp,
} from "@/lib/api/dev";
import { familyLabel } from "@/lib/api/format";
import type { ProvenanceStampOut } from "@/lib/api/types";

/**
 * The diagnostics console — the last four /api/dev/* routes on a screen.
 *
 * The routing inspector is the reason this page is worth having rather than
 * curling the endpoint. Job-family routing decides which claim types a
 * candidate is asked about and which rubric weights score them, so "why did
 * this resume land there?" is the first question anyone asks when a result
 * looks wrong — and answering it used to mean reading the taxonomy JSON by
 * eye. It is deterministic, read-only and costs no model call, so it can be
 * run live in front of an audience.
 *
 * The form is a plain GET with `name="text"`, which means: no JavaScript
 * needed, and every result is a URL somebody can paste into a bug report.
 *
 * 404s unless PROOFSCREEN_ENABLE_DEV_ACTIONS is on. The backend gates the same
 * routes independently with ENABLE_DEV_ENDPOINTS — two switches, because
 * either one alone should not be enough to expose a reset button.
 */
export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string }>;
}) {
  if (process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS !== "true") notFound();

  const { text = "" } = await searchParams;
  const trimmed = text.trim().slice(0, 20_000);

  const [llm, fixture, routing, stamp] = await Promise.all([
    getLlmDiagnostics(),
    getFixture(),
    trimmed ? detectFamily(trimmed) : Promise.resolve(null),
    getProvenanceStamp(),
  ]);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">DEVELOPER TOOL</span>
          <h1>Diagnostics</h1>
          <p>
            Why a resume routed where it did, what the model is doing, and the
            reset switch.
          </p>
        </div>
      </div>

      <section className="recruiter-panel">
        <h2>
          <Compass size={17} /> Routing inspector
        </h2>
        <p className="panel-note">
          Paste resume text. Deterministic, read-only, no model call — the
          answer is the same every time and costs nothing to run.
        </p>

        <form method="get" className="detect-form">
          <textarea
            name="text"
            rows={6}
            defaultValue={trimmed}
            placeholder="Paste a resume, or a single line of it, and see which job family its vocabulary lands in."
            maxLength={20000}
          />
          <button className="primary-button" type="submit">
            <Search size={16} /> Explain the route
          </button>
        </form>

        {routing && !routing.ok && (
          <ApiNotice error={routing.error} what="the routing explanation" />
        )}

        {routing?.ok && <RoutingResult routing={routing.data} />}
      </section>

      <div className="diagnostics-grid">
        <section className="recruiter-panel">
          <h2>
            <Cpu size={17} /> Model
          </h2>
          {!llm.ok ? (
            <ApiNotice error={llm.error} what="the LLM diagnostics" />
          ) : (
            <dl className="kv-list">
              {Object.entries(llm.data).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/_/g, " ")}</dt>
                  <dd>
                    {value === null || value === undefined
                      ? "—"
                      : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {llm.ok && llm.data.mode !== "live" && (
            <p className="panel-note warn">
              Fixture mode. Claims, questions and signal extraction are
              deterministic heuristics — scoring is identical either way, but
              nothing here came from a model.
            </p>
          )}
        </section>

        <section className="recruiter-panel">
          <h2>
            <FileJson size={17} /> Sample graph
          </h2>
          <p className="panel-note">
            The hand-written fixture, so a screen has something to render
            before the database does.
          </p>
          {!fixture.ok ? (
            <ApiNotice error={fixture.error} what="the sample graph" />
          ) : (
            <dl className="kv-list">
              <div>
                <dt>candidate</dt>
                <dd>{fixture.data.candidate?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>job family</dt>
                <dd>
                  {fixture.data.job_family
                    ? familyLabel(fixture.data.job_family, fixture.data.job_family_label)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>claims</dt>
                <dd>{fixture.data.claims?.length ?? 0}</dd>
              </div>
              <div>
                <dt>competence</dt>
                <dd>{fixture.data.competence_score ?? "—"}</dd>
              </div>
              <div>
                <dt>badge</dt>
                <dd>{fixture.data.badge ?? "—"}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <section className="recruiter-panel stamp-panel">
        <h2>
          <Fingerprint size={17} /> Version stamp
        </h2>
        <p className="panel-note">
          What this build would stamp onto an evaluation finalized right now.
          Compare it against a stored evaluation&rsquo;s fingerprint to see
          whether that score is still reproducible on this deployment.
        </p>

        {!stamp.ok ? (
          <ApiNotice error={stamp.error} what="the version stamp" />
        ) : (
          <StampResult stamp={stamp.data} />
        )}
      </section>

      <TenantPanel />

      <ResetPanel />
    </main>
  );
}

function RoutingResult({
  routing,
}: {
  routing: import("@/lib/api/types").RoutingExplanation;
}) {
  const scores = Object.entries(routing.per_family_scores);
  const top = scores.length ? Math.max(...scores.map(([, v]) => v)) : 0;
  const rejected = routing.rejected_leader !== null;

  return (
    <div className="detect-result">
      <div className={`detect-verdict ${rejected ? "detect-general" : ""}`}>
        <div>
          <span className="eyebrow">ROUTED TO</span>
          <h3>{routing.family_label || familyLabel(routing.family)}</h3>
        </div>
        <div className="detect-margin">
          <b>{Math.round(routing.confidence * 100)}%</b>
          <small>margin</small>
        </div>
      </div>

      {/* The backend sends this sentence so a UI cannot quietly relabel a
          margin as a probability. It is printed verbatim for that reason. */}
      <p className="panel-note">{routing.confidence_is}</p>

      {rejected ? (
        <p className="form-error">
          No family reached the {routing.min_terms_required}-term floor.{" "}
          <b>{familyLabel(routing.rejected_leader!)}</b> led and was rejected, so
          this resume is scored against general claim types.
        </p>
      ) : routing.runner_up ? (
        <p className="panel-note">
          Runner-up: <b>{familyLabel(routing.runner_up)}</b>. A narrow margin
          means the resume nearly belonged to that cohort instead, and would
          have been asked about different claim types.
        </p>
      ) : null}

      <h4 className="detect-subhead">Per-family score</h4>
      <div className="dim-list">
        {scores.map(([family, score]) => (
          <div
            className={`dim-row ${family === routing.family ? "dim-strong" : ""}`}
            key={family}
          >
            <div className="dim-head">
              <span>{familyLabel(family)}</span>
              <b>{score.toFixed(2)}</b>
            </div>
            <div className="dim-track">
              <i style={{ width: `${top > 0 ? (score / top) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h4 className="detect-subhead">
        Matched terms — {routing.matched_terms.length} in{" "}
        {routing.chars_considered} characters
      </h4>
      {routing.matched_terms.length === 0 ? (
        <p className="panel-note">
          Nothing in the taxonomy matched. That is why the route is general.
        </p>
      ) : (
        <div className="term-row">
          {routing.matched_terms.map((term) => (
            <span className="term-chip" key={term}>
              {term}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


/**
 * The live fingerprint, then the two lists that make it trustworthy: exactly
 * what it is computed over, and exactly what it ignores.
 *
 * `model_returned` is printed OUTSIDE the material block on purpose. It is
 * observed and recorded but deliberately not hashed, and a reader who does not
 * see that distinction drawn will assume a mismatch invalidates the hash.
 */
function StampResult({ stamp }: { stamp: ProvenanceStampOut }) {
  const material = Object.entries(stamp.fingerprint_material);
  const swapped =
    stamp.model_returned !== null &&
    stamp.model_requested !== null &&
    stamp.model_returned !== stamp.model_requested;

  return (
    <div className="stamp-result">
      <div className="stamp-fingerprint">
        <span className="eyebrow">FINGERPRINT</span>
        <code>{stamp.evaluation_version}</code>
        <em>
          A hash of the inputs below — not a version number. Equal means two
          evaluations are comparable; different means something moved, and the
          rows say which.
        </em>
      </div>

      {swapped && (
        <p className="form-error">
          The provider served <b>{stamp.model_returned}</b> for a request of{" "}
          <b>{stamp.model_requested}</b>. This is recorded but not hashed, so it
          does not change the fingerprint — and that is the point: a per-process
          observation cannot honestly be a per-evaluation identity input.
        </p>
      )}

      <h4 className="detect-subhead">Hashed — {material.length} inputs</h4>
      <dl className="kv-list">
        {material.map(([key, value]) => (
          <div key={key}>
            <dt>{key.replace(/_/g, " ")}</dt>
            <dd>
              {value === null || value === undefined ? (
                "—"
              ) : typeof value === "object" ? (
                <code>{JSON.stringify(value)}</code>
              ) : (
                String(value)
              )}
            </dd>
          </div>
        ))}
      </dl>

      <h4 className="detect-subhead">Not hashed</h4>
      <ul className="stamp-excludes">
        {stamp.fingerprint_excludes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
