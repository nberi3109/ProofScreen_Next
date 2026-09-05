import { ArrowRight, ShieldCheck, X } from "lucide-react";
import Link from "next/link";

import {
  BADGE_LABEL,
  SESSION_STATE_LABEL,
  familyLabel,
  formatDateTime,
  initials,
  scoreBand,
} from "@/lib/api/format";
import type { CandidateSummary } from "@/lib/api/types";

/**
 * The preview pane, from the row already in hand.
 *
 * Deliberately renders from the `CandidateSummary` the list was fetched with
 * rather than fetching a graph per selection: clicking down a list of twenty
 * candidates would otherwise be twenty requests for a panel whose job is to
 * help you decide whether to open the full one.
 *
 * So it shows what the summary carries — the three scores, the badge, the
 * consistency figure, and `why_ranked` — and everything that needs the graph
 * (dimension bases, verbatim quotes, the transcript, contradictions in detail)
 * lives one click away where it can be read properly.
 */
export default function CandidatePreview({
  candidate,
  roleId,
  onClose,
}: {
  candidate: CandidateSummary | null;
  roleId: string;
  onClose: () => void;
}) {
  if (!candidate) {
    return (
      <aside className="candidate-preview preview-empty">
        <p>Select a candidate to preview their evidence.</p>
      </aside>
    );
  }

  const href = roleId
    ? `/recruiter/candidates/${candidate.id}?role_id=${encodeURIComponent(roleId)}`
    : `/recruiter/candidates/${candidate.id}`;

  return (
    <aside className="candidate-preview">
      <button className="preview-close" onClick={onClose} aria-label="Close preview">
        <X size={16} />
      </button>

      <div className="preview-person">
        <span className="avatar large-avatar">{initials(candidate.name)}</span>
        <div>
          <h2>{candidate.name}</h2>
          <p>{candidate.role ?? "Role not stated"}</p>
          <span className={`badge-chip badge-${candidate.badge}`}>
            {candidate.badge === "verified" && <ShieldCheck size={11} />}
            {BADGE_LABEL[candidate.badge]}
          </span>
        </div>
      </div>

      <div className="preview-scores">
        <div className={`score-${scoreBand(candidate.competence_score)}`}>
          <b>{candidate.competence_score}</b>
          <small>Competence</small>
        </div>
        <div>
          <b>{candidate.weighted_evidence_score}</b>
          <small>Evidence</small>
        </div>
        <div>
          <b>{candidate.resume_score}</b>
          <small>Resume only</small>
        </div>
      </div>

      {candidate.why_ranked && (
        <section className="preview-section">
          <h3>Why this rank</h3>
          <p className="why-ranked">{candidate.why_ranked}</p>
        </section>
      )}

      <section className="preview-section preview-details">
        <h3>Key details</h3>
        <p>
          Job family{" "}
          <b>{familyLabel(candidate.job_family, candidate.job_family_label)}</b>
        </p>
        <p>
          Role coverage <b>{candidate.role_coverage}%</b>
        </p>
        <p>
          Consistency <b>{candidate.consistency_score}</b>
          {candidate.contradiction_count > 0 && (
            <em>
              {" "}
              · {candidate.contradiction_count} contradiction
              {candidate.contradiction_count === 1 ? "" : "s"}
            </em>
          )}
        </p>
        <p>
          Claims{" "}
          <b>
            {candidate.claims_count}, {candidate.questions_asked} questions
            answered
          </b>
        </p>
        <p>
          Status{" "}
          <b>{candidate.state ? SESSION_STATE_LABEL[candidate.state] : "—"}</b>
        </p>
        <p>
          Scored <b>{formatDateTime(candidate.computed_at)}</b>
        </p>
      </section>

      <Link className="full-profile-button" href={href}>
        Open the evidence graph <ArrowRight size={15} />
      </Link>
    </aside>
  );
}
