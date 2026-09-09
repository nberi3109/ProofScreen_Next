import { FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { EmptyNotice } from "@/components/api/ApiNotice";
import DimensionBasis from "@/components/recruiter/evidence/DimensionBasis";
import SkillChip from "@/components/ui/SkillChip";
import {
  BADGE_LABEL,
  DIMENSION_LABEL,
  SESSION_STATE_LABEL,
  claimEvidenceState,
  familyLabel,
  formatDateTime,
  initials,
  scoreBand,
} from "@/lib/api/format";
import { getViewer } from "@/lib/api/viewer";

/**
 * The candidate's profile, from their evidence graph.
 *
 * Everything the mock version showed — a name, a headline, four years of
 * experience, a salary expectation, a resume filename — was invented. What
 * ProofScreen actually knows about a candidate is narrower and more useful:
 * the claims pulled out of their resume, which of those were probed, how they
 * scored per dimension, and whether their answers stayed consistent. So that
 * is what this page is.
 *
 * The same restriction as the proof page applies: scores and dimensions, never
 * the verbatim quotes or the contradiction list. Those exist so a recruiter
 * can audit a number before acting on it, and handing a candidate the exact
 * spans that cost them points turns an evidence interview into a study guide
 * for the next one.
 */
export default async function Profile({
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
            <h1>Your profile</h1>
            <p>Built from evidence, not from a form.</p>
          </div>
        </div>
        <EmptyNotice title="No profile yet.">
          <p>
            Upload a resume and answer a few questions on WhatsApp. What comes
            out is a profile a recruiter can check rather than take on trust.
          </p>
          <Link href="/candidate/start" className="primary-button">
            Get verified
          </Link>
        </EmptyNotice>
      </main>
    );
  }

  const { session, graph } = viewer;

  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <div
            className="avatar"
            style={{ width: 56, height: 56, fontSize: 16, marginBottom: 15 }}
          >
            {initials(graph?.candidate.name ?? "?")}
          </div>
          <h1>{graph?.candidate.name ?? "Verification in progress"}</h1>
          <p>
            {graph?.candidate.role ?? "Role not stated"} ·{" "}
            {familyLabel(graph?.job_family ?? session.job_family, graph?.job_family_label)}
          </p>
        </div>
      </div>

      {graph === null ? (
        <section className="proof-card">
          <div>
            <span className="mini-label">PROOF SCORE</span>
            <div className="score-line">
              <strong>—</strong>
              <span>/100</span>
            </div>
            <p>
              {SESSION_STATE_LABEL[session.state]} · {session.questions_asked} of{" "}
              {session.max_questions} questions answered
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="proof-card">
            <div>
              <span className="mini-label">
                <ShieldCheck size={13} /> PROOF SCORE
              </span>
              <div className="score-line">
                <strong className={`score-${scoreBand(graph.competence_score)}`}>
                  {graph.competence_score}
                </strong>
                <span>/100</span>
              </div>
              <p>{BADGE_LABEL[graph.badge]}</p>
            </div>
          </section>

          <div className="section-title">
            <h2>Claims from your resume</h2>
          </div>

          <div className="skill-row" style={{ overflow: "visible", flexWrap: "wrap" }}>
            {graph.claims.length === 0 ? (
              <span className="panel-note">
                Nothing in the document scored high enough to treat as a
                verifiable claim. Bullet points with numbers and named tools
                work better than a summary.
              </span>
            ) : (
              graph.claims.map((claim) => (
                <SkillChip
                  key={claim.id}
                  name={claim.claim_type_label}
                  state={claimEvidenceState(claim)}
                />
              ))
            )}
          </div>

          <div className="section-title">
            <h2>What your answers showed</h2>
          </div>

          <div className="evidence-list">
            {graph.dimension_profile.filter((dim) => dim.probed).length === 0 ? (
              <p className="panel-note">No dimension has been probed yet.</p>
            ) : (
              graph.dimension_profile
                .filter((dim) => dim.probed)
                .map((dim) => (
                  <div className="evidence-card" key={dim.dimension}>
                    <div>
                      <h3>{DIMENSION_LABEL[dim.dimension]}</h3>
                      <DimensionBasis basis={dim.basis} className="" />
                    </div>
                    <strong className={`score-${scoreBand(dim.score)}`}>
                      {dim.score}
                    </strong>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      <div className="section-title">
        <h2>Verification</h2>
      </div>

      <div className="evidence-card">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <FileText color="#5a45e8" />
          <div>
            <h3>Resume processed</h3>
            <p>
              {graph ? `${graph.claims.length} claims extracted` : "Claims extracted"}
            </p>
          </div>
        </div>
        <Link
          href={`/candidate/proof?session_id=${encodeURIComponent(viewer.sessionId)}`}
          className="text-button"
        >
          View proof
        </Link>
      </div>

      <div className="evidence-card">
        <p style={{ lineHeight: 1.8 }}>
          Job family:{" "}
          <b>
            {familyLabel(graph?.job_family ?? session.job_family, graph?.job_family_label)}
          </b>
          <br />
          Questions answered:{" "}
          <b>
            {session.questions_asked} of {session.max_questions}
          </b>
          <br />
          Interview channel: <b>WhatsApp</b>
          <br />
          {graph && (
            <>
              Answer consistency: <b>{graph.consistency.score}/100</b>
              <br />
              Last scored: <b>{formatDateTime(graph.computed_at)}</b>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
