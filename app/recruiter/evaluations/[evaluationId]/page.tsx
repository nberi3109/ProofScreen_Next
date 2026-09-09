import { AlertTriangle, ArrowLeft, ArrowRight, FileCheck2 } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import DimensionBar from "@/components/recruiter/evidence/DimensionBar";
import HistoryTimeline from "@/components/recruiter/evidence/HistoryTimeline";
import ProvenancePanel from "@/components/recruiter/evidence/ProvenancePanel";
import ReplayPanel from "@/components/dev/ReplayPanel";
import {
  BADGE_LABEL,
  DIMENSION_LABEL,
  familyLabel,
  formatDateTime,
  formatShare,
  scoreBand,
  weightShares,
} from "@/lib/api/format";
import { claimKeyLabel } from "@/lib/api/openings";
import { getEvaluation, getEvaluationHistory } from "@/lib/api/recruiter";
import { isLegacyDimension } from "@/lib/api/types";

/**
 * ONE ASSESSMENT, AS A RECORD RATHER THAN AS A LIVE READING.
 *
 * The candidate page answers "what does this person's evidence say right now"
 * and re-scores under whichever lens you pick. This page answers a different
 * and harder question: "what exactly did we conclude, on what date, under
 * which weights, from which version of the system?" — and it must keep
 * answering it after the lens has been edited or deleted, which is why the
 * weights below come from the evaluation's own snapshot rather than from
 * `/roles`.
 *
 * A finalized evaluation is immutable. Nothing on this page re-scores
 * anything, and the replay panel deliberately RECOMPUTES rather than rescores:
 * it proves the stored number is reproducible, it does not produce a new one.
 */
export default async function EvaluationDetail({
  params,
}: {
  params: Promise<{ evaluationId: string }>;
}) {
  const { evaluationId } = await params;
  const [evaluation, history] = await Promise.all([
    getEvaluation(evaluationId),
    getEvaluationHistory(evaluationId),
  ]);

  if (!evaluation.ok) {
    return (
      <main className="recruiter-page narrow-recruiter-page">
        <Link href="/recruiter/candidates" className="recruiter-back">
          <ArrowLeft size={15} /> Back to candidates
        </Link>
        <ApiNotice error={evaluation.error} what={`evaluation ${evaluationId}`} />
      </main>
    );
  }

  const e = evaluation.data;
  const finalized = e.status === "finalized";
  const claimWeights = weightShares(e.claim_weights);
  const dimWeights = weightShares(e.dimension_weights);
  const hasLegacy = e.dimension_profile.some((d) => isLegacyDimension(d.dimension));

  return (
    <main className="recruiter-page evidence-page">
      <Link
        href={`/recruiter/candidates/${e.candidate_id}`}
        className="recruiter-back"
      >
        <ArrowLeft size={15} /> Back to {e.candidate_name || "the candidate"}
      </Link>

      <section className="evidence-hero">
        <div className="evidence-identity">
          <span className="eyebrow">
            ASSESSMENT RECORD · {familyLabel(e.job_family, e.job_family_label)}
          </span>
          <h1>{e.candidate_name || e.candidate_id}</h1>
          <p className="evidence-state">
            <em className={`badge-chip ${finalized ? "badge-verified" : "badge-partial"}`}>
              {finalized ? <FileCheck2 size={11} /> : null}
              {finalized ? "Finalized" : "Draft"}
            </em>
            <em className={`badge-chip badge-${e.badge}`}>{BADGE_LABEL[e.badge]}</em>
            <span>opened {formatDateTime(e.created_at)}</span>
            {e.finalized_at && <span>finalized {formatDateTime(e.finalized_at)}</span>}
            {e.role_title && <span>lens: {e.role_title}</span>}
          </p>
        </div>
        <Link
          href={`/recruiter/candidates/${e.candidate_id}`}
          className="outline-button"
        >
          Live evidence graph <ArrowRight size={15} />
        </Link>
      </section>

      {!finalized && (
        <div className="api-notice api-notice-config">
          <AlertTriangle size={18} />
          <div>
            <b>This assessment is still a draft.</b>
            <p>
              The interview has not finished, so these numbers can still move.
              Only a finalized evaluation is an immutable record — and only a
              finalized one can be replayed.
            </p>
          </div>
        </div>
      )}

      <div className="score-strip">
        <div className={`score-tile primary score-${scoreBand(e.competence_score)}`}>
          <b>{e.competence_score}</b>
          <small>Competence</small>
          <em>evidence × consistency</em>
        </div>
        <div className="score-tile">
          <b>{e.weighted_evidence_score}</b>
          <small>Weighted evidence</small>
          <em>before consistency</em>
        </div>
        <div className="score-tile">
          <b>{e.resume_score}</b>
          <small>Resume only</small>
          <em>what the CV asserts</em>
        </div>
        <div className="score-tile">
          <b>{e.role_coverage}%</b>
          <small>Role coverage</small>
          <em>how much of this role they even claim</em>
        </div>
      </div>

      <div className="recruiter-stat-grid detail-stats">
        <div className="recruiter-stat">
          <small>Consistency</small>
          <b>{e.consistency_score}</b>
          <em>
            {e.contradiction_count === 0
              ? "no contradictions"
              : `${e.contradiction_count} contradiction${e.contradiction_count === 1 ? "" : "s"}`}
          </em>
        </div>
        <div className="recruiter-stat">
          <small>Claims scored</small>
          <b>{e.claims_scored}</b>
          <em>backed by answers</em>
        </div>
        <div className="recruiter-stat">
          <small>Questions asked</small>
          <b>{e.questions_asked}</b>
          <em>over WhatsApp</em>
        </div>
      </div>

      <div className="evidence-columns">
        <div className="evidence-main">
          <section className="recruiter-panel">
            <h2>Dimension profile, as scored</h2>
            <p className="panel-note">
              {e.dimension_profile.length} dimensions.
              {hasLegacy
                ? " Some rows use the superseded framework — this assessment was scored before the dimensions changed, and is shown as it was scored rather than re-labelled."
                : ""}
            </p>
            <div className="dim-list">
              {e.dimension_profile.map((dim) => (
                <DimensionBar dim={dim} key={dim.dimension} />
              ))}
            </div>
          </section>

          <section className="recruiter-panel">
            <h2>Weights this assessment used</h2>
            <p className="panel-note">
              Snapshotted at the time, not read back from the lens. A lens can
              be edited or deleted afterwards; a finalized assessment has to
              stay explainable either way.
            </p>

            {/* Both columns are always rendered, even when one snapshot is
                empty. An omitted column reads as "this assessment weighted no
                dimensions", which is the opposite of what an empty snapshot
                means — it means the defaults applied. Saying so is the whole
                job of this panel. */}
            <div className="weights-two-up">
              <div>
                <h3 className="detect-subhead">Claim importance</h3>
                {claimWeights.length === 0 ? (
                  <p className="panel-note weights-inherited">
                    Nothing snapshotted, so this assessment used the{" "}
                    {familyLabel(e.job_family, e.job_family_label)} defaults for
                    claim importance.
                  </p>
                ) : (
                  <div className="dim-list">
                    {claimWeights.map((w) => (
                      <div className="dim-row" key={w.key}>
                        <div className="dim-head">
                          <span>{claimKeyLabel(w.key)}</span>
                          <b>{formatShare(w.share)}</b>
                        </div>
                        <div className="dim-track">
                          <i style={{ width: `${w.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="detect-subhead">Dimension emphasis</h3>
                {dimWeights.length === 0 ? (
                  <p className="panel-note weights-inherited">
                    Nothing snapshotted. The assessment used the active
                    taxonomy&rsquo;s dimension weights — which means that if
                    those weights are edited later, this score cannot be
                    re-derived from what is stored here alone.
                  </p>
                ) : (
                  <div className="dim-list">
                    {dimWeights.map((w) => (
                      <div className="dim-row" key={w.key}>
                        <div className="dim-head">
                          <span>
                            {DIMENSION_LABEL[
                              w.key as keyof typeof DIMENSION_LABEL
                            ] ?? w.key}
                          </span>
                          <b>{formatShare(w.share)}</b>
                        </div>
                        <div className="dim-track">
                          <i style={{ width: `${w.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="evidence-side">
          <ProvenancePanel provenance={e.provenance} />

          {history.ok ? (
            <HistoryTimeline history={history.data} />
          ) : (
            <ApiNotice error={history.error} what="the audit trail" />
          )}

          {/* Support tool, dev-gated — but the one you want on screen when
              somebody asks whether the number is reproducible. */}
          {process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS === "true" && finalized && (
            <ReplayPanel evaluationId={e.id} />
          )}
        </aside>
      </div>
    </main>
  );
}
