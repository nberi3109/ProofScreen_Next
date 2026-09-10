import { ArrowRight } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import {
  OUTCOME_LABEL,
  SESSION_STATE_LABEL,
  formatDate,
  scoreBand,
} from "@/lib/api/format";
import { getOutcomes, getRoles } from "@/lib/api/recruiter";
import { getViewer } from "@/lib/api/viewer";
import type { OutcomeDecision } from "@/lib/api/types";

/**
 * Where the candidate stands — their recorded decision trail.
 *
 * The mock version listed three invented applications with statuses like
 * "Proof requested". Evident has no applications table, but it does have
 * the thing an application status is really reporting: the decisions a
 * recruiter recorded against this candidate, each optionally tied to the role
 * lens they were looking through. That is this page.
 *
 * WHAT IS DELIBERATELY WITHHELD. `OutcomeOut` also carries `decided_by` and a
 * free-text `note` — the recruiter's name and their private reasoning, written
 * into a field whose form placeholder is literally "Why?". A candidate is
 * entitled to know a decision was made and at what stage; they are not
 * entitled to a colleague's internal note about them, and a frontend that
 * rendered every field it received would have published it by accident. So
 * this page reads `decision`, `stage` and `decided_at`, and nothing else.
 *
 * The route it reads is the recruiter's, because Phase 1 shipped no
 * candidate-scoped one — the same gap flagged on the proof page, and the same
 * fix: an authenticated candidate endpoint in the backend, not filtering in a
 * frontend that should never have received the rest.
 */

/** Which decisions read as still-live. Order matters to the backend's
 *  correlation, not to this label map, so nothing is re-sorted here. */
const CLOSED: OutcomeDecision[] = ["rejected", "hired"];

export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: override } = await searchParams;
  const viewer = await getViewer(override, true);

  if (viewer === null) {
    return (
      <main className="page score-page">
        <div className="hero">
          <div>
            <h1>Where you stand</h1>
            <p>Decisions recorded against your evidence.</p>
          </div>
        </div>
        <EmptyNotice title="Nothing to track yet.">
          <p>
            Get verified and any decision a recruiter records shows up here.
          </p>
          <Link href="/candidate/start" className="primary-button">
            Get verified
          </Link>
        </EmptyNotice>
      </main>
    );
  }

  const [outcomes, roles] = await Promise.all([
    getOutcomes(viewer.session.candidate_id),
    getRoles(),
  ]);

  const roleTitle = (roleId: string | null) => {
    if (!roleId || !roles.ok) return null;
    return roles.data.find((role) => role.id === roleId)?.title ?? null;
  };

  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <h1>Where you stand</h1>
          <p>Decisions recorded against your evidence, newest last.</p>
        </div>
      </div>

      {viewer.graph && (
        <section className="proof-card">
          <div>
            <span className="mini-label">YOUR EVIDENCE</span>
            <div className="score-line">
              <strong className={`score-${scoreBand(viewer.graph.competence_score)}`}>
                {viewer.graph.competence_score}
              </strong>
              <span>/100</span>
            </div>
            <p>
              This is what a recruiter sees when they make one of the decisions
              below.
            </p>
          </div>
        </section>
      )}

      {!outcomes.ok ? (
        <ApiNotice error={outcomes.error} what="your decision trail" />
      ) : outcomes.data.length === 0 ? (
        <EmptyNotice title="No decision recorded yet.">
          <p>
            {viewer.session.state === "COMPLETE"
              ? "Your evidence graph is complete and visible to recruiters. Nothing has been decided yet."
              : `Your verification is ${SESSION_STATE_LABEL[viewer.session.state].toLowerCase()} — finish it and recruiters can act on it.`}
          </p>
          <Link
            href={`/candidate/proof?session_id=${encodeURIComponent(viewer.sessionId)}`}
            className="primary-button"
          >
            See my proof <ArrowRight size={16} />
          </Link>
        </EmptyNotice>
      ) : (
        <div className="evidence-list">
          {outcomes.data.map((outcome) => {
            const title = roleTitle(outcome.role_id);
            const closed = CLOSED.includes(outcome.decision);
            return (
              <article className="evidence-card" key={outcome.id}>
                <div>
                  <h3>{title ?? "Considered on your evidence"}</h3>
                  <p>
                    {formatDate(outcome.decided_at)}
                    {outcome.stage ? ` · ${outcome.stage}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`evidence-state ${
                      outcome.decision === "rejected"
                        ? "needs"
                        : closed
                          ? "verified"
                          : "resume"
                    }`}
                  >
                    ● {OUTCOME_LABEL[outcome.decision]}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="panel-note" style={{ marginTop: 18 }}>
        Only the decision and its stage are shown here. A recruiter&apos;s
        internal notes are not part of your view.
      </p>
    </main>
  );
}
