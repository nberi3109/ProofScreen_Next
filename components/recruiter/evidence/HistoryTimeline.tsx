import { CircleDot, FileCheck2, Gavel } from "lucide-react";

import { BADGE_LABEL, OUTCOME_LABEL, formatDateTime } from "@/lib/api/format";
import type { EvaluationHistoryOut, HistoryEntryKind } from "@/lib/api/types";

const KIND_ICON: Record<HistoryEntryKind, typeof CircleDot> = {
  evaluation_created: CircleDot,
  evaluation_finalized: FileCheck2,
  decision: Gavel,
};

const KIND_LABEL: Record<HistoryEntryKind, string> = {
  evaluation_created: "Assessment opened",
  evaluation_finalized: "Assessment finalized",
  decision: "Human decision",
};

/**
 * What the evaluation said, and what a human then did about it.
 *
 * The two kinds of entry stay VISIBLY separate, and that is a substantive
 * choice rather than a styling one: a later decision never restates, revises
 * or overrides the assessment. The competence score on this timeline comes
 * from the finalized evaluation and from nowhere else, so a recruiter reading
 * it cannot come away thinking a rejection lowered a score.
 *
 * A changed decision shows what it was changed FROM, because "shortlisted,
 * then rejected" and "rejected" are different stories about the same person.
 */
export default function HistoryTimeline({
  history,
}: {
  history: EvaluationHistoryOut;
}) {
  return (
    <section className="recruiter-panel history-panel">
      <h2>
        <Gavel size={17} /> Audit trail
      </h2>
      <p className="panel-note">
        {history.decisions_recorded === 0
          ? "No human decision recorded against this assessment yet."
          : `${history.decisions_recorded} decision${history.decisions_recorded === 1 ? "" : "s"} recorded. Current: ${
              history.current_decision
                ? OUTCOME_LABEL[history.current_decision]
                : "none"
            }.`}
      </p>

      {history.entries.length === 0 ? (
        <p className="panel-note">Nothing on record.</p>
      ) : (
        <ol className="timeline">
          {history.entries.map((entry, index) => {
            const Icon = KIND_ICON[entry.kind];
            const isDecision = entry.kind === "decision";
            return (
              <li
                className={`timeline-entry ${isDecision ? "timeline-decision" : "timeline-lifecycle"}`}
                key={`${entry.kind}-${entry.at}-${index}`}
              >
                <span className="timeline-dot">
                  <Icon size={13} />
                </span>
                <div>
                  <b>
                    {isDecision && entry.decision
                      ? OUTCOME_LABEL[entry.decision]
                      : KIND_LABEL[entry.kind]}
                  </b>
                  <small>{formatDateTime(entry.at)}</small>

                  {isDecision ? (
                    <p>
                      {entry.previous_decision && (
                        <>
                          Changed from{" "}
                          <b>{OUTCOME_LABEL[entry.previous_decision]}</b>.{" "}
                        </>
                      )}
                      {entry.stage ? `${entry.stage}. ` : ""}
                      {entry.decided_by ? `By ${entry.decided_by}.` : ""}
                    </p>
                  ) : (
                    entry.competence_score !== null && (
                      <p>
                        Competence <b>{entry.competence_score}</b>
                        {entry.badge ? ` · ${BADGE_LABEL[entry.badge]}` : ""}
                      </p>
                    )
                  )}

                  {entry.note && <em>{entry.note}</em>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
