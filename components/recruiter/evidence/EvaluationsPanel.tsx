import { FileClock } from "lucide-react";
import Link from "next/link";

import { BADGE_LABEL, formatDateTime, scoreBand } from "@/lib/api/format";
import type { EvaluationSummary } from "@/lib/api/types";

/**
 * A candidate's assessment history — the entry point to the auditable record.
 *
 * The evidence graph above this panel is the CURRENT reading. An evaluation is
 * a finalized one: the same numbers plus the exact version of every input that
 * produced them. They are separated because they answer different questions —
 * "how does this candidate look" versus "what did we conclude on the 4th, and
 * under which rubric".
 *
 * `evaluation_version` is printed per row because it is the only honest way to
 * say whether two rows are comparable at all. It is a hash of the material
 * inputs, so equal means comparable and different means something in the
 * system moved — never "newer". Rows are shown in the order the API returned
 * them (newest first); this component does not sort.
 */
export default function EvaluationsPanel({
  evaluations,
}: {
  evaluations: EvaluationSummary[];
}) {
  if (evaluations.length === 0) {
    return (
      <section className="recruiter-panel evaluations-panel">
        <h2>
          <FileClock size={17} /> Assessments
        </h2>
        <p className="panel-note">
          No finalized assessment yet. One is written when the interview is
          closed out; until then the evidence above is the live reading and can
          still change.
        </p>
      </section>
    );
  }

  const versions = new Set(evaluations.map((item) => item.evaluation_version));

  return (
    <section className="recruiter-panel evaluations-panel">
      <h2>
        <FileClock size={17} /> Assessments
      </h2>
      <p className="panel-note">
        {evaluations.length} on record, newest first. Each one is the score plus
        the versions that produced it.
        {versions.size > 1 && (
          <>
            {" "}
            They were <b>not all scored under the same inputs</b>, so the
            numbers are not directly comparable — the fingerprints below differ.
          </>
        )}
      </p>

      <ol className="evaluation-rows">
        {evaluations.map((item) => (
          <li key={item.id}>
            <Link
              href={`/recruiter/evaluations/${item.id}`}
              className="evaluation-row"
            >
              <b className={`score-pill score-${scoreBand(item.competence_score)}`}>
                {item.competence_score}
              </b>
              <span className="evaluation-row-main">
                <span className="evaluation-row-head">
                  <em className={`badge-chip badge-${item.badge}`}>
                    {BADGE_LABEL[item.badge]}
                  </em>
                  {item.status === "draft" && (
                    <em className="draft-chip">Draft</em>
                  )}
                </span>
                <small>
                  {item.finalized_at
                    ? `finalized ${formatDateTime(item.finalized_at)}`
                    : `opened ${formatDateTime(item.created_at)}`}
                  {" · evidence "}
                  {item.weighted_evidence_score}
                </small>
                <code className="evaluation-row-version">
                  {item.evaluation_version}
                </code>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
