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
