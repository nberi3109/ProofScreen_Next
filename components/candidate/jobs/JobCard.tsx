"use client";

import { ArrowUpRight, Layers3, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import SaveButton from "@/components/candidate/jobs/SaveButton";
import MatchBadge from "@/components/ui/MatchBadge";
import SkillChip from "@/components/ui/SkillChip";
import { claimKeyLabel, type CandidateOpening } from "@/lib/api/openings";
import { familyLabel } from "@/lib/api/format";

/**
 * One opening, from the candidate's side.
 *
 * The mock version carried a company name, a logo colour, a salary band, a
 * location and a made-up match score. Evident stores none of those, so the
 * card now shows what an opening genuinely is: a job family, the claim types
 * it weights most, and — once the candidate has a completed verification —
 * the backend's own role-coverage figure for them under this specific lens.
 *
 * The chips are claim types with real evidence states: probed and scored,
 * on the resume but unprobed, or weighted here and not claimed at all.
 */
export default function JobCard({ opening }: { opening: CandidateOpening }) {
  const router = useRouter();
  const { role } = opening;
  const href = `/candidate/jobs/${role.id}`;

  const open = () => router.push(href);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target as HTMLElement).closest("button, a")) open();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    open();
  };

  const chips = [
    ...opening.matched.slice(0, 2).map((item) => ({
      name: item.label,
      state: item.evidenced ? ("verified" as const) : ("resume" as const),
    })),
    ...opening.missing.slice(0, 1).map((label) => ({
      name: label,
      state: "needs" as const,
    })),
  ];

  const fallbackChips = opening.topClaims
    .slice(0, 3)
    .map((claim) => ({ name: claimKeyLabel(claim.key), state: "resume" as const }));

  return (
    <article
      className="job-card"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${role.title}`}
    >
      <div className="job-card-top">
        <div className="company-mark opening-mark">{role.title.charAt(0)}</div>
        <div className="job-heading">
          <div className="eyebrow">
            {/* The label is wrapped so IT can be ellipsised. Truncating the
                container instead clipped the pill beside it. */}
            <span className="eyebrow-label">
              {familyLabel(role.job_family, role.job_family_label)}
            </span>
            {role.is_default && <span className="verified-dot">Family default</span>}
          </div>
          <h3>{role.title}</h3>
          <div className="job-meta">
            <span>
              <Layers3 size={13} />
              {opening.topClaims.length || "family default"}{" "}
              {opening.topClaims.length ? "weighted claim types" : "weights"}
            </span>
            {opening.competence !== null && (
              <span>
                <Target size={13} />
                competence {opening.competence} here
              </span>
            )}
          </div>
        </div>
        <MatchBadge score={opening.coverage} />
      </div>

      <div className="salary-line">
        {opening.topClaims[0]
          ? `Weights ${claimKeyLabel(opening.topClaims[0].key)} most`
          : "Uses this family's default weights"}
      </div>

      <div className="skill-row">
        {(chips.length > 0 ? chips : fallbackChips).map((chip) => (
          <SkillChip key={chip.name} name={chip.name} state={chip.state} />
        ))}
      </div>

      <div className="reasons">
        <strong>What this role wants proved</strong>
        {opening.topClaims.slice(0, 3).map((claim) => (
          <span key={claim.key}>
            {claimKeyLabel(claim.key)} · {claim.weight.toFixed(0)}%
          </span>
        ))}
        {opening.topClaims.length === 0 && (
          <span>Its job family&apos;s default claim weights</span>
        )}
      </div>

      <div className="card-actions" onClick={(event) => event.stopPropagation()}>
        <SaveButton openingId={role.id} />
        <Link className="text-button" href={href}>
          View role <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
