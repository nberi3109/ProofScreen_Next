"use client";

import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/api/actions";
import { simulateCandidate } from "@/lib/api/actions";
import {
  BADGE_LABEL,
  DIMENSION_LABEL,
  familyLabel,
  routingLabel,
  scoreBand,
} from "@/lib/api/format";
import type { SimulateOut } from "@/lib/api/types";

/**
 * POST /api/dev/simulate — resume in, whole scored graph out, one call.
 *
 * This exists because WhatsApp is the only real candidate channel, and a booth
 * demo cannot depend on a handset, a Meta-approved template and a working
 * network. It writes `Channel.simulated` rows, which the backend's own
 * contract describes as "never a real candidate" — so the banner stays, and
 * every candidate this creates carries that channel in the database where
 * anyone auditing the numbers can see it.
 */
export default function SimulatorForm() {
  const [state, submit, pending] = useActionState<
    ActionResult<SimulateOut> | null,
    FormData
  >(simulateCandidate, null);

  return (
    <>
      <div className="mode-banner">
        <FlaskConical size={16} />
        <div>
          <p>
            SIMULATED CHANNEL — every candidate created here is stored as
            <code>Channel.simulated</code> and skips the WhatsApp opt-in, which
            is a consent step. Useful for a demo, never a real candidate.
          </p>
        </div>
      </div>

      <form action={submit} className="intake-form">
        <label>
          Candidate name
          <input name="name" placeholder="Simulated Candidate" />
        </label>

        <label>
          Role <small>optional</small>
          <input name="role" placeholder="Customer Support Lead" />
        </label>

        <label>
          Job family <small>optional — detected from the resume if blank</small>
          <input name="job_family" placeholder="bpo_operations" />
        </label>

        <label className="intake-textarea">
          Resume text
          <textarea
            name="resume_text"
            required
            minLength={80}
            rows={10}
            placeholder="Paste resume text — bullet points with numbers and tools produce the most claims."
          />
        </label>

        <label className="intake-textarea">
          Answers <small>one per line — cycled if there are fewer than questions</small>
          <textarea
            name="answers"
            rows={6}
            placeholder={
              "Leave blank to use the backend's placeholder answers.\nOtherwise: one answer per line."
            }
          />
          <small>
            Answers with quantities, named tools and complete cause → action →
            outcome chains score higher, because those are the signals the
            rubric counts.
          </small>
        </label>

        <label className="intake-textarea">
          Job description <small>optional</small>
          <textarea name="job_description" rows={3} />
        </label>

        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Running the pipeline…" : "Simulate a full interview"}
        </button>

        {pending && (
          <p className="panel-note">
            Extracting claims, generating questions, extracting signals from
            each answer and scoring — several model calls, so up to a minute.
          </p>
        )}

        {state && !state.ok && <p className="form-error">{state.error}</p>}
      </form>

      {state?.ok && <SimulationResult result={state.data} />}
    </>
  );
}

function SimulationResult({ result }: { result: SimulateOut }) {
  const graph = result.graph;
  const routing = routingLabel(graph.routing_confidence);

  return (
    <section className="recruiter-panel sim-result">
      <h2>Result</h2>
      <p className="panel-note">
        {result.questions_asked} questions asked ·{" "}
        {familyLabel(graph.job_family, graph.job_family_label)} · routing{" "}
        {routing.text}
      </p>

      <div className="score-strip">
        <div className={`score-tile primary score-${scoreBand(graph.competence_score)}`}>
          <b>{graph.competence_score}</b>
          <small>Competence</small>
        </div>
        <div className="score-tile">
          <b>{graph.weighted_evidence_score}</b>
          <small>Weighted evidence</small>
        </div>
        <div className="score-tile">
          <b>{graph.resume_score}</b>
          <small>Resume only</small>
        </div>
        <div className="score-tile">
          <b>{BADGE_LABEL[graph.badge]}</b>
          <small>Badge</small>
        </div>
      </div>

      <ul className="sim-dims">
        {graph.dimension_profile.map((dim) => (
          <li key={dim.dimension}>
            <span>{DIMENSION_LABEL[dim.dimension]}</span>
            <b>{dim.probed ? dim.score : "—"}</b>
          </li>
        ))}
      </ul>

      {graph.consistency.contradictions.length > 0 && (
        <p className="form-error">
          {graph.consistency.contradictions.length} contradiction
          {graph.consistency.contradictions.length === 1 ? "" : "s"} found —
          consistency ×{graph.consistency.multiplier.toFixed(2)}.
        </p>
      )}

      <Link
        href={`/recruiter/candidates/${result.candidate_id}`}
        className="primary-button"
      >
        Open the full evidence graph <ArrowRight size={16} />
      </Link>
    </section>
  );
}
