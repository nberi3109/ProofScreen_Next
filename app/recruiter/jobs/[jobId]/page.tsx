import { AlertTriangle, ArrowLeft, ArrowRight, Layers3, Users } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import {
  DIMENSION_LABEL,
  DIMENSION_MEANING,
  familyLabel,
  formatShare,
  weightShares,
} from "@/lib/api/format";
import { buildOpening, claimKeyLabel } from "@/lib/api/openings";
import { getRankedCandidates, getRole, getTaxonomy } from "@/lib/api/recruiter";
import { COMPETENCE_DIMENSIONS } from "@/lib/api/types";

/**
 * One opening: what it weights, and who its cohort is.
 *
 * The three stats are counts of rows — applicants, qualified, flagged. The
 * previous version's third stat was "Role views 386, +12% this week", which
 * the backend has no concept of and never will. It is now the number of
 * candidates in this cohort with a contradiction on file, which is both real
 * and the thing a recruiter most wants flagged before they start reading.
 *
 * The weights panel is the honest answer to "what is this opening?" in a
 * product where an opening is a set of priorities rather than a description.
 */
export default async function OpeningDetail({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [role, ranked] = await Promise.all([
    getRole(jobId),
    getRankedCandidates(jobId),
  ]);

  if (!role.ok) {
    return (
      <main className="recruiter-page narrow-recruiter-page">
        <Link href="/recruiter/jobs" className="recruiter-back">
          <ArrowLeft size={15} /> Back to openings
        </Link>
        <ApiNotice error={role.error} what="this opening" />
      </main>
    );
  }

  if (role.data === null) {
    return (
      <main className="recruiter-page narrow-recruiter-page">
        <Link href="/recruiter/jobs" className="recruiter-back">
          <ArrowLeft size={15} /> Back to openings
        </Link>
        <div className="api-notice">
          <AlertTriangle size={18} />
          <div>
            <b>No such opening.</b>
            <p>
              The API has no role lens with id <code>{jobId}</code>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const opening = buildOpening(
    role.data,
    ranked.ok ? ranked.data.candidates : [],
  );
  const {
    role: lens,
    applicants,
    qualified,
    flagged,
    topClaims,
    overridesDimensions,
  } = opening;
  const claimShares = weightShares(
    Object.fromEntries(topClaims.map((claim) => [claim.key, claim.weight])),
  );
  const topClaimShare = claimShares[0]?.share ?? 0;

  // A lens with no dimension overrides inherits its family's, so the honest
  // panel shows the family's numbers and says they are inherited — rather
  // than six zero-width bars, which read as "values no evidence at all".
  const taxonomy = overridesDimensions ? null : await getTaxonomy(lens.job_family);

  // Shares, not raw values: a lens's own dimension weights sum to 100 while
  // the taxonomy's sum to 1.0, so the raw numbers are not comparable and one
  // of them rounds to zero. See `weightShares` in lib/api/format.ts.
  const dimensions = weightShares(
    overridesDimensions
      ? lens.dimension_weights
      : (taxonomy?.ok ? taxonomy.data.dimension_weights : {}),
    COMPETENCE_DIMENSIONS,
  );
  const topDimShare = dimensions[0]?.share ?? 0;

  return (
    <main className="recruiter-page narrow-recruiter-page">
      <Link href="/recruiter/jobs" className="recruiter-back">
        <ArrowLeft size={15} /> Back to openings
      </Link>

      <section className="recruiter-detail-hero">
        <div className="detail-title-row">
          <div>
            <span className="eyebrow">
              {familyLabel(lens.job_family, lens.job_family_label)}
            </span>
            <h1>{lens.title}</h1>
            <p>
              <Layers3 size={15} /> Role lens <span>·</span>{" "}
              {topClaims.length} weighted claim types <span>·</span> six
              dimensions
            </p>
          </div>
          <span className={`status-pill ${lens.is_default ? "published" : "draft"}`}>
            {lens.is_default ? "Family default" : "Custom lens"}
          </span>
        </div>

        <div className="detail-actions">
          <Link
            href={`/recruiter/jobs/${lens.id}/applicants`}
            className="primary-button"
          >
            <Users size={16} /> View applicants <ArrowRight size={16} />
          </Link>
          <Link
            href={`/recruiter/candidates?role_id=${encodeURIComponent(lens.id)}`}
            className="outline-button"
          >
            Rank everyone with this lens
          </Link>
        </div>
      </section>

      {!ranked.ok && <ApiNotice error={ranked.error} what="the applicant counts" />}

      <div className="recruiter-stat-grid detail-stats">
        <div className="recruiter-stat">
          <small>Applicants</small>
          <b>{applicants}</b>
          <em>routed to this job family</em>
        </div>
        <div className="recruiter-stat">
          <small>Evidence-qualified</small>
          <b>{qualified}</b>
          <em>carrying a verified or partial badge</em>
        </div>
        <div className="recruiter-stat">
          <small>Contradictions on file</small>
          <b>{flagged}</b>
          <em>a tracked fact changed between answers</em>
        </div>
      </div>

      <div className="recruiter-detail-grid">
        <section className="recruiter-panel">
          <h2>What this opening weights</h2>
          <p className="panel-note">
            Claim importance, as this opening scores it. Weights sum to 100 and
            are applied late — over evidence already collected — which is why
            editing them re-ranks every candidate without asking anybody another
            question.
          </p>
          <div className="dim-list">
            {topClaims.length === 0 ? (
              <p className="panel-note">
                No overrides — this lens uses its job family&apos;s default claim
                weights.
              </p>
            ) : (
              claimShares.map((claim) => (
                <div className="dim-row" key={claim.key}>
                  <div className="dim-head">
                    <span>{claimKeyLabel(claim.key)}</span>
                    <b>{formatShare(claim.share)}</b>
                  </div>
                  <div className="dim-track">
                    <i
                      style={{
                        width: `${topClaimShare > 0 ? (claim.share / topClaimShare) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="recruiter-panel">
          <h2>Which evidence counts most</h2>
          <p className="panel-note">
            {overridesDimensions
              ? "This opening sets its own dimension emphasis."
              : `Inherited from ${familyLabel(lens.job_family, lens.job_family_label)} — this opening sets no dimension overrides of its own.`}{" "}
            An opening that lives on incidents should lean on Authenticity; one
            that lives on numbers, on Metric ownership.
          </p>
          <div className="dim-list">
            {dimensions.map((entry) => (
              <div className="dim-row" key={entry.key}>
                <div className="dim-head">
                  <span title={DIMENSION_MEANING[entry.key]}>
                    {DIMENSION_LABEL[entry.key]}
                  </span>
                  <b>{formatShare(entry.share)}</b>
                </div>
                <div className="dim-track">
                  <i
                    style={{
                      width: `${topDimShare > 0 ? (entry.share / topDimShare) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
