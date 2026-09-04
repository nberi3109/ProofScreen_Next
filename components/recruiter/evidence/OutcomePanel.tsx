"use client";

import { CheckCircle2, History } from "lucide-react";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/api/actions";
import { OUTCOME_LABEL, formatDateTime } from "@/lib/api/format";
import { OUTCOME_DECISIONS, type OutcomeOut, type RoleOut } from "@/lib/api/types";

/**
 * Where a human decision enters the system.
 *
 * Everything else on this page is ProofScreen's opinion. These rows are the
 * independent variable the whole product is measured against — the validation
 * report rank-correlates competence scores against them — which is why the
 * form asks which role lens the recruiter was looking through, and why the
 * history below is append-only and shown oldest first. A decision trail that
 * could be edited would make the correlation unfalsifiable.
 */
export default function OutcomePanel({
  action,
  outcomes,
  roles,
  activeRoleId,
}: {
  action: (
    previous: ActionResult<OutcomeOut> | null,
    form: FormData,
  ) => Promise<ActionResult<OutcomeOut>>;
  outcomes: OutcomeOut[];
  roles: RoleOut[];
  activeRoleId: string;
}) {
  const [state, submit, pending] = useActionState(action, null);

  return (
    <section className="recruiter-panel outcome-panel">
      <h2>Record a decision</h2>
      <p className="panel-note">
        The only human judgement stored here. It is what makes &ldquo;evidence
        beats resume screening&rdquo; measurable rather than asserted.
      </p>

      <form action={submit} className="outcome-form">
        <label>
          Decision
          <select name="decision" defaultValue="shortlisted" required>
            {OUTCOME_DECISIONS.map((decision) => (
              <option value={decision} key={decision}>
                {OUTCOME_LABEL[decision]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stage <small>optional</small>
          <input name="stage" placeholder="e.g. Round 1" maxLength={60} />
        </label>

        <label>
          Decided under
          <select name="role_id" defaultValue={activeRoleId}>
            <option value="">Job-family defaults</option>
            {roles.map((role) => (
              <option value={role.id} key={role.id}>
                {role.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Decided by <small>optional</small>
          <input name="decided_by" placeholder="Your name" maxLength={120} />
        </label>

        <label className="outcome-note-field">
          Note <small>optional</small>
          <textarea name="note" rows={2} maxLength={500} placeholder="Why?" />
        </label>

        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Recording…" : "Record decision"}
        </button>
      </form>

      {state && !state.ok && <p className="form-error">{state.error}</p>}
      {state?.ok && (
        <p className="form-success">
          <CheckCircle2 size={14} /> Recorded{" "}
          {OUTCOME_LABEL[state.data.decision]} at{" "}
          {formatDateTime(state.data.decided_at)}.
        </p>
      )}

      <div className="outcome-history">
        <h3>
          <History size={14} /> Decision trail
        </h3>
        {outcomes.length === 0 ? (
          <p className="panel-note">
            No decision recorded yet. Until one is, this candidate contributes
            nothing to the validation report.
          </p>
        ) : (
          <ol>
            {outcomes.map((outcome) => (
              <li key={outcome.id}>
                <b>{OUTCOME_LABEL[outcome.decision]}</b>
                <span>
                  {formatDateTime(outcome.decided_at)}
                  {outcome.stage ? ` · ${outcome.stage}` : ""}
                  {outcome.decided_by ? ` · ${outcome.decided_by}` : ""}
                </span>
                {outcome.note && <em>{outcome.note}</em>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
