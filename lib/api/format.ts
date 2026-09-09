/**
 * Presentation helpers. Labels, initials, dates, colour bands.
 *
 * WHAT IS NOT IN HERE, AND WILL NOT BE: any function that computes, adjusts,
 * averages or re-weights a score. The backend's whole argument is that every
 * recruiter-facing number is arithmetic over counted, quoted evidence — and a
 * frontend that averaged two dimensions to make a nicer headline would quietly
 * make that false. If a number needs to exist, it gets computed in Python and
 * added to the contract.
 *
 * `scoreBand` is the one thing that looks like an exception and isn't: it maps
 * a score the backend already produced onto a CSS class. It never changes the
 * score, and nothing reads the band back.
 */

import type {
  Badge,
  Dimension,
  OutcomeDecision,
  ProbeLevel,
  SessionState,
} from "./types";

/** Short labels for the six dimensions. Names only — no re-ordering, no
 *  grouping, no "overall" synthesised from them. */
export const DIMENSION_LABEL: Record<Dimension, string> = {
  // Universal Competence Framework — the active set. These strings are the
  // backend's own labels (api/engine/scoring.dimension_labels), copied rather
  // than shortened: "Execution" and "Personal execution" are different claims,
  // and "Ownership" loses the whole point of "Ownership boundary". A recruiter
  // reading a screen has to be describing the same thing as a developer
  // reading a log.
  KNOWLEDGE: "Domain knowledge",
  EXECUTION: "Personal execution",
  PROBLEM_SOLVING: "Problem solving",
  JUDGMENT: "Decision judgment",
  OWNERSHIP: "Ownership boundary",
  ADAPTABILITY: "Knowledge adaptability",
  // Superseded, still rendered for evaluations finalized under them.
  SPECIFICITY: "Specificity",
  PROCESS: "Process",
  METRIC_OWNERSHIP: "Metric ownership",
  CAUSAL_REASONING: "Causal reasoning",
  AUTHENTICITY: "Authenticity",
  TOOL_FAMILIARITY: "Tool familiarity",
};

/** What each dimension is actually asking, in a recruiter's words. Shown as
 *  help text so a low bar reads as a finding rather than a mystery. */
export const DIMENSION_MEANING: Record<Dimension, string> = {
  KNOWLEDGE: "Why the work works, not only what was done — the mechanism behind it.",
  EXECUTION: "Evidence they personally did it, rather than were nearby while it happened.",
  PROBLEM_SOLVING: "Diagnosing something that went wrong, rather than narrating a happy path.",
  JUDGMENT: "A reasoned choice under a real constraint, including what they rejected.",
  OWNERSHIP: "What they held versus what they handed off — the honest edge of the claim.",
  ADAPTABILITY: "Applying what they know to a situation they were never actually in.",
  SPECIFICITY: "Concrete numbers, names and timeframes rather than adjectives.",
  PROCESS: "How the work actually ran, step by step.",
  METRIC_OWNERSHIP: "Whether they can define the metric they claim to have moved.",
  CAUSAL_REASONING: "Complete cause → action → outcome chains, not just outcomes.",
  AUTHENTICITY: "Specific remembered incidents only someone who was there produces.",
  TOOL_FAMILIARITY: "Described usage of a tool, not a certification or a keyword.",
};

export const PROBE_LABEL: Record<ProbeLevel, string> = {
  VALIDATION: "Validation",
  OPERATIONAL: "Operational",
  INCIDENT: "Incident",
  DECISION: "Decision",
  OUTCOME: "Outcome",
  TRANSFER: "Transfer",
};

/** Why a level exists — the escalation is the product, so the transcript
 *  should show what each question was trying to establish. */
export const PROBE_MEANING: Record<ProbeLevel, string> = {
  VALIDATION: "You mentioned this — tell me more.",
  OPERATIONAL: "How did the work run day to day?",
  INCIDENT: "Describe a specific time it went wrong.",
  DECISION: "What did you decide, and what did you reject?",
  OUTCOME: "What happened after, and how did you know?",
  TRANSFER: "A situation they never described, built from their own claims — a memorised resume can be recited, not transferred.",
};

export const BADGE_LABEL: Record<Badge, string> = {
  verified: "Verified",
  partial: "Partially verified",
  unverified: "Unverified",
};

export const SESSION_STATE_LABEL: Record<SessionState, string> = {
  NEW: "Not started",
  CLAIMS_READY: "Claims extracted",
  AWAITING_OPT_IN: "Waiting for WhatsApp opt-in",
  ASKING: "Interview in progress",
  SCORING: "Scoring",
  COMPLETE: "Complete",
  ABANDONED: "Abandoned",
};

export const OUTCOME_LABEL: Record<OutcomeDecision, string> = {
  rejected: "Rejected",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  offered: "Offered",
  hired: "Hired",
};

/** CSS class for a 0-100 score. Purely cosmetic; nothing reads it back. */
export function scoreBand(score: number): "strong" | "fair" | "weak" {
  if (score >= 70) return "strong";
  if (score >= 40) return "fair";
  return "weak";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Fixed locale and UTC, so the server-rendered string and any client
 *  re-render agree. A date that hydrates differently is a React error, and
 *  "1 Sep 2026" is unambiguous in every locale this ships to. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

/** A correlation the backend withheld prints as "withheld", never as 0.00.
 *  Below the sample-size floor there is no number, and inventing one is
 *  exactly the failure the floor exists to prevent. */
export function formatCorrelation(value: number | null | undefined): string {
  if (value === null || value === undefined) return "withheld";
  return value.toFixed(2);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "withheld";
  return `${Math.round(value * 100)}%`;
}

/** Routing confidence is the margin between the top two job-family matches.
 *  A low margin means the resume did not clearly belong to the cohort it was
 *  scored against, which changes how much the score is worth — so it is
 *  labelled rather than printed as a bare decimal. */
export function routingLabel(confidence: number | null): {
  text: string;
  level: "strong" | "fair" | "weak" | "unknown";
} {
  if (confidence === null || confidence === undefined) {
    return { text: "not recorded", level: "unknown" };
  }
  const pct = `${Math.round(confidence * 100)}%`;
  if (confidence >= 0.4) return { text: `clear (${pct} margin)`, level: "strong" };
  if (confidence >= 0.15) return { text: `narrow (${pct} margin)`, level: "fair" };
  return { text: `ambiguous (${pct} margin)`, level: "weak" };
}

export function familyLabel(key: string, label?: string | null): string {
  if (label && label.trim()) return label;
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// evidence state — the candidate-facing reading of a claim
//
// Moved here from the old mock `lib/data.ts`, where the three states were
// hand-assigned per skill. They are now DERIVED FROM FACTS the API reports,
// and the derivation is categorical rather than numeric:
//
//   verified  the claim was probed and scored — answers exist behind it
//   resume    the claim was extracted but never probed, so it is still just
//             an assertion on a CV
//   needs     the claim was probed and produced no score at all
//
// Note what this is not: a threshold on a score. Turning 62 into "verified"
// and 61 into "needs proof" would be the frontend inventing a judgement the
// backend deliberately never makes.
// ---------------------------------------------------------------------------

export type EvidenceState = "verified" | "resume" | "needs";

export const evidenceLabel: Record<EvidenceState, string> = {
  verified: "Verified",
  resume: "Resume evidence",
  needs: "Needs proof",
};

export function claimEvidenceState(claim: {
  qa: unknown[];
  claim_score: number | null;
}): EvidenceState {
  if (claim.qa.length === 0) return "resume";
  return claim.claim_score === null ? "needs" : "verified";
}

// ---------------------------------------------------------------------------
// weight display — and the scale trap it exists to defuse
//
// Dimension weights reach this app on TWO DIFFERENT SCALES depending on which
// endpoint sent them, and nothing in either payload says which:
//
//   GET /recruiter/roles        -> claim_weights sum to 100
//                                  dimension_weights sum to 100 when the lens
//                                  overrides them, and are `{}` when it does not
//   GET /recruiter/taxonomy     -> default_claim_weights sum to 100
//                                  dimension_weights sum to 1.0  (0.19, 0.238…)
//
// Rendering the second lot with the first lot's formatter is how a screen ends
// up telling a recruiter that this opening weights Specificity at "0.2" — or,
// after rounding, at "0". Both are false, and the second is actively
// misleading: it reads as "this role does not care about specificity".
//
// So weights are always displayed as a SHARE OF THEIR OWN TOTAL. That is
// scale-independent, correct for either source, and it is the number a
// recruiter actually wants — "a fifth of the weighting" rather than an
// absolute that only means something relative to its siblings anyway.
//
// This is arithmetic on WEIGHTS, which are inputs a recruiter typed and the
// backend rescales — not on scores. No score is normalised, averaged or
// re-weighted anywhere in this frontend, and that rule is unchanged.
// ---------------------------------------------------------------------------

export type WeightShare<K extends string = string> = {
  key: K;
  /** As sent by the API, whichever scale that was. */
  raw: number;
  /** Percentage of the map's own total, 0-100. */
  share: number;
};

export function weightShares<K extends string>(
  weights: Partial<Record<K, number>>,
  keys?: readonly K[],
): WeightShare<K>[] {
  const entries = (keys ?? (Object.keys(weights) as K[])).map((key) => ({
    key,
    raw: weights[key] ?? 0,
  }));
  const total = entries.reduce((sum, entry) => sum + entry.raw, 0);
  return entries
    .map((entry) => ({
      ...entry,
      share: total > 0 ? (entry.raw / total) * 100 : 0,
    }))
    .sort((a, b) => b.share - a.share);
}

/** One decimal below 10, none above — so 4.8 and 40 both read cleanly. */
export function formatShare(share: number): string {
  return share >= 10 ? `${Math.round(share)}%` : `${share.toFixed(1)}%`;
}
