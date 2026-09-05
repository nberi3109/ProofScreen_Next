"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/api/actions";
import { createRoleProfile } from "@/lib/api/actions";
import { DIMENSION_LABEL, DIMENSION_MEANING, weightShares } from "@/lib/api/format";
import { DIMENSIONS, type RoleOut, type TaxonomyFamily } from "@/lib/api/types";

/**
 * Create a role lens: what THIS opening cares about, as weights.
 *
 * Two things about the numbers below are deliberate.
 *
 * They are not normalised here. The backend rescales whatever is typed so it
 * sums to 100, and its arithmetic is the one that has to be quotable. Doing it
 * in the browser too would create a second place for the numbers to disagree,
 * and eventually they would.
 *
 * A blank field is not zero. Zero is a real statement — "this role does not
 * care about that claim type" — and leaving a box empty is a different one:
 * "use the family default". The action drops blanks rather than coercing them,
 * so both statements survive the round trip.
 */
export default function RoleProfileForm({
  taxonomy,
  families,
}: {
  taxonomy: TaxonomyFamily;
  families: { key: string; label: string }[];
}) {
  const [state, submit, pending] = useActionState<
    ActionResult<RoleOut> | null,
    FormData
  >(createRoleProfile, null);

  const claimTypes = Object.entries(taxonomy.claim_types);

  // The taxonomy sends dimension weights as fractions summing to 1.0, so
  // rounding them straight into a placeholder printed "0" for every dimension
  // — an editor whose defaults all read zero invites a recruiter to type
  // something arbitrary over weights that were fine.
  const dimensionDefaults = new Map(
    weightShares(taxonomy.dimension_weights, DIMENSIONS).map((entry) => [
      entry.key,
      Math.round(entry.share),
    ]),
  );

  return (
    <form action={submit} className="role-form">
      <input type="hidden" name="job_family" value={taxonomy.job_family} />

      <label className="role-form-title">
        Role title
        <input
          name="title"
          placeholder="e.g. Senior Support Lead — escalation heavy"
          required
          minLength={2}
          maxLength={120}
        />
        <small>
          Name it after the opening, not the department — the point is that two
          recruiters hiring for the same title can weight it differently.
        </small>
      </label>

      <fieldset>
        <legend>
          Claim importance
          <small>
            How much each kind of claim matters for this opening. Family
            defaults shown as placeholders.
          </small>
        </legend>
        <div className="weight-grid">
          {claimTypes.map(([key, config]) => (
            <label key={key}>
              <span>{config.label}</span>
              <input
                name={`weight:${key}`}
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder={String(
                  taxonomy.default_claim_weights[key] ?? config.default_weight,
                )}
                inputMode="numeric"
              />
            </label>
          ))}
        </div>
        {claimTypes.length === 0 && (
          <p className="panel-note">
            This family declares no claim types, so there is nothing to weight.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>
          Dimension emphasis
          <small>
            Which kinds of evidence count most. A role that lives on incidents
            should lean on Authenticity; one that lives on numbers, on Metric
            ownership.
          </small>
        </legend>
        <div className="weight-grid">
          {DIMENSIONS.map((dimension) => (
            <label key={dimension} title={DIMENSION_MEANING[dimension]}>
              <span>{DIMENSION_LABEL[dimension]}</span>
              <input
                name={`dim:${dimension}`}
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder={String(dimensionDefaults.get(dimension) ?? 0)}
                inputMode="numeric"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="role-form-foot">
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create opening"}
        </button>
        <small>
          Weights are rescaled to sum to 100 by the backend, so 40/30/20/20 is
          accepted exactly as typed.
        </small>
      </div>

      {state && !state.ok && <p className="form-error">{state.error}</p>}
      {state?.ok && (
        <p className="form-success">
          <CheckCircle2 size={14} /> Created &ldquo;{state.data.title}&rdquo;. Every
          candidate is now ranked under it — no re-interviewing.{" "}
          <a href={`/recruiter/jobs/${state.data.id}`}>Open it</a>
        </p>
      )}

      {families.length > 1 && (
        <p className="panel-note">
          Weighting a different job family? Switch it above — the claim types
          change with the family.
        </p>
      )}
    </form>
  );
}
