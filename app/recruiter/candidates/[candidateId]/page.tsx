import { ArrowLeft, Compass, Phone } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import RoleLens from "@/components/recruiter/candidates/RoleLens";
import ClaimEvidence from "@/components/recruiter/evidence/ClaimEvidence";
import ConsistencyPanel from "@/components/recruiter/evidence/ConsistencyPanel";
import DimensionBar from "@/components/recruiter/evidence/DimensionBar";
import OutcomePanel from "@/components/recruiter/evidence/OutcomePanel";
import { recordOutcome } from "@/lib/api/actions";
import {
  BADGE_LABEL,
  SESSION_STATE_LABEL,
  familyLabel,
  formatDateTime,
  initials,
  routingLabel,
  scoreBand,
} from "@/lib/api/format";
import { getCandidateGraph, getOutcomes, getRoles } from "@/lib/api/recruiter";

/**
 * GET /api/recruiter/candidates/{id} — the evidence graph behind one score.
 *
 * This page is the product's argument, laid out in the order it has to be
 * defended:
 *
 *   1. THREE SCORES, NOT ONE. Resume-only, weighted evidence, and competence.
 *      A single headline number would hide the two things a recruiter needs:
 *      how far the evidence moved the candidate away from their resume, and
 *      what the consistency multiplier cost them.
 *   2. ROLE COVERAGE, SEPARATE FROM SCORE. "Evidenced badly" and "never
 *      claimed it" are different facts and are never merged.
 *   3. ROUTING CONFIDENCE, SURFACED. If the resume did not clearly belong to
 *      the job family it was scored against, the score is worth less — so the
 *      margin is printed rather than swallowed.
 *   4. EVERY DIMENSION WITH ITS BASIS AND ITS QUOTES. The counts, then the
 *      verbatim spans they were counted from.
 *   5. THE TRANSCRIPT. One click from any claim.
 *
 * Nothing on this page is computed here. Every number is read off the response.
 */
export default async function CandidateEvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{ role_id?: string }>;
}) {
  const { candidateId } = await params;
  const { role_id: roleId = "" } = await searchParams;

  const [graphResult, outcomes, roles] = await Promise.all([
    getCandidateGraph(candidateId, roleId || null),
    getOutcomes(candidateId),
    getRoles(),
  ]);

  const backHref = roleId
    ? `/recruiter/candidates?role_id=${encodeURIComponent(roleId)}`
    : "/recruiter/candidates";

  if (!graphResult.ok) {
    return (
      <main className="recruiter-page narrow-recruiter-page">
        <Link href={backHref} className="recruiter-back">
          <ArrowLeft size={15} /> Back to candidates
        </Link>
        <ApiNotice error={graphResult.error} what={`candidate ${candidateId}`} />
      </main>
    );
  }

  const graph = graphResult.data;
  const routing = routingLabel(graph.routing_confidence);
  const probedClaims = graph.claims.filter((claim) => claim.qa.length > 0);

  return (
    <main className="recruiter-page evidence-page">
      <Link href={backHref} className="recruiter-back">
        <ArrowLeft size={15} /> Back to candidates
      </Link>

      <section className="evidence-hero">
        <span className="avatar large-avatar">{initials(graph.candidate.name)}</span>
        <div className="evidence-identity">
          <span className="eyebrow">EVIDENCE GRAPH</span>
          <h1>{graph.candidate.name}</h1>
          <p>
            {graph.candidate.role ?? "Role not stated"} ·{" "}
            {familyLabel(graph.job_family, graph.job_family_label)}
            {graph.candidate.phone && (
              <>
                {" "}
                · <Phone size={13} /> {graph.candidate.phone}
              </>
            )}
          </p>
          <p className="evidence-state">
            <em className={`badge-chip badge-${graph.badge}`}>
              {BADGE_LABEL[graph.badge]}
            </em>
            <span>{SESSION_STATE_LABEL[graph.state]}</span>
            <span>
              {graph.questions_asked}{" "}
              {graph.questions_asked === 1 ? "question" : "questions"} asked
            </span>
            {graph.computed_at && <span>scored {formatDateTime(graph.computed_at)}</span>}
          </p>
        </div>
        {roles.ok && (
          <RoleLens
            roles={roles.data}
            activeRoleId={roleId}
            basePath={`/recruiter/candidates/${graph.candidate.id}`}
          />
        )}
      </section>

      {/* Three scores, never one. The gaps between them are the finding. */}
      <div className="score-strip">
        <div className={`score-tile primary score-${scoreBand(graph.competence_score)}`}>
          <b>{graph.competence_score}</b>
          <small>Competence</small>
          <em>evidence × consistency</em>
        </div>
        <div className="score-tile">
          <b>{graph.weighted_evidence_score}</b>
          <small>Weighted evidence</small>
          <em>before consistency</em>
        </div>
        <div className="score-tile">
          <b>{graph.resume_score}</b>
          <small>Resume only</small>
          <em>what the CV asserts</em>
        </div>
        <div className="score-tile">
          <b>{graph.role_coverage}%</b>
          <small>Role coverage</small>
          <em>how much of this role they even claim</em>
        </div>
      </div>

      <div className={`routing-strip routing-${routing.level}`}>
        <Compass size={15} />
        <span>
          Scored as <b>{familyLabel(graph.job_family, graph.job_family_label)}</b> —
          job-family routing was <b>{routing.text}</b>.
        </span>
        {routing.level === "weak" && (
          <em>
            A narrow margin means this resume nearly matched another family, so
            it may be scored against the wrong claim types.
          </em>
        )}
        {graph.scored_for && (
          <em>
            Weights from the &ldquo;{graph.scored_for.title}&rdquo; lens.
          </em>
        )}
      </div>

      <div className="evidence-columns">
        <div className="evidence-main">
          <section className="recruiter-panel">
            <h2>Dimension profile</h2>
            <p className="panel-note">
              Six dimensions, session-wide. English fluency, accent and
              &ldquo;speaking confidence&rdquo; are deliberately not among them —
              they are proxies for region and class, and a Team Lead from Jaipur
              must not score below one from Bangalore for less polished English.
            </p>
            <div className="dim-list">
              {graph.dimension_profile.map((dim) => (
                <DimensionBar dim={dim} key={dim.dimension} />
              ))}
            </div>
          </section>

          <div className="recruiter-section-head">
            <h2>
              Claims &amp; evidence — {probedClaims.length} of {graph.claims.length}{" "}
              probed
            </h2>
          </div>

          {graph.claims.length === 0 ? (
            <EmptyNotice title="No claims extracted from this resume.">
              <p>
                Nothing in the document scored high enough to be treated as a
                verifiable claim.
              </p>
            </EmptyNotice>
          ) : (
            <div className="claim-list">
              {graph.claims.map((claim) => (
                <ClaimEvidence claim={claim} key={claim.id} />
              ))}
            </div>
          )}
        </div>

        <aside className="evidence-side">
          <ConsistencyPanel
            consistency={graph.consistency}
            weighted={graph.weighted_evidence_score}
            competence={graph.competence_score}
          />

          <OutcomePanel
            action={recordOutcome.bind(null, graph.candidate.id)}
            outcomes={outcomes.ok ? outcomes.data : []}
            roles={roles.ok ? roles.data : []}
            activeRoleId={roleId}
          />

          {!outcomes.ok && (
            <ApiNotice error={outcomes.error} what="the decision history" />
          )}
        </aside>
      </div>
    </main>
  );
}
