/**
 * A ROLE LENS IS AN OPENING. This file is that claim, written down.
 *
 * The portal has "jobs"; ProofScreen has `JobRole` — a title, a job family,
 * claim weights and dimension weights. Those are not two things that happen to
 * look alike. A lens says *what this opening wants a candidate to prove*, and
 * `GET /api/recruiter/candidates?role_id=` says *who proved it best*. That is
 * an opening and its applicants, in the only terms this product has.
 *
 * So the jobs screens are backed by `/api/recruiter/roles` rather than by a
 * jobs table nobody built. The columns the backend genuinely cannot fill —
 * salary band, notice period, office location, a posted date — are not filled.
 * They are replaced by columns it can, because a dashboard with three real
 * numbers and two invented ones is less useful than one with three real
 * numbers, and considerably more dangerous.
 *
 * WHAT COUNTS AS AN APPLICANT
 * ---------------------------
 * Passing `role_id` re-ranks EVERY scored candidate, so the length of that
 * list is the same for every lens and means nothing as an applicant count.
 * The number that does mean something is the lens's own cohort: candidates
 * whose resume routed to the same job family, because those are the people
 * whose claim types the lens's weights actually apply to. Someone from another
 * family can still be ranked under the lens — the screens link to that — but
 * they are not counted as applicants to it.
 *
 * Everything below is a COUNT OF ROWS or a field read straight off a response.
 * No score is computed, averaged or re-weighted here.
 */

import {
  DIMENSIONS,
  type CandidateGraph,
  type CandidateSummary,
  type Dimension,
  type RoleOut,
} from "./types";

export type Opening = {
  role: RoleOut;
  /** Candidates routed to this lens's job family. */
  cohort: CandidateSummary[];
  applicants: number;
  /** Carrying a verified or partial badge — enough evidence to be worth reading. */
  qualified: number;
  /** A tracked fact changed between answers. Worth surfacing on a list screen. */
  flagged: number;
  /** Still waiting to give WhatsApp consent, so not yet interviewable. */
  awaitingOptIn: number;
  /** Highest-weighted claim types, already sorted. Descriptive, not derived. */
  topClaims: { key: string; weight: number }[];
  topDimensions: { dimension: Dimension; weight: number }[];
  /**
   * False when the lens carries no dimension overrides at all — it inherits
   * its job family's weights.
   *
   * Worth a flag rather than left to the caller, because `{}` and "every
   * dimension weighted zero" arrive as the same six numbers and mean opposite
   * things. Rendering an inherited lens as six empty bars says "this role
   * values no kind of evidence", which is the reverse of true, and it is
   * exactly the sort of quiet misreading a recruiter would act on.
   */
  overridesDimensions: boolean;
};

export function buildOpening(
  role: RoleOut,
  allCandidates: CandidateSummary[],
): Opening {
  const cohort = allCandidates.filter((c) => c.job_family === role.job_family);

  return {
    role,
    cohort,
    applicants: cohort.length,
    qualified: cohort.filter((c) => c.badge !== "unverified").length,
    flagged: cohort.filter((c) => c.contradiction_count > 0).length,
    awaitingOptIn: cohort.filter((c) => c.state === "AWAITING_OPT_IN").length,
    topClaims: Object.entries(role.claim_weights)
      .map(([key, weight]) => ({ key, weight }))
      .sort((a, b) => b.weight - a.weight),
    topDimensions: DIMENSIONS.map((dimension) => ({
      dimension,
      weight: role.dimension_weights[dimension] ?? 0,
    })).sort((a, b) => b.weight - a.weight),
    overridesDimensions: DIMENSIONS.some(
      (dimension) => (role.dimension_weights[dimension] ?? 0) > 0,
    ),
  };
}

export function buildOpenings(
  roles: RoleOut[],
  allCandidates: CandidateSummary[],
): Opening[] {
  return roles.map((role) => buildOpening(role, allCandidates));
}

/** Taxonomy keys are snake_case; the taxonomy's own labels are better when a
 *  screen has them, but a list page usually does not want a second fetch just
 *  to title-case six words. */
const ACRONYMS = new Set([
  "aht",
  "csat",
  "kyc",
  "nps",
  "npa",
  "qa",
  "sla",
  "tat",
]);

export function claimKeyLabel(key: string): string {
  return key
    .split("_")
    .map((part) =>
      ACRONYMS.has(part.toLowerCase())
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

// ---------------------------------------------------------------------------
// the candidate's view of an opening
// ---------------------------------------------------------------------------

export type CandidateOpening = {
  role: RoleOut;
  topClaims: { key: string; weight: number }[];
  /** The BACKEND'S number for how much of this role the candidate's claims
   *  even speak to, read off a graph scored under this lens. Null when there
   *  is no completed verification yet.
   *
   *  This is what the match badge shows, and it is deliberately not called a
   *  match score: a match score would be something this frontend computed, and
   *  role coverage is something the backend computed and can defend. */
  coverage: number | null;
  competence: number | null;
  /** Claim types this lens weights that the candidate HAS a claim for, and the
   *  ones it weights that they do not. Both are set comparisons on
   *  `claim_type` — no scoring, no thresholds. */
  matched: { key: string; label: string; evidenced: boolean }[];
  missing: string[];
  /** False when the lens inherits its family's dimension weights. Same
   *  distinction as on `Opening`, and it matters more here: a candidate told
   *  "this role weights every kind of answer at zero" would draw exactly the
   *  wrong conclusion about what to say. */
  overridesDimensions: boolean;
};

/**
 * Build a candidate's view of one opening.
 *
 * `graph` must be the candidate's graph fetched WITH this lens's `role_id` —
 * `role_coverage` is lens-specific, so passing the default-weighted graph here
 * would show the same number under every opening and quietly destroy the one
 * thing this screen is meant to demonstrate.
 */
export function buildCandidateOpening(
  role: RoleOut,
  graph: CandidateGraph | null,
): CandidateOpening {
  const topClaims = Object.entries(role.claim_weights)
    .map(([key, weight]) => ({ key, weight }))
    .sort((a, b) => b.weight - a.weight);

  const weighted = new Set(topClaims.filter((c) => c.weight > 0).map((c) => c.key));

  const matched: CandidateOpening["matched"] = [];
  const seen = new Set<string>();
  for (const claim of graph?.claims ?? []) {
    if (!weighted.has(claim.claim_type) || seen.has(claim.claim_type)) continue;
    seen.add(claim.claim_type);
    matched.push({
      key: claim.claim_type,
      label: claim.claim_type_label || claimKeyLabel(claim.claim_type),
      // Probed and scored, rather than merely extracted from the resume.
      evidenced: claim.qa.length > 0 && claim.claim_score !== null,
    });
  }

  return {
    role,
    topClaims,
    coverage: graph?.role_coverage ?? null,
    competence: graph?.competence_score ?? null,
    matched,
    missing: [...weighted].filter((key) => !seen.has(key)).map(claimKeyLabel),
    overridesDimensions: DIMENSIONS.some(
      (dimension) => (role.dimension_weights[dimension] ?? 0) > 0,
    ),
  };
}
