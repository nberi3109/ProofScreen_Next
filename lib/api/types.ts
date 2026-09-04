/**
 * THE CONTRACT, TYPESCRIPT SIDE.
 *
 * A hand-maintained mirror of `api/schemas.py` in the ProofScreen backend.
 * It is hand-written rather than generated on purpose: the backend is a
 * separate repository on a separate deploy, so a generator would need the
 * backend running at frontend build time and would couple two pipelines that
 * are deliberately independent.
 *
 * The rule that keeps them honest: THESE TYPES DESCRIBE, THEY DO NOT DECIDE.
 * Nothing here computes a score, re-weights a dimension, or infers a badge.
 * Every number below is read off the response exactly as the backend
 * calculated it, because the backend's central claim — "the model never
 * produces a score, Python arithmetic does" — is worth nothing if the frontend
 * quietly does arithmetic of its own. If a number is missing from a payload,
 * the UI says so; it never fills the gap in.
 *
 * When `api/schemas.py` changes, this file changes in the same PR.
 * Mirrors api/schemas.py @ v2.0.0.
 */

// ---------------------------------------------------------------------------
// enums — string unions, so a response value that drifts is a type error at
// the point of use rather than a silently-rendered blank
// ---------------------------------------------------------------------------

export const DIMENSIONS = [
  "SPECIFICITY",
  "PROCESS",
  "METRIC_OWNERSHIP",
  "CAUSAL_REASONING",
  "AUTHENTICITY",
  "TOOL_FAMILIARITY",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const PROBE_LEVELS = [
  "VALIDATION",
  "OPERATIONAL",
  "INCIDENT",
  "DECISION",
  "OUTCOME",
  "TRANSFER",
] as const;
export type ProbeLevel = (typeof PROBE_LEVELS)[number];

export type Severity = "MINOR" | "MAJOR";

export const SESSION_STATES = [
  "NEW",
  "CLAIMS_READY",
  "AWAITING_OPT_IN",
  "ASKING",
  "SCORING",
  "COMPLETE",
  "ABANDONED",
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export type Badge = "verified" | "partial" | "unverified";
export type Channel = "whatsapp" | "simulated";
export type AnswerMode = "text" | "voice";

/** Ordinal, worst to best. The order is load-bearing — the backend's
 *  validation report rank-correlates scores against it, so the UI must render
 *  it in this order and never re-sort alphabetically. */
export const OUTCOME_DECISIONS = [
  "rejected",
  "shortlisted",
  "interviewed",
  "offered",
  "hired",
] as const;
export type OutcomeDecision = (typeof OUTCOME_DECISIONS)[number];

// ---------------------------------------------------------------------------
// signals — what the model is allowed to return about an answer
// ---------------------------------------------------------------------------

export type Quantity = { value: string; refers_to: string; quote: string };
export type ProcessStep = { step: string; quote: string };
export type CausalLink = {
  cause: string | null;
  action: string | null;
  outcome: string | null;
  quote: string;
};
export type ToolMention = { tool: string; usage: string | null; quote: string };
export type MetricDefinition = {
  metric: string;
  how_measured: string | null;
  quote: string;
};
export type IncidentMarker = { detail: string; quote: string };
export type NamedEntity = { entity: string; kind: string; quote: string };

export type ExtractedFact = {
  key: string;
  value_num: number | null;
  value_text: string | null;
  unit: string | null;
  quote: string;
};

export type AnswerSignals = {
  quantities: Quantity[];
  process_steps: ProcessStep[];
  causal_links: CausalLink[];
  tools: ToolMention[];
  metric_definitions: MetricDefinition[];
  incident_markers: IncidentMarker[];
  entities: NamedEntity[];
  facts: ExtractedFact[];
  summary: string;
};

// ---------------------------------------------------------------------------
// scores — every one of these was computed in Python
// ---------------------------------------------------------------------------

/** `basis` is the sentence to render under the bar: the exact counts the
 *  number came from. `quotes` is what those counts point at. Rendering the
 *  score without the basis throws away the only reason to trust it. */
export type DimensionScore = {
  dimension: Dimension;
  score: number;
  signal_count: number;
  basis: string;
  quotes: string[];
  probed: boolean;
};

export type Contradiction = {
  fact_key: string;
  fact_label: string;
  earlier_value: string;
  later_value: string;
  earlier_response_id: string | null;
  later_response_id: string;
  severity: Severity;
  delta_pct: number | null;
  note: string;
};

/** Measured from the audio only. Accent, fluency and "speech confidence" are
 *  absent by design — they are proxies for region and class. */
export type VoiceSignals = {
  duration_seconds: number;
  word_count: number;
  words_per_minute: number | null;
  effort_score: number;
};

export type QATurn = {
  question: string;
  probe_level: ProbeLevel;
  answer: string;
  answered_by: AnswerMode;
  voice: VoiceSignals | null;
  question_id: string | null;
  response_id: string | null;
  answer_score: number | null;
};

export type ClaimOut = {
  id: string;
  text: string;
  claim_type: string;
  claim_type_label: string;
  metric: string | null;
  weight: number;
};

export type ClaimGraph = {
  id: string;
  text: string;
  claim_type: string;
  claim_type_label: string;
  metric: string | null;
  weight: number;
  claim_score: number | null;
  dimensions: DimensionScore[];
  probed_dimensions: number;
  qa: QATurn[];
  summary: string | null;
  facts: ExtractedFact[];
};

/** Session-level, not per-claim: consistency only exists BETWEEN answers. */
export type ConsistencyReport = {
  score: number;
  multiplier: number;
  facts_tracked: number;
  contradictions: Contradiction[];
  note: string;
};

export type CandidateRef = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
};

export type RoleRef = { id: string; title: string; job_family: string };

export type CandidateGraph = {
  candidate: CandidateRef;
  job_family: string;
  job_family_label: string;
  /** Margin between the top two family matches, 0.0-1.0. Low means the resume
   *  did not clearly belong to this cohort — surfaced, never swallowed. */
  routing_confidence: number | null;
  scored_for: RoleRef | null;
  state: SessionState;
  questions_asked: number;
  resume_score: number;
  /** Before the consistency multiplier. */
  weighted_evidence_score: number;
  /** After it. Showing both is the point. */
  competence_score: number;
  badge: Badge;
  /** How much of what this ROLE weights the resume even speaks to.
   *  "Evidenced badly" and "never claimed it" are different facts. */
  role_coverage: number;
  consistency: ConsistencyReport;
  dimension_profile: DimensionScore[];
  claims: ClaimGraph[];
  computed_at: string | null;
};

export type CandidateSummary = {
  id: string;
  name: string;
  role: string | null;
  job_family: string;
  job_family_label: string;
  /** One sentence generated from stored rows. No model call, ever. */
  why_ranked: string | null;
  resume_score: number;
  weighted_evidence_score: number;
  competence_score: number;
  badge: Badge;
  role_coverage: number;
  consistency_score: number;
  contradiction_count: number;
  state: SessionState | null;
  claims_count: number;
  questions_asked: number;
  computed_at: string | null;
};

// ---------------------------------------------------------------------------
// role weight profiles — the recruiter ranking layer
// ---------------------------------------------------------------------------

export type RoleWeightsIn = {
  title: string;
  job_family?: string;
  claim_weights?: Record<string, number>;
  dimension_weights?: Record<string, number>;
};

export type RoleOut = {
  id: string;
  title: string;
  job_family: string;
  job_family_label: string;
  claim_weights: Record<string, number>;
  dimension_weights: Record<string, number>;
  is_default: boolean;
};

/** Same evidence, different ranking. Two calls with two role_ids returning two
 *  different orders is the whole recruiter-lens argument. */
export type RankedCandidates = {
  scored_for: RoleRef | null;
  candidates: CandidateSummary[];
};

// ---------------------------------------------------------------------------
// recruiter decisions — the only place a HUMAN's judgement enters the system
// ---------------------------------------------------------------------------

export type OutcomeIn = {
  decision: OutcomeDecision;
  stage?: string | null;
  role_id?: string | null;
  decided_by?: string | null;
  note?: string | null;
};

export type OutcomeOut = {
  id: string;
  candidate_id: string;
  role_id: string | null;
  decision: OutcomeDecision;
  stage: string | null;
  decided_by: string | null;
  note: string | null;
  decided_at: string;
};

// ---------------------------------------------------------------------------
// validation — does evidence outrank resume screening?
// ---------------------------------------------------------------------------

export type ValidationCohort = {
  job_family: string;
  n_decided: number;
  /** false => below the minimum sample size. Correlations are WITHHELD, never
   *  estimated, and the UI must not substitute a placeholder number. */
  sufficient: boolean;
  competence_correlation: number | null;
  resume_correlation: number | null;
  competence_precision_at_5: number | null;
  resume_precision_at_5: number | null;
  inversions_caught: number;
};

export type ValidationOut = {
  generated_at: string;
  minimum_n: number;
  overall: ValidationCohort;
  cohorts: ValidationCohort[];
};

// ---------------------------------------------------------------------------
// taxonomy — read-only view of the claim taxonomy, for the weight editor
// ---------------------------------------------------------------------------

export type TaxonomyClaimType = { label: string; default_weight: number };

/** GET /api/recruiter/taxonomy?job_family=… */
export type TaxonomyFamily = {
  job_family: string;
  claim_types: Record<string, TaxonomyClaimType>;
  default_claim_weights: Record<string, number>;
  dimension_weights: Record<string, number>;
};

/** GET /api/recruiter/taxonomy (no query) */
export type TaxonomyAll = {
  families: Record<
    string,
    {
      label: string;
      claim_types: Record<string, TaxonomyClaimType>;
      dimension_weights?: Record<string, number>;
    }
  >;
};

// ---------------------------------------------------------------------------
// candidate intake
// ---------------------------------------------------------------------------

export type CandidateTextIn = {
  resume_text: string;
  name: string;
  phone: string;
  email?: string | null;
  role?: string | null;
  /** null => detected from the resume by the backend's router. */
  job_family?: string | null;
  role_id?: string | null;
  job_description?: string | null;
};

export type CandidateCreateOut = {
  candidate_id: string;
  session_id: string;
  job_family: string;
  job_family_label: string;
  claims: ClaimOut[];
  state: SessionState;
  opt_in_code: string;
  whatsapp_instructions: string;
  outreach_sent: boolean;
  outreach_note: string | null;
};

export type SessionOut = {
  session_id: string;
  candidate_id: string;
  state: SessionState;
  channel: Channel;
  job_family: string;
  questions_asked: number;
  max_questions: number;
  current_claim_id: string | null;
  current_probe_level: ProbeLevel | null;
  next_question: string | null;
  opt_in_code: string | null;
};

// ---------------------------------------------------------------------------
// dev endpoints — /api/dev/*, gated by ENABLE_DEV_ENDPOINTS on the backend.
// Channel "simulated" is never a real candidate; the UI must say so.
// ---------------------------------------------------------------------------

export type SimulateIn = {
  resume_text: string;
  answers?: string[];
  name?: string;
  role?: string | null;
  phone?: string | null;
  job_family?: string | null;
  job_description?: string | null;
};

export type SimulateOut = {
  candidate_id: string;
  session_id: string;
  questions_asked: number;
  graph: CandidateGraph;
};

export type DevAnswerIn = { text: string; audio_seconds?: number | null };

export type DevAnswerOut = {
  session_id: string;
  state: SessionState;
  questions_asked: number;
  accepted_text: string;
  answer_score: number;
  next_question: string | null;
  next_probe_level: ProbeLevel | null;
  contradictions: Contradiction[];
  done: boolean;
};

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export type HealthOut = {
  status: string;
  database: string;
  /** "live" | "fixture" — anything but "live" means claims, questions and
   *  signal extraction came from deterministic heuristics rather than a model.
   *  Scoring is identical either way, but a demo must say which it is. */
  llm_mode: string;
  model: string | null;
  /** "live" | "dry-run" — anything but "live" means no message left the box. */
  whatsapp: string;
  max_questions: number;
  job_families: number;
};
