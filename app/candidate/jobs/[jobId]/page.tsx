import { AlertTriangle, ArrowLeft, Layers3 } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import ApplyButton from "@/components/candidate/jobs/ApplyButton";
import JobMatchReasons from "@/components/candidate/jobs/JobMatchReasons";
import SaveButton from "@/components/candidate/jobs/SaveButton";
import MatchBadge from "@/components/ui/MatchBadge";
import {
  DIMENSION_LABEL,
  DIMENSION_MEANING,
  familyLabel,
  formatShare,
  weightShares,
} from "@/lib/api/format";
import { buildCandidateOpening, claimKeyLabel } from "@/lib/api/openings";
import { DIMENSIONS } from "@/lib/api/types";
import { getCandidateGraph, getRole, getTaxonomy } from "@/lib/api/recruiter";
import { getViewer } from "@/lib/api/viewer";

/**
 * One opening, from the candidate's side.
 *
 * The graph here is fetched WITH this opening's `role_id`, so every number on
 * the page is what this role's weights produce — not the candidate's
 * default-weighted score relabelled. Open two roles and the coverage figure
 * differs, which is the same re-ranking the recruiter sees, from the other end.
 */
export default async function OpeningDetail({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const [{ jobId }, { session_id: override }] = await Promise.all([
    params,
    searchParams,
  ]);

  const [role, viewer] = await Promise.all([getRole(jobId), getViewer(override)]);

  if (!role.ok) {
    return (
      <main className="page detail-layout">
        <Link className="back-link" href="/candidate">
          <ArrowLeft size={15} /> Back to roles
        </Link>
        <ApiNotice error={role.error} what="this role" />
      </main>
    );
  }

  if (role.data === null) {
    return (
      <main className="page detail-layout">
        <Link className="back-link" href="/candidate">
          <ArrowLeft size={15} /> Back to roles
        </Link>
        <div className="api-notice">
          <AlertTriangle size={18} />
          <div>
            <b>This role is no longer open.</b>
            <p>Nothing on the API matches that id.</p>
          </div>
        </div>
      </main>
    );
  }

  const verified = viewer !== null && viewer.session.state === "COMPLETE";
  const graph = verified
    ? await getCandidateGraph(viewer!.session.candidate_id, jobId)
    : null;

  const opening = buildCandidateOpening(
    role.data,
    graph?.ok ? graph.data : null,
  );
  const { role: lens } = opening;

  // No dimension overrides means the opening inherits its family's weights.
  // Showing zeros here would tell the candidate this role cares about no kind
  // of answer, which is the opposite of what an empty override means.
  const taxonomy = opening.overridesDimensions
    ? null
    : await getTaxonomy(lens.job_family);
  // Shares rather than raw values: the two sources use different scales, and
  // the taxonomy's fractions round to "0" if printed as-is.
  const topDim = weightShares(
    opening.overridesDimensions
      ? lens.dimension_weights
      : (taxonomy?.ok ? taxonomy.data.dimension_weights : {}),
    DIMENSIONS,
  )
    .filter((entry) => entry.share > 0)
    .slice(0, 3);

  return (
    <main className="page detail-layout">
      <Link className="back-link" href="/candidate">
        <ArrowLeft size={15} /> Back to roles
      </Link>

      <section className="detail-head">
        <div className="company-mark opening-mark">{lens.title.charAt(0)}</div>
        <h1>{lens.title}</h1>
        <div className="eyebrow">
          {familyLabel(lens.job_family, lens.job_family_label)}
          {lens.is_default ? " · family default lens" : " · custom lens"}
        </div>
        <div className="salary-line">
          <Layers3 size={14} />{" "}
          {opening.topClaims.length > 0
            ? `${opening.topClaims.length} weighted claim types`
            : "Uses this family's default weights"}
        </div>
        <div className="detail-score">
          <MatchBadge score={opening.coverage} />
          <span>
            {opening.coverage === null
              ? "Get verified and this shows how much of the role your evidence covers."
              : `Your claims speak to ${opening.coverage}% of what this role weights${
                  opening.competence !== null
                    ? `, and score ${opening.competence} under its lens`
                    : ""
                }.`}
          </span>
        </div>
      </section>

      <div className="section-title">
        <h2>Where you stand</h2>
        <span className="mini-label" style={{ color: "#716d82" }}>
          EVIDENCE CHECK
        </span>
      </div>

      <JobMatchReasons opening={opening} />

      <div className="section-title">
        <h2>What this role weights</h2>
      </div>

      <div className="skill-row" style={{ overflow: "visible", flexWrap: "wrap" }}>
        {opening.topClaims.length === 0 ? (
          <span className="panel-note">
            This role uses its job family&apos;s default claim weights.
          </span>
        ) : (
          opening.topClaims.map((claim) => (
            <span className="skill-chip resume" key={claim.key}>
              {claimKeyLabel(claim.key)}
              <small>{claim.weight.toFixed(0)}%</small>
            </span>
          ))
        )}
      </div>

      <div className="section-title">
        <h2>Which kind of answer counts here</h2>
      </div>

      <div className="evidence-list">
        {topDim.length === 0 && (
          <p className="panel-note">
            This role does not emphasise any one dimension over the others.
          </p>
        )}
        {topDim.map((entry) => (
          <div className="evidence-card" key={entry.key}>
            <div>
              <h3>{DIMENSION_LABEL[entry.key]}</h3>
              <p>{DIMENSION_MEANING[entry.key]}</p>
            </div>
            <strong>{formatShare(entry.share)}</strong>
          </div>
        ))}
      </div>

      <p className="panel-note" style={{ marginTop: 20 }}>
        Nothing here scores your accent, grammar or how fluent your English is.
        The questions ask what you did, how you did it, and what happened —
        answered in your own words on WhatsApp, by text or voice note.
      </p>

      <div className="sticky-actions">
        <SaveButton openingId={lens.id} />
        <ApplyButton
          openingId={lens.id}
          openingTitle={lens.title}
          alreadyVerified={verified}
        />
      </div>
    </main>
  );
}
