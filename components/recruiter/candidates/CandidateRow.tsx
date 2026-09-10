import { AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";

import {
  BADGE_LABEL,
  SESSION_STATE_LABEL,
  familyLabel,
  initials,
  scoreBand,
} from "@/lib/api/format";
import type { CandidateSummary } from "@/lib/api/types";

/**
 * One row of the ranked list.
 *
 * Retyped from the old mock `RecruiterCandidate` to `CandidateSummary`, the
 * shape the API actually returns. Three fields the mock had are gone because
 * Evident stores none of them: `location`, `availability` and a
 * `shineVerified` flag. The badge that replaces the last one is earned from
 * counted evidence rather than set by hand, which is the entire point of the
 * product — so a row that showed both would be advertising the weaker signal.
 */
export default function CandidateRow({
  candidate,
}: {
  candidate: CandidateSummary;
}) {
  return (
    <div className="candidate-row">
      <span className="avatar candidate-avatar">{initials(candidate.name)}</span>

      <span className="candidate-main">
        <b>
          {candidate.name}
          <em className={`badge-chip badge-${candidate.badge}`}>
            {candidate.badge === "verified" && <ShieldCheck size={11} />}
            {BADGE_LABEL[candidate.badge]}
          </em>
          {candidate.contradiction_count > 0 && (
            <em className="badge-chip badge-flag">
              <AlertTriangle size={11} />
              {candidate.contradiction_count}
            </em>
          )}
        </b>
        <small>
          {candidate.role ?? "Role not stated"} ·{" "}
          {familyLabel(candidate.job_family, candidate.job_family_label)}
          {candidate.state ? ` · ${SESSION_STATE_LABEL[candidate.state]}` : ""}
        </small>
      </span>

      <span className="candidate-score">
        <b className={`score-${scoreBand(candidate.competence_score)}`}>
          {candidate.competence_score}
        </b>
        <small>Competence</small>
      </span>

      <span className="candidate-skills">
        <span>{candidate.claims_count} claims</span>
        <span>{candidate.questions_asked} answered</span>
      </span>

      <ArrowUpRight size={17} className="row-arrow" />
    </div>
  );
}
