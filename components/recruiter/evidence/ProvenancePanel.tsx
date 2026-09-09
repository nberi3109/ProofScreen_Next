import { Fingerprint } from "lucide-react";

import type { ProvenanceOut } from "@/lib/api/types";

/**
 * Which versions produced this number.
 *
 * The `evaluation_version` is a HASH of the material inputs, not a counter,
 * and that distinction is the whole point of the panel: two evaluations are
 * comparable if and only if it matches. So it is rendered as a fingerprint —
 * monospace, truncated, copyable — and never as something you would compare
 * with "greater than". Presenting a hash as a version number would invite
 * exactly the wrong reading.
 *
 * `model_returned` sits apart from `model_requested` on purpose: the provider
 * can answer with something other than what was asked for, and that fact is
 * recorded but deliberately NOT part of the fingerprint, because a
 * per-process observation cannot honestly be a per-evaluation identity input.
 */
export default function ProvenancePanel({
  provenance,
}: {
  provenance: ProvenanceOut;
}) {
  const swapped =
    provenance.model_returned &&
    provenance.model_requested &&
    provenance.model_returned !== provenance.model_requested;

  const versions: [string, string][] = [
    ["Taxonomy", provenance.taxonomy_version],
    ["Rubric", provenance.rubric_version],
    ["Scoring", provenance.scoring_version],
    ["Question policy", provenance.question_policy_version],
    ["Code", provenance.code_version],
    ["App", provenance.app_version],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  const flags = Object.entries(provenance.feature_flags);
  const prompts = Object.entries(provenance.prompt_versions);

  return (
    <section className="recruiter-panel provenance-panel">
      <h2>
        <Fingerprint size={17} /> Provenance
      </h2>
      <p className="panel-note">
        Every version that fed this score. Two evaluations are comparable only
        when the fingerprint below matches — when it differs, the rows say
        which part of the system moved.
      </p>

      <div className="provenance-fingerprint">
        <small>EVALUATION FINGERPRINT</small>
        <code>{provenance.evaluation_version || "not stamped"}</code>
        <em>
          A hash of the material inputs, not a version number — it does not
          increase, it only matches or does not.
        </em>
      </div>

      <dl className="kv-list">
        {versions.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {provenance.taxonomy_hash && (
          <div>
            <dt>Taxonomy hash</dt>
            <dd>{provenance.taxonomy_hash.slice(0, 16)}…</dd>
          </div>
        )}
        <div>
          <dt>Model mode</dt>
          <dd>{provenance.llm_mode}</dd>
        </div>
        <div>
          <dt>Model requested</dt>
          <dd>{provenance.model_requested ?? "—"}</dd>
        </div>
        <div>
          <dt>Model returned</dt>
          <dd>{provenance.model_returned ?? "—"}</dd>
        </div>
      </dl>

      {swapped && (
        <p className="panel-note warn">
          The provider answered with a different model than the one requested.
          Recorded, and deliberately not part of the fingerprint — but worth
          knowing before comparing this score with another.
        </p>
      )}

      {prompts.length > 0 && (
        <details className="provenance-more">
          <summary>Prompt versions — {prompts.length}</summary>
          <dl className="kv-list">
            {prompts.map(([name, version]) => (
              <div key={name}>
                <dt>{name.replace(/_/g, " ")}</dt>
                <dd>{version}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {flags.length > 0 && (
        <details className="provenance-more">
          <summary>Feature flags — {flags.length}</summary>
          <dl className="kv-list">
            {flags.map(([name, value]) => (
              <div key={name}>
                <dt>{name.replace(/_/g, " ")}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}
