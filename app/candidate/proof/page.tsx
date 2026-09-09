import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import OptInHandoff from "@/components/candidate/intake/OptInHandoff";
import DimensionBasis from "@/components/recruiter/evidence/DimensionBasis";
import { getSession } from "@/lib/api/candidates";
import {
  BADGE_LABEL,
  DIMENSION_LABEL,
  DIMENSION_MEANING,
  SESSION_STATE_LABEL,
  familyLabel,
  scoreBand,
} from "@/lib/api/format";
import { getCandidateGraph } from "@/lib/api/recruiter";

/**
 * The candidate's own view of their verification.
 *
 * Driven by `?session_id=` because this app has no candidate login yet; the
 * link comes from the intake screen.
 *
 * TWO DELIBERATE RESTRICTIONS, BOTH WORTH KEEPING
 * -----------------------------------------------
 * 1. This page shows the candidate their SCORES — competence, badge, the six
 *    dimensions, per-claim results — and deliberately NOT the verbatim quotes
 *    or the contradiction list. Those exist so a recruiter can audit a number
 *    they are about to act on. Handing a candidate the exact spans that
 *    lowered their score turns an evidence interview into a coaching document
 *    for the next one, and the product only works while answers are unrehearsed.
 *
 * 2. It reads the score from the RECRUITER route, because Phase 1 shipped no
 *    candidate-scoped graph endpoint. That is a real gap, not a design: the
 *    route takes a candidate_id and no credential, so anyone holding an id can
 *    read a full graph. The fix belongs in the backend — a candidate-scoped
 *    read that returns only the fields below — not in a frontend that filters
 *    a payload it should never have received. Flagged here so it is not
 *    mistaken for finished.
 */
export default async function CandidateProofPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="page score-page">
        <div className="hero">
          <div>
            <h1>Your proof</h1>
            <p>Evidence you produced, in one clear signal.</p>
          </div>
        </div>
        <EmptyNotice title="No verification in progress.">
          <p>
            Start one and this page tracks it from claim extraction through to a
            verified profile.
          </p>
          <Link href="/candidate/start" className="primary-button">
            Get verified <ArrowRight size={16} />
          </Link>
        </EmptyNotice>
      </main>
    );
  }

  const session = await getSession(sessionId);

  if (!session.ok) {
    return (
      <main className="page score-page">
        <div className="hero">
          <div>
            <h1>Your proof</h1>
          </div>
        </div>
        <ApiNotice error={session.error} what="this verification" />
      </main>
    );
  }

  const data = session.ok ? session.data : null;
  if (!data) return null;

  const progress =
    data.max_questions > 0
      ? Math.min(100, Math.round((data.questions_asked / data.max_questions) * 100))
      : 0;

  // Only once the graph is final. Before that there is no score to show, and a
  // provisional one would be a number the candidate remembers and the
  // recruiter never sees.
  const graph =
    data.state === "COMPLETE"
      ? await getCandidateGraph(data.candidate_id)
      : null;

  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <span className="mini-label">
            <ShieldCheck size={13} /> YOUR PROOF
          </span>
          <h1>{SESSION_STATE_LABEL[data.state]}</h1>
          <p>
            {familyLabel(data.job_family)} · {data.questions_asked} of{" "}
            {data.max_questions} questions answered
          </p>
        </div>
      </div>

      {data.state === "AWAITING_OPT_IN" && data.opt_in_code && (
        <section className="optin-card">
          {/* No auto-hop here: arriving on the tracking page usually means the
              candidate has come BACK from WhatsApp, and bouncing them out
              again would be a loop they cannot leave. */}
          <OptInHandoff code={data.opt_in_code} autoOpen={false} />
          <p className="panel-note">
            Your claims are extracted and waiting. Nothing is asked until that
            message arrives.
          </p>
        </section>
      )}

      {(data.state === "ASKING" || data.state === "SCORING") && (
        <section className="detail-head">
          <div className="progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <p className="panel-note">
            The interview is running on WhatsApp. Answer there — by text or a
            voice note, whichever is easier.
          </p>
          {data.next_question && (
            <div className="current-question">
              <span className="eyebrow">CURRENT QUESTION</span>
              <h3>{data.next_question}</h3>
            </div>
          )}
        </section>
      )}

      {data.state === "COMPLETE" && graph && !graph.ok && (
        <ApiNotice error={graph.error} what="your verified profile" />
      )}

      {data.state === "COMPLETE" && graph?.ok && (
        <>
          <section className="score-hero">
            <div className={`big-score score-${scoreBand(graph.data.competence_score)}`}>
              {graph.data.competence_score}
            </div>
            <h1>{BADGE_LABEL[graph.data.badge]}</h1>
            <p>
              {graph.data.claims.filter((claim) => claim.qa.length > 0).length} of{" "}
              {graph.data.claims.length} claims backed by your own answers
            </p>
          </section>

          <div className="section-title">
            <h2>What your answers showed</h2>
          </div>

          <div className="skill-grid">
            {graph.data.dimension_profile
              .filter((dim) => dim.probed)
              .map((dim) => (
                <div className="skill-score" key={dim.dimension}>
                  <div className="skill-score-top">
                    <span title={DIMENSION_MEANING[dim.dimension]}>
                      {DIMENSION_LABEL[dim.dimension]}
                    </span>
                    <span>{dim.score}</span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${dim.score}%` }} />
                  </div>
                  <DimensionBasis basis={dim.basis} />
                </div>
              ))}
          </div>

          <div className="section-title">
            <h2>Your claims</h2>
          </div>

          <div className="evidence-list">
            {graph.data.claims.map((claim) => (
              <div className="evidence-card" key={claim.id}>
                <div>
                  <h3>{claim.text}</h3>
                  <p>
                    {claim.claim_type_label}
                    {claim.qa.length === 0
                      ? " · not yet probed"
                      : ` · ${claim.qa.length} ${claim.qa.length === 1 ? "exchange" : "exchanges"}`}
                  </p>
                </div>
                {claim.claim_score !== null ? (
                  <strong className={`score-${scoreBand(claim.claim_score)}`}>
                    {claim.claim_score}
                  </strong>
                ) : (
                  <em>—</em>
                )}
              </div>
            ))}
          </div>

          <p className="panel-note">
            Recruiters see this profile alongside the exact words you used. Your
            score comes from what you described — numbers, steps, decisions and
            specific incidents — never from your accent, grammar or how fluent
            your English is.
          </p>
        </>
      )}

      {data.state === "ABANDONED" && (
        <EmptyNotice title="This verification was not finished.">
          <p>Start a new one whenever you are ready.</p>
          <Link href="/candidate/start" className="primary-button">
            Start again <ArrowRight size={16} />
          </Link>
        </EmptyNotice>
      )}
    </main>
  );
}
