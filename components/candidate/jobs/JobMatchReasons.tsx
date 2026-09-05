import { Check, Circle, CircleDot } from "lucide-react";

import type { CandidateOpening } from "@/lib/api/openings";

/**
 * Why a candidate is — or is not yet — in the conversation for an opening.
 *
 * Three groups, all derived by comparing sets rather than by scoring anything:
 *
 *   evidenced   this opening weights that claim type, the candidate has a
 *               claim of it, and it was probed and scored
 *   claimed     same, but never probed — still an assertion on a CV
 *   missing     this opening weights it and the candidate claims nothing of
 *               the kind, which is a gap in coverage, not a bad answer
 *
 * The last distinction is the one worth keeping. "Evidenced badly" and "never
 * claimed" are different facts about a person and the backend keeps them
 * apart, so a screen that merged them into one "match" list would be throwing
 * away the more useful half.
 */
export default function JobMatchReasons({
  opening,
}: {
  opening: CandidateOpening;
}) {
  const evidenced = opening.matched.filter((item) => item.evidenced);
  const claimed = opening.matched.filter((item) => !item.evidenced);

  if (
    evidenced.length === 0 &&
    claimed.length === 0 &&
    opening.missing.length === 0
  ) {
    return (
      <p className="panel-note">
        This opening uses its job family&apos;s default weights, so there is no
        specific claim list to compare against yet.
      </p>
    );
  }

  return (
    <div className="evidence-list">
      {evidenced.map((item) => (
        <div className="evidence-card" key={`e-${item.key}`}>
          <div>
            <h3>{item.label}</h3>
            <p>Probed and scored — your own answers are behind this.</p>
          </div>
          <span className="evidence-state verified">
            <Check size={14} /> Verified
          </span>
        </div>
      ))}

      {claimed.map((item) => (
        <div className="evidence-card" key={`c-${item.key}`}>
          <div>
            <h3>{item.label}</h3>
            <p>On your resume, not yet probed. A few questions would settle it.</p>
          </div>
          <span className="evidence-state resume">
            <CircleDot size={13} /> Resume evidence
          </span>
        </div>
      ))}

      {opening.missing.map((label) => (
        <div className="evidence-card" key={`m-${label}`}>
          <div>
            <h3>{label}</h3>
            <p>
              This opening weights it and your resume claims nothing of the
              kind — a gap in coverage rather than a weak answer.
            </p>
          </div>
          <span className="evidence-state needs">
            <Circle size={13} /> Not claimed
          </span>
        </div>
      ))}
    </div>
  );
}
