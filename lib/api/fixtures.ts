/**
 * SAMPLE DATA — so a screen is never blank before the API is reachable.
 *
 * WHY THIS EXISTS AND NOT THE OLD `data/` FOLDER
 * ----------------------------------------------
 * The mock layer this replaces held its own invented shapes (`RecruiterCandidate`,
 * `CandidateJob`) which drifted from the backend the moment the contract moved.
 * Everything below is typed against `./types` — the same mirror of
 * `api/schemas.py` the real responses are typed against — so a field the
 * backend renames breaks the build here rather than quietly rendering a blank
 * card in a demo.
 *
 * WHAT IT IS CAREFUL ABOUT
 * ------------------------
 * This product's entire claim is that every number a recruiter sees is
 * arithmetic over counted, quoted evidence. Sample numbers that look real are
 * therefore more dangerous here than in most apps, so three rules hold:
 *
 *  1. Fixtures are OFF unless a deployment opts in (see PROOFSCREEN_FIXTURES).
 *  2. Whenever fixture data is on screen the app says so, in a banner that
 *     cannot be mistaken for chrome. Nobody should ever quote one of these
 *     figures believing a candidate produced it.
 *  3. The arithmetic is internally consistent — weighted evidence × the
 *     consistency multiplier equals the competence score, on every row — so
 *     the consistency panel does not display a sum that does not add up.
 *
 * The numbers mirror what `seed.py` actually produces, including the ordering
 * flip between lenses. That means the strongest twenty seconds of the demo —
 * the same evidence re-ranked for two different recruiters — works with the
 * backend switched off entirely.
 */

import { COMPETENCE_DIMENSIONS } from "./types";
import type {
  CandidateGraph,
  CandidateSummary,
  ClaimGraph,
  Dimension,
  DimensionScore,
  EvaluationHistoryEntry,
  EvaluationHistoryOut,
  EvaluationOut,
  EvaluationSummary,
  HealthOut,
  OutcomeOut,
  ProvenanceOut,
  ProvenanceStampOut,
  QATurn,
  RankedCandidates,
  RoleOut,
  SessionOut,
  TaxonomyAll,
  TaxonomyFamily,
  ValidationOut,
} from "./types";

const NOW = "2026-09-04T09:12:00Z";

// ---------------------------------------------------------------------------
// builders — six dimensions written out four times is where inconsistency
// creeps in, so they are generated from counts instead
// ---------------------------------------------------------------------------

const DIM_BASIS: Record<Dimension, (n: number) => string> = {
  KNOWLEDGE: (n) =>
    n >= 2
      ? `${n} concepts explained with their mechanism`
      : `${n} named only — capped: described what, not why`,
  EXECUTION: (n) => `${n} first-person process steps, ${Math.max(1, n - 1)} named systems`,
  PROBLEM_SOLVING: (n) =>
    n >= 1 ? `${n} diagnosed exceptions` : "no exception or failure described",
  JUDGMENT: (n) =>
    n >= 2
      ? `${n} decisions with a stated reason, ${Math.max(1, n - 1)} constraints`
      : `${n} decision without a rejected alternative`,
  OWNERSHIP: (n) =>
    n >= 1 ? `${n} scope boundaries stated` : "scope held and handed off not distinguished",
  ADAPTABILITY: (n) =>
    n >= 1 ? `${n} transfers to an undescribed situation` : "no transfer attempted",
  SPECIFICITY: (n) => `${n} quantities, ${Math.max(1, n - 2)} named entities`,
  PROCESS: (n) => `${n} process steps, ${Math.max(1, n - 1)} domain terms`,
  METRIC_OWNERSHIP: (n) =>
    n >= 2
      ? `${n} metrics defined, ${n + 2} numbers tied to a metric`
      : `${n} named only — capped at 45: metric never defined`,
  CAUSAL_REASONING: (n) =>
    n >= 2
      ? `${n} complete causal chains`
      : `${n} partial — capped at 50: no complete cause-action-outcome chain`,
  AUTHENTICITY: (n) =>
    n >= 1 ? `${n} specific incident details` : "no specific incident recalled",
  TOOL_FAMILIARITY: (n) =>
    n >= 1 ? `${n} tools with described usage` : "tool named but usage not described",
};

/**
 * `basis` overrides the generated count summary.
 *
 * The real engine builds `basis` as bullet LINES joined with newlines
 * ("• Executed step: …\n• Applied tool in workflow: …"), in the phrasing of
 * whichever rubric produced them. The two flagship claims below carry that
 * shape verbatim, because they are what a demo actually shows and because a
 * frontend that has never rendered the real format has not been tested
 * against it. The remaining claims keep the generated one-line summary — a
 * shorter form the same component handles, so both paths stay exercised.
 */
function dim(
  dimension: Dimension,
  score: number,
  signals: number,
  quotes: string[] = [],
  basis?: string,
): DimensionScore {
  return {
    dimension,
    score,
    signal_count: signals,
    basis: basis ?? DIM_BASIS[dimension](signals),
    quotes,
    probed: score > 0 || signals > 0,
  };
}

function unprobed(dimension: Dimension): DimensionScore {
  return {
    dimension,
    score: 0,
    signal_count: 0,
    basis: "",
    quotes: [],
    probed: false,
  };
}

function qa(
  level: QATurn["probe_level"],
  question: string,
  answer: string,
  score: number,
  id: string,
): QATurn {
  return {
    question,
    probe_level: level,
    answer,
    answered_by: "text",
    voice: null,
    question_id: `q_${id}`,
    response_id: `r_${id}`,
    answer_score: score,
  };
}

// ---------------------------------------------------------------------------
// role lenses
// ---------------------------------------------------------------------------

export const FIXTURE_ROLES: RoleOut[] = [
  {
    id: "jr_sample_lead",
    title: "Team Lead — People First",
    job_family: "bpo_operations",
    job_family_label: "BPO / Contact Centre Operations",
    claim_weights: {
      team_handling: 40,
      csat_improvement: 30,
      coaching_quality: 10,
      attrition_control: 10,
      aht_control: 5,
      sla_adherence: 5,
    },
    dimension_weights: {},
    is_default: true,
  },
  {
    id: "jr_sample_ops",
    title: "Operations Excellence Lead",
    job_family: "bpo_operations",
    job_family_label: "BPO / Contact Centre Operations",
    claim_weights: {
      aht_control: 40,
      sla_adherence: 30,
      csat_improvement: 20,
      team_handling: 10,
    },
    dimension_weights: {},
    is_default: false,
  },
  {
    id: "jr_sample_pm",
    title: "Product Manager — Outcome First",
    job_family: "product",
    job_family_label: "Product Management",
    claim_weights: {
      outcome_ownership: 40,
      experimentation: 25,
      discovery: 20,
      launch_delivery: 10,
      prioritisation: 5,
    },
    dimension_weights: {},
    is_default: false,
  },
];

// ---------------------------------------------------------------------------
// candidates
//
// `competence` is always `Math.round(weighted * multiplier)`. Rohit is the
// case the product exists to catch: a strong resume (59) whose answers do not
// survive probing, taken down further by a contradiction between two answers.
// ---------------------------------------------------------------------------

type Seed = {
  id: string;
  name: string;
  role: string;
  family: string;
  familyLabel: string;
  resume: number;
  weighted: number;
  multiplier: number;
  contradictions: number;
  badge: CandidateSummary["badge"];
  coverage: number;
  claims: number;
  /** competence under each lens id — the re-ranking, precomputed. */
  perLens: Record<string, number>;
  perLensCoverage: Record<string, number>;
};

const SEEDS: Seed[] = [
  {
    id: "c_sample_meera",
    name: "Meera Nair",
    role: "Senior Product Manager",
    family: "product",
    familyLabel: "Product Management",
    resume: 50,
    weighted: 63,
    multiplier: 1,
    contradictions: 0,
    badge: "partial",
    coverage: 85,
    claims: 3,
    perLens: { jr_sample_lead: 60, jr_sample_ops: 60, jr_sample_pm: 63 },
    perLensCoverage: { jr_sample_lead: 0, jr_sample_ops: 0, jr_sample_pm: 85 },
  },
  {
    id: "c_sample_priya",
    name: "Priya Raghavan",
    role: "Support Team Lead",
    family: "bpo_operations",
    familyLabel: "BPO / Contact Centre Operations",
    resume: 28,
    weighted: 56,
    multiplier: 1,
    contradictions: 0,
    badge: "partial",
    coverage: 78,
    claims: 3,
    perLens: { jr_sample_lead: 68, jr_sample_ops: 33, jr_sample_pm: 50 },
    perLensCoverage: { jr_sample_lead: 82, jr_sample_ops: 70, jr_sample_pm: 12 },
  },
  {
    id: "c_sample_arjun",
    name: "Arjun Mehta",
    role: "Process and Quality Lead",
    family: "bpo_operations",
    familyLabel: "BPO / Contact Centre Operations",
    resume: 34,
    weighted: 46,
    multiplier: 1,
    contradictions: 0,
    badge: "partial",
    coverage: 80,
    claims: 3,
    perLens: { jr_sample_lead: 28, jr_sample_ops: 63, jr_sample_pm: 53 },
    perLensCoverage: { jr_sample_lead: 64, jr_sample_ops: 80, jr_sample_pm: 18 },
  },
  {
    id: "c_sample_rohit",
    name: "Rohit Verma",
    role: "Senior Team Lead",
    family: "bpo_operations",
    familyLabel: "BPO / Contact Centre Operations",
    resume: 59,
    weighted: 24,
    multiplier: 0.6,
    contradictions: 1,
    badge: "unverified",
    coverage: 70,
    claims: 3,
    perLens: { jr_sample_lead: 17, jr_sample_ops: 9, jr_sample_pm: 13 },
    perLensCoverage: { jr_sample_lead: 70, jr_sample_ops: 70, jr_sample_pm: 10 },
  },
];

function whyRanked(seed: Seed, lens: RoleOut | null): string {
  const signals = Math.round(seed.weighted * 0.85) + 6;
  const top = lens
    ? Object.entries(lens.claim_weights).sort((a, b) => b[1] - a[1])[0]
    : null;
  const lensClause = top
    ? ` this lens weights ${top[0].replace(/_/g, " ")} most (${top[1]}%), scored ${
        lens ? (seed.perLens[lens.id] ?? seed.weighted) : seed.weighted
      }.`
    : ` scored ${seed.weighted} on its job family's default weights.`;
  return (
    `${signals} evidence signals across ${seed.claims} claims, 6 of 6 dimensions probed; ` +
    `strongest on concrete figures (${Math.min(100, seed.weighted + 30)}); ` +
    `${seed.contradictions === 0 ? "no contradictions" : `${seed.contradictions} contradiction`};` +
    lensClause
  );
}

function summary(seed: Seed, lens: RoleOut | null): CandidateSummary {
  const competence = lens
    ? (seed.perLens[lens.id] ?? Math.round(seed.weighted * seed.multiplier))
    : Math.round(seed.weighted * seed.multiplier);
  return {
    id: seed.id,
    name: seed.name,
    role: seed.role,
    job_family: seed.family,
    job_family_label: seed.familyLabel,
    why_ranked: whyRanked(seed, lens),
    resume_score: seed.resume,
    weighted_evidence_score: seed.weighted,
    competence_score: competence,
    badge: seed.badge,
    role_coverage: lens ? (seed.perLensCoverage[lens.id] ?? seed.coverage) : seed.coverage,
    consistency_score: Math.round(seed.multiplier * 100),
    contradiction_count: seed.contradictions,
    state: "COMPLETE",
    claims_count: seed.claims,
    questions_asked: 12,
    computed_at: NOW,
  };
}

/** The ranked list, re-ordered per lens exactly as the backend would. */
export function fixtureRanked(roleId?: string | null): RankedCandidates {
  const lens = FIXTURE_ROLES.find((r) => r.id === roleId) ?? null;
  const rows = SEEDS.map((seed) => summary(seed, lens)).sort(
    (a, b) => b.competence_score - a.competence_score,
  );
  return {
    scored_for: lens
      ? { id: lens.id, title: lens.title, job_family: lens.job_family }
      : null,
    candidates: rows,
  };
}

// ---------------------------------------------------------------------------
// the evidence graph
// ---------------------------------------------------------------------------

const BPO_CLAIMS: ClaimGraph[] = [
  {
    id: "cl_sample_1",
    text: "Reduced average handling time from 9 minutes to 6 minutes over three quarters",
    claim_type: "aht_control",
    claim_type_label: "AHT / productivity control",
    metric: "AHT",
    weight: 40,
    claim_score: 62,
    probed_dimensions: 6,
    summary: "Rebuilt the escalation matrix after finding tier-1 escalating what it could close.",
    dimensions: [
      dim("KNOWLEDGE", 72, 3, [
        "AHT is talk time plus after-call work, measured in Freshdesk.",
        "Tier-1 was escalating billing disputes it could close itself, so we gave them a refund limit and AHT dropped.",
      ], "• Explained concept: escalation matrix — which tier can close what\n• Defined metric computation: AHT (talk time plus after-call work, measured in Freshdesk)"),
      dim("EXECUTION", 88, 6, [
        "Every Monday I pulled the longest calls and listened to five of them with the agent.",
        "We ran the SLA dashboard out of Freshdesk.",
      ], "• Executed step: pulled the longest calls every Monday and listened to five with the agent\n• Applied tool in workflow: Freshdesk (SLA dashboard)\n• Measured parameter: 9 to 6 minutes AHT"),
      dim("PROBLEM_SOLVING", 74, 3, [
        "Tier-1 was escalating billing disputes it could close itself, so we gave them a refund limit and AHT dropped.",
        "I remember the week we changed the refund limit — two agents refused to use it until I sat with them.",
      ], "• Diagnosed incident: two agents refused to use the new refund limit\n• Isolated cause & outcome: tier-1 escalating billing disputes it could close -> AHT dropped"),
      dim("JUDGMENT", 80, 2, [
        "I considered adding headcount and rejected it — the queue was not the problem.",
      ], "• Evaluated decision tradeoff: gave tier-1 a refund limit rather than adding headcount\n• Navigated constraint: the queue was not the bottleneck, so more agents would not have moved AHT"),
      dim("OWNERSHIP", 62, 3, [
        "AHT was 9 minutes when I took over and 6 minutes three quarters later.",
        "We ran two shifts of 14 agents each.",
      ], "• Defined scope boundary: owned AHT from the point of takeover\n• Owned operational action: ran the Monday call review personally\n• Interacted with team/role: two shifts of 14 agents"),
      dim("ADAPTABILITY", 63, 2, [
        "I would check after-call work before talk time — if the matrix is tight and AHT is long, the time is usually going into notes and disposition, not the conversation.",
      ], "• Prospective reasoning: check after-call work before talk time when the matrix is already tight\n• Conceptual transfer: where AHT hides once escalation is no longer the constraint"),
    ],
    qa: [
      qa("VALIDATION", 'On "Reduced average handling time from 9 minutes to 6 minutes" — Tell me more about this. What exactly was your scope, and what were the numbers?', "We ran two shifts of 14 agents each. AHT was 9 minutes when I took over and 6 minutes three quarters later.", 58, "s1a"),
      qa("OPERATIONAL", "How did this work day to day? Walk me through the steps and the systems you used.", "Every Monday I pulled the longest calls and listened to five of them with the agent. We ran the SLA dashboard out of Freshdesk.", 64, "s1b"),
      qa("DECISION", "What did you decide to do about it, and what did you consider but decide against?", "Tier-1 was escalating billing disputes it could close itself, so we gave them a refund limit and AHT dropped. I considered adding headcount and rejected it — the queue was not the problem.", 71, "s1c"),
      qa("INCIDENT", "Tell me about one specific time this went wrong. What happened that week?", "I remember the week we changed the refund limit — two agents refused to use it until I sat with them and we worked three cases together.", 55, "s1d"),
      qa("TRANSFER", "If you joined a team where the escalation matrix was already tight and AHT still ran long, where would you look first?", "I would check after-call work before talk time — if the matrix is tight and AHT is long, the time is usually going into notes and disposition, not the conversation.", 63, "s1e"),
    ],
    facts: [
      { key: "aht_minutes", value_num: 6, value_text: null, unit: "min", quote: "6 minutes three quarters later" },
      { key: "team_size", value_num: 14, value_text: null, unit: null, quote: "two shifts of 14 agents each" },
    ],
  },
  {
    id: "cl_sample_2",
    text: "Improved CSAT from 3.6 to 4.4 by introducing a weekly quality audit of 30 calls",
    claim_type: "csat_improvement",
    claim_type_label: "CSAT / quality improvement",
    metric: "CSAT",
    weight: 30,
    claim_score: 48,
    probed_dimensions: 4,
    summary: "Weekly audit of 30 calls, scored against a rubric the team wrote.",
    dimensions: [
      dim("KNOWLEDGE", 45, 1, ["CSAT is the post-call survey average."]),
      dim("EXECUTION", 74, 4, [
        "We audited 30 calls a week against a rubric the team wrote themselves.",
        "CSAT went 3.6 to 4.4 across two quarters.",
      ]),
      dim("OWNERSHIP", 52, 2, ["We audited 30 calls a week against a rubric the team wrote themselves."]),
      dim("ADAPTABILITY", 50, 1, ["Agents started hearing their own calls, which changed how they opened."]),
      unprobed("PROBLEM_SOLVING"),
      unprobed("JUDGMENT"),
    ],
    qa: [
      qa("VALIDATION", 'On "Improved CSAT from 3.6 to 4.4" — Tell me more about this.', "CSAT went 3.6 to 4.4 across two quarters. We audited 30 calls a week against a rubric the team wrote themselves.", 52, "s2a"),
      qa("OUTCOME", "What happened afterwards? How did you know it worked, and which number moved?", "Agents started hearing their own calls, which changed how they opened. CSAT is the post-call survey average.", 44, "s2b"),
    ],
    facts: [
      { key: "csat_score", value_num: 4.4, value_text: null, unit: null, quote: "CSAT went 3.6 to 4.4" },
    ],
  },
  {
    id: "cl_sample_3",
    text: "Managed a team of 14 support agents across two shifts",
    claim_type: "team_handling",
    claim_type_label: "Team handling",
    metric: null,
    weight: 25,
    claim_score: null,
    probed_dimensions: 0,
    summary: null,
    dimensions: COMPETENCE_DIMENSIONS.map(unprobed),
    qa: [],
    facts: [],
  },
];

const PRODUCT_CLAIMS: ClaimGraph[] = [
  {
    id: "cl_sample_p1",
    text: "Grew activation from 41% to 63% over two quarters by rebuilding onboarding",
    claim_type: "outcome_ownership",
    claim_type_label: "Moved a product outcome",
    metric: "activation",
    weight: 40,
    claim_score: 74,
    probed_dimensions: 6,
    summary: "Pre-filled the empty state after finding users never saw their own data.",
    dimensions: [
      dim("KNOWLEDGE", 84, 4, [
        "We measured activation as the percentage of new signups completing their first project.",
        "Activation was stalling because new users never saw their own data, so we pre-filled the empty state.",
      ], "• Explained concept: activation as first-project completion, not signup\n• Defined metric computation: activation (% of new signups completing their first project)"),
      dim("EXECUTION", 96, 8, [
        "Every Monday I reviewed the funnel drop-off step by step, then picked the single worst step.",
        "We instrumented the funnel in Amplitude.",
      ], "• Executed step: reviewed funnel drop-off step by step every Monday, then picked the single worst step\n• Applied tool in workflow: Amplitude (funnel instrumentation)\n• Measured parameter: 41% to 63% activation"),
      dim("PROBLEM_SOLVING", 82, 3, [
        "Activation was stalling because new users never saw their own data, so we pre-filled the empty state.",
        "I remember the week we shipped a new empty state and activation dropped four points before it recovered.",
      ], "• Diagnosed incident: shipped a new empty state and activation dropped four points\n• Isolated cause & outcome: new users never saw their own data -> pre-filled the empty state"),
      dim("JUDGMENT", 70, 2, [
        "I would have instrumented the funnel before rebuilding it rather than after.",
      ], "• Evaluated decision tradeoff: rebuilt onboarding before instrumenting, and would reverse that order\n• Navigated constraint: no funnel instrumentation existed when the call was made"),
      dim("OWNERSHIP", 71, 3, [
        "Activation was 41% when I took it over and 63% two quarters later.",
      ], "• Defined scope boundary: owned activation from takeover through the rebuild\n• Owned operational action: picked the single worst funnel step each week"),
      dim("ADAPTABILITY", 58, 2, [
        "I would have instrumented the funnel before rebuilding it rather than after.",
        "Afterwards day-30 retention held at 58% for two quarters.",
      ], "• Prospective reasoning: instrument before rebuilding, not after\n• Complete transfer cause: pre-filled empty state -> day-30 retention held at 58% for two quarters"),
    ],
    qa: [
      qa("VALIDATION", 'On "Grew activation from 41% to 63%" — Tell me more about this.', "Activation was 41% when I took it over and 63% two quarters later. We measured activation as the percentage of new signups completing their first project.", 68, "sp1a"),
      qa("DECISION", "What did you decide to do about it, and what did you consider but decide against?", "Activation was stalling because new users never saw their own data, so we pre-filled the empty state. I would have instrumented the funnel before rebuilding it rather than after.", 74, "sp1b"),
      qa("INCIDENT", "Tell me about one specific time this went wrong.", "I remember the week we shipped a new empty state and activation dropped four points before it recovered.", 61, "sp1c"),
      qa("OUTCOME", "What happened afterwards? Which number moved?", "Afterwards day-30 retention held at 58% for two quarters.", 66, "sp1d"),
    ],
    facts: [
      { key: "activation_pct", value_num: 63, value_text: null, unit: "%", quote: "63% two quarters later" },
      { key: "retention_d30", value_num: 58, value_text: null, unit: "%", quote: "day-30 retention held at 58%" },
    ],
  },
  {
    id: "cl_sample_p2",
    text: "Ran 40 user interviews to find the top three pain points before writing the PRD",
    claim_type: "discovery",
    claim_type_label: "User research and problem discovery",
    metric: "40",
    weight: 20,
    claim_score: 51,
    probed_dimensions: 4,
    summary: "Recruited from the churned cohort rather than active users.",
    dimensions: [
      dim("KNOWLEDGE", 48, 1, ["We validated it with a survey of 300 users, and 61% named the same problem unprompted."]),
      dim("EXECUTION", 92, 5, [
        "I ran 40 user interviews across three segments over six weeks.",
        "First I recruited from the churned cohort rather than active users, then I tagged each transcript against the problem statement.",
      ]),
      dim("PROBLEM_SOLVING", 60, 1, ["An operations lead showed me she was exporting to a spreadsheet every morning because our dashboard could not show week-on-week change."]),
      dim("JUDGMENT", 66, 2, ["First I recruited from the churned cohort rather than active users, then I tagged each transcript against the problem statement."]),
      unprobed("OWNERSHIP"),
      unprobed("ADAPTABILITY"),
    ],
    qa: [
      qa("VALIDATION", 'On "Ran 40 user interviews" — Tell me more about this.', "I ran 40 user interviews across three segments over six weeks. The top pain point was that people could not tell whether their import had actually worked.", 49, "sp2a"),
      qa("INCIDENT", "Tell me about one specific time this went wrong.", "An operations lead showed me she was exporting to a spreadsheet every morning because our dashboard could not show week-on-week change, so we built that view.", 57, "sp2b"),
    ],
    facts: [
      { key: "interviews", value_num: 40, value_text: null, unit: null, quote: "I ran 40 user interviews" },
    ],
  },
  {
    id: "cl_sample_p3",
    text: "Ran 18 experiments in a year and shipped 5 of them",
    claim_type: "experimentation",
    claim_type_label: "Experimentation and measurement",
    metric: "18",
    weight: 25,
    claim_score: 44,
    probed_dimensions: 2,
    summary: null,
    dimensions: [
      dim("EXECUTION", 76, 4, ["We ran 18 experiments that year and shipped 5 of them."]),
      dim("JUDGMENT", 52, 1, ["The ones we shipped were the ones with a clear mechanism, not just a lift."]),
      unprobed("KNOWLEDGE"),
      unprobed("PROBLEM_SOLVING"),
      unprobed("OWNERSHIP"),
      unprobed("ADAPTABILITY"),
    ],
    qa: [
      qa("VALIDATION", 'On "Ran 18 experiments in a year" — Tell me more about this.', "We ran 18 experiments that year and shipped 5 of them. The ones we shipped were the ones with a clear mechanism, not just a lift.", 46, "sp3a"),
    ],
    facts: [
      { key: "experiments", value_num: 18, value_text: null, unit: null, quote: "18 experiments that year" },
    ],
  },
];

/** Rohit's graph carries the contradiction — the case the product exists for. */
const FABRICATOR_CLAIMS: ClaimGraph[] = BPO_CLAIMS.map((claim, index) =>
  index === 0
    ? {
        ...claim,
        claim_score: 18,
        summary: "Numbers moved between answers; the detail did not hold up under probing.",
        dimensions: claim.dimensions.map((d) =>
          d.probed ? { ...d, score: Math.round(d.score * 0.3), signal_count: 1 } : d,
        ),
        facts: [
          { key: "team_size", value_num: 45, value_text: null, unit: null, quote: "a team of 45" },
        ],
      }
    : { ...claim, claim_score: index === 1 ? 12 : null },
);

export function fixtureGraph(
  candidateId?: string,
  roleId?: string | null,
): CandidateGraph {
  const seed = SEEDS.find((s) => s.id === candidateId) ?? SEEDS[0];
  const lens = FIXTURE_ROLES.find((r) => r.id === roleId) ?? null;
  const isProduct = seed.family === "product";
  const claims =
    seed.id === "c_sample_rohit"
      ? FABRICATOR_CLAIMS
      : isProduct
        ? PRODUCT_CLAIMS
        : BPO_CLAIMS;

  const competence = lens
    ? (seed.perLens[lens.id] ?? Math.round(seed.weighted * seed.multiplier))
    : Math.round(seed.weighted * seed.multiplier);
  // Keep `weighted × multiplier = competence` true under every lens, so the
  // consistency panel never prints a sum that does not add up. `ceil` rather
  // than `round` because it reproduces what the real pipeline produces: the
  // seed's fabricator is weighted 24 with a 0.60 multiplier, and 24 × 0.60
  // rounds to 14. Deriving 23 from 14 instead would print "23 × 0.60 = 14",
  // which is true after rounding and looks like a typo.
  const weighted = Math.ceil(competence / seed.multiplier);

  // The active framework, in the backend's own order. Legacy dimensions stay
  // in the type — an evaluation finalized under them must still render — but
  // no NEW reading is produced on them, so sample data must not produce one.
  const profile: Dimension[] = [...COMPETENCE_DIMENSIONS];

  return {
    candidate: {
      id: seed.id,
      name: seed.name,
      role: seed.role,
      // Masked, and deliberately not derived from the id — slicing the id
      // produced "+9198*****hit", which looks like a rendering bug.
      phone: "+9198 ***** 00" + (SEEDS.indexOf(seed) + 1),
    },
    job_family: seed.family,
    job_family_label: seed.familyLabel,
    routing_confidence: seed.id === "c_sample_arjun" ? 0.12 : 0.58,
    scored_for: lens
      ? { id: lens.id, title: lens.title, job_family: lens.job_family }
      : null,
    state: "COMPLETE",
    questions_asked: 12,
    resume_score: seed.resume,
    weighted_evidence_score: weighted,
    competence_score: competence,
    badge: seed.badge,
    role_coverage: lens ? (seed.perLensCoverage[lens.id] ?? seed.coverage) : seed.coverage,
    consistency: {
      score: Math.round(seed.multiplier * 100),
      multiplier: seed.multiplier,
      facts_tracked: 4,
      note:
        seed.contradictions === 0
          ? "No contradictions detected across the session."
          : "One tracked fact changed materially between answers.",
      contradictions:
        seed.contradictions === 0
          ? []
          : [
              {
                fact_key: "team_size",
                fact_label: "Team size",
                earlier_value: "14",
                later_value: "45",
                earlier_response_id: "r_s1a",
                later_response_id: "r_s1d",
                severity: "MAJOR",
                delta_pct: 221,
                note: "Team size is a stable fact — it should not more than triple between two answers in the same session.",
              },
            ],
    },
    dimension_profile: profile.map((d) => {
      const rows = claims.flatMap((c) => c.dimensions.filter((x) => x.dimension === d && x.probed));
      if (rows.length === 0) return unprobed(d);
      const best = Math.max(...rows.map((r) => r.score));
      const signals = rows.reduce((n, r) => n + r.signal_count, 0);
      return {
        dimension: d,
        score: best,
        signal_count: signals,
        basis: `across ${claims.length} claim(s)`,
        quotes: rows.flatMap((r) => r.quotes).slice(0, 3),
        probed: true,
      };
    }),
    claims,
    computed_at: NOW,
  };
}

// ---------------------------------------------------------------------------
// the rest of the read surface
// ---------------------------------------------------------------------------

export const FIXTURE_HEALTH: HealthOut = {
  status: "ok",
  database: "sample",
  llm_mode: "fixture",
  model: null,
  whatsapp: "dry-run",
  max_questions: 12,
  job_families: 9,
  taxonomy_version: "sample",
  rubric_version: "sample",
  scoring_version: "sample",
  question_policy_version: "sample",
  code_version: "sample",
  // Same hash the sample evaluations carry: health reports what THIS build
  // would stamp, and those were stamped by it.
  evaluation_version: "evx_5a3f1c8e0b7d4926",
};

export const FIXTURE_SESSION: SessionOut = {
  session_id: "s_sample",
  candidate_id: "c_sample_meera",
  state: "COMPLETE",
  channel: "simulated",
  job_family: "product",
  questions_asked: 12,
  max_questions: 12,
  current_claim_id: "cl_sample_p1",
  current_probe_level: "OUTCOME",
  next_question: null,
  opt_in_code: "SAMPLE",
};

export const FIXTURE_OUTCOMES: OutcomeOut[] = [
  {
    id: "o_sample_1",
    candidate_id: "c_sample_meera",
    role_id: "jr_sample_pm",
    decision: "shortlisted",
    stage: "Screening",
    decided_by: "Sample recruiter",
    note: "Strong causal reasoning, wanted a second read on metric ownership.",
    decided_at: "2026-09-02T11:00:00Z",
  },
  {
    id: "o_sample_2",
    candidate_id: "c_sample_meera",
    role_id: "jr_sample_pm",
    decision: "interviewed",
    stage: "Round 1",
    decided_by: "Sample recruiter",
    note: null,
    decided_at: "2026-09-03T14:30:00Z",
  },
];

/** Below the floor on purpose: this is what the real report looks like before
 *  thirty decisions exist, and inventing a correlation here would misrepresent
 *  the one screen whose whole job is to be falsifiable. */
export const FIXTURE_VALIDATION: ValidationOut = {
  generated_at: NOW,
  minimum_n: 30,
  overall: {
    job_family: "overall",
    n_decided: 2,
    sufficient: false,
    competence_correlation: null,
    resume_correlation: null,
    competence_precision_at_5: null,
    resume_precision_at_5: null,
    inversions_caught: 1,
  },
  cohorts: [
    {
      job_family: "bpo_operations",
      n_decided: 0,
      sufficient: false,
      competence_correlation: null,
      resume_correlation: null,
      competence_precision_at_5: null,
      resume_precision_at_5: null,
      inversions_caught: 1,
    },
    {
      job_family: "product",
      n_decided: 2,
      sufficient: false,
      competence_correlation: null,
      resume_correlation: null,
      competence_precision_at_5: null,
      resume_precision_at_5: null,
      inversions_caught: 0,
    },
  ],
};

/**
 * Both families carry the SAME dimension weights, and that is not a
 * copy-paste slip: in `data/claim_taxonomy.json` neither family overrides
 * `dimension_weights`, so both inherit the global defaults renormalised to
 * 1.0. What differentiates a family is its claim types, not how it weights
 * competence — a Team Lead and a PM are asked about different things, then
 * judged on the same six. Inventing a difference here would make the sample
 * data argue for a design the backend does not have.
 *
 * These are the exact values `api.taxonomy.dimension_weights()` returns.
 */
const DEFAULT_DIMENSION_WEIGHTS: Record<string, number> = {
  KNOWLEDGE: 0.173077,
  EXECUTION: 0.211538,
  PROBLEM_SOLVING: 0.173077,
  JUDGMENT: 0.173077,
  OWNERSHIP: 0.153846,
  ADAPTABILITY: 0.115385,
};

const BPO_TAXONOMY: TaxonomyFamily = {
  job_family: "bpo_operations",
  claim_types: {
    team_handling: { label: "Team handling", default_weight: 25 },
    csat_improvement: { label: "CSAT / quality improvement", default_weight: 20 },
    aht_control: { label: "AHT / productivity control", default_weight: 15 },
    sla_adherence: { label: "SLA adherence", default_weight: 15 },
    coaching_quality: { label: "Coaching and quality", default_weight: 15 },
    attrition_control: { label: "Attrition control", default_weight: 10 },
  },
  default_claim_weights: {
    team_handling: 25,
    csat_improvement: 20,
    aht_control: 15,
    sla_adherence: 15,
    coaching_quality: 15,
    attrition_control: 10,
  },
  dimension_weights: DEFAULT_DIMENSION_WEIGHTS,
};

const PRODUCT_TAXONOMY: TaxonomyFamily = {
  job_family: "product",
  claim_types: {
    outcome_ownership: { label: "Moved a product outcome", default_weight: 30 },
    experimentation: { label: "Experimentation and measurement", default_weight: 25 },
    discovery: { label: "User research and problem discovery", default_weight: 20 },
    launch_delivery: { label: "Launch delivery", default_weight: 15 },
    prioritisation: { label: "Prioritisation", default_weight: 10 },
  },
  default_claim_weights: {
    outcome_ownership: 30,
    experimentation: 25,
    discovery: 20,
    launch_delivery: 15,
    prioritisation: 10,
  },
  dimension_weights: DEFAULT_DIMENSION_WEIGHTS,
};

export function fixtureTaxonomy(jobFamily?: string): TaxonomyFamily {
  return jobFamily === "product" ? PRODUCT_TAXONOMY : BPO_TAXONOMY;
}

export const FIXTURE_TAXONOMY_ALL: TaxonomyAll = {
  families: {
    bpo_operations: {
      label: "BPO / Contact Centre Operations",
      claim_types: BPO_TAXONOMY.claim_types,
      dimension_weights: BPO_TAXONOMY.dimension_weights,
    },
    product: {
      label: "Product Management",
      claim_types: PRODUCT_TAXONOMY.claim_types,
      dimension_weights: PRODUCT_TAXONOMY.dimension_weights,
    },
  },
};

// ---------------------------------------------------------------------------
// EVALUATIONS — the auditable record
//
// The one thing this block is careful about: an evaluation is a score PLUS the
// fingerprint of the inputs that produced it, and the fingerprint is what says
// whether two scores can be compared at all. So Rohit deliberately carries two
// evaluations under DIFFERENT fingerprints. A screen that let a reader put 31
// and 14 side by side and conclude "he got worse" would be teaching exactly
// the wrong reading of this data — the rubric moved, so those numbers are not
// on the same scale. Sample data that only ever showed one fingerprint would
// never exercise that warning.
// ---------------------------------------------------------------------------

/** The current stamp. Matches FIXTURE_HEALTH.evaluation_version on purpose:
 *  health reports what this build would stamp, and these were stamped by it. */
const FINGERPRINT = "evx_5a3f1c8e0b7d4926";
/** An earlier rubric. Different hash, therefore not comparable — that is the
 *  entire meaning of the field. */
const OLD_FINGERPRINT = "evx_c07b9e41f28a6d53";

export const FIXTURE_PROVENANCE: ProvenanceOut = {
  taxonomy_version: "2026.09.1",
  taxonomy_hash: "sha256:4f1c9a2e",
  rubric_version: "2026.09.1",
  scoring_version: "2026.09.1",
  question_policy_version: "2026.08.3",
  prompt_versions: {
    claim_extraction: "2026.08.2",
    question_generation: "2026.08.3",
    signal_extraction: "2026.09.1",
  },
  code_version: "sample",
  app_version: "0.1.0",
  llm_mode: "fixture",
  model_requested: null,
  model_returned: null,
  feature_flags: {
    REQUIRE_API_KEY: "false",
    ENABLE_DEV_ENDPOINTS: "true",
    MAX_QUESTIONS: "12",
  },
  evaluation_version: FINGERPRINT,
};

export const FIXTURE_PROVENANCE_STAMP: ProvenanceStampOut = {
  ...FIXTURE_PROVENANCE,
  fingerprint_material: {
    taxonomy_version: FIXTURE_PROVENANCE.taxonomy_version,
    taxonomy_hash: FIXTURE_PROVENANCE.taxonomy_hash,
    rubric_version: FIXTURE_PROVENANCE.rubric_version,
    scoring_version: FIXTURE_PROVENANCE.scoring_version,
    question_policy_version: FIXTURE_PROVENANCE.question_policy_version,
    prompt_versions: FIXTURE_PROVENANCE.prompt_versions,
    code_version: FIXTURE_PROVENANCE.code_version,
    app_version: FIXTURE_PROVENANCE.app_version,
    llm_mode: FIXTURE_PROVENANCE.llm_mode,
    model_requested: FIXTURE_PROVENANCE.model_requested,
    feature_flags: FIXTURE_PROVENANCE.feature_flags,
  },
  fingerprint_excludes: [
    "model_returned — a per-process observation, not a per-evaluation fact",
    "timestamps and candidate identity — an unchanged system stays comparable",
  ],
};

type EvalSeed = {
  id: string;
  seedId: string;
  status: "draft" | "finalized";
  createdAt: string;
  finalizedAt: string | null;
  competence: number | null;
  version: string;
};

/** One current evaluation each, plus Rohit's superseded one. */
const EVAL_SEEDS: EvalSeed[] = [
  {
    id: "ev_sample_meera",
    seedId: "c_sample_meera",
    status: "finalized",
    // Before the two recorded outcomes, because a decision cannot precede the
    // assessment it was made on — and the audit trail is sorted by time, so
    // getting this wrong would print exactly that impossibility.
    createdAt: "2026-09-01T09:40:00Z",
    finalizedAt: "2026-09-01T10:05:00Z",
    competence: null,
    version: FINGERPRINT,
  },
  {
    id: "ev_sample_priya",
    seedId: "c_sample_priya",
    status: "finalized",
    createdAt: "2026-09-04T08:12:00Z",
    finalizedAt: NOW,
    competence: null,
    version: FINGERPRINT,
  },
  {
    id: "ev_sample_arjun",
    seedId: "c_sample_arjun",
    status: "finalized",
    createdAt: "2026-09-04T07:55:00Z",
    finalizedAt: NOW,
    competence: null,
    version: FINGERPRINT,
  },
  {
    id: "ev_sample_rohit",
    seedId: "c_sample_rohit",
    status: "finalized",
    createdAt: "2026-09-04T07:30:00Z",
    finalizedAt: NOW,
    competence: null,
    version: FINGERPRINT,
  },
  {
    id: "ev_sample_rohit_prior",
    seedId: "c_sample_rohit",
    status: "finalized",
    createdAt: "2026-08-21T10:05:00Z",
    finalizedAt: "2026-08-21T10:41:00Z",
    // Higher than the current reading, under an older rubric. The two are NOT
    // comparable, and the differing fingerprint below is what says so.
    competence: 31,
    version: OLD_FINGERPRINT,
  },
];

function evalSeed(evaluationId: string): EvalSeed {
  return EVAL_SEEDS.find((e) => e.id === evaluationId) ?? EVAL_SEEDS[0];
}

/** NEWEST FIRST, matching the endpoint. */
export function fixtureEvaluations(candidateId?: string): EvaluationSummary[] {
  const seed = SEEDS.find((s) => s.id === candidateId) ?? SEEDS[0];
  return EVAL_SEEDS.filter((e) => e.seedId === seed.id)
    .map((e) => {
      const graph = fixtureGraph(seed.id, null);
      const competence = e.competence ?? graph.competence_score;
      return {
        id: e.id,
        status: e.status,
        session_id: `s_${e.id}`,
        role_id: null,
        created_at: e.createdAt,
        finalized_at: e.finalizedAt,
        competence_score: competence,
        weighted_evidence_score:
          e.competence === null
            ? graph.weighted_evidence_score
            : Math.ceil(competence / seed.multiplier),
        badge: graph.badge,
        evaluation_version: e.version,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function fixtureEvaluation(evaluationId?: string): EvaluationOut {
  const e = evalSeed(evaluationId ?? "");
  const seed = SEEDS.find((s) => s.id === e.seedId) ?? SEEDS[0];
  const graph = fixtureGraph(seed.id, null);
  const competence = e.competence ?? graph.competence_score;

  return {
    id: e.id,
    status: e.status,
    candidate_id: seed.id,
    candidate_name: seed.name,
    session_id: `s_${e.id}`,
    role_id: null,
    role_title: null,
    job_family: seed.family,
    job_family_label: seed.familyLabel,
    created_at: e.createdAt,
    finalized_at: e.finalizedAt,
    resume_score: seed.resume,
    weighted_evidence_score:
      e.competence === null
        ? graph.weighted_evidence_score
        : Math.ceil(competence / seed.multiplier),
    competence_score: competence,
    badge: graph.badge,
    consistency_score: graph.consistency.score,
    contradiction_count: seed.contradictions,
    role_coverage: seed.coverage,
    claims_scored: graph.claims.filter((c) => c.claim_score !== null).length,
    questions_asked: graph.questions_asked,
    dimension_profile: graph.dimension_profile,
    // Snapshotted, not looked up: `role_id` is SET NULL on delete, so a
    // deleted lens must not be able to make a finalized score unexplainable.
    claim_weights: Object.fromEntries(
      graph.claims.map((c) => [c.claim_type ?? "unclassified", c.weight]),
    ),
    dimension_weights: DEFAULT_DIMENSION_WEIGHTS,
    provenance:
      e.version === FINGERPRINT
        ? FIXTURE_PROVENANCE
        : {
            ...FIXTURE_PROVENANCE,
            taxonomy_version: "2026.08.2",
            taxonomy_hash: "sha256:b83d07f1",
            rubric_version: "2026.08.2",
            scoring_version: "2026.08.2",
            evaluation_version: OLD_FINGERPRINT,
          },
  };
}

export function fixtureEvaluationHistory(
  evaluationId?: string,
): EvaluationHistoryOut {
  const e = evalSeed(evaluationId ?? "");
  const evaluation = fixtureEvaluation(e.id);

  const lifecycle: EvaluationHistoryEntry[] = [
    {
      kind: "evaluation_created",
      at: e.createdAt,
      evaluation_id: e.id,
      outcome_id: null,
      decision: null,
      previous_decision: null,
      decided_by: null,
      stage: null,
      note: null,
      competence_score: null,
      badge: null,
    },
  ];

  if (e.finalizedAt) {
    lifecycle.push({
      kind: "evaluation_finalized",
      at: e.finalizedAt,
      evaluation_id: e.id,
      outcome_id: null,
      decision: null,
      previous_decision: null,
      decided_by: null,
      stage: null,
      note: null,
      competence_score: evaluation.competence_score,
      badge: evaluation.badge,
    });
  }

  // Only the candidate who has recorded decisions gets decision entries, and
  // the second one carries `previous_decision` — a decision that CHANGED is
  // the case the timeline exists to make visible.
  const decisions: EvaluationHistoryEntry[] =
    evaluation.candidate_id === "c_sample_meera" && e.id === "ev_sample_meera"
      ? FIXTURE_OUTCOMES.map((outcome, index) => ({
          kind: "decision" as const,
          at: outcome.decided_at,
          evaluation_id: e.id,
          outcome_id: outcome.id,
          decision: outcome.decision,
          previous_decision: index === 0 ? null : FIXTURE_OUTCOMES[index - 1].decision,
          decided_by: outcome.decided_by,
          stage: outcome.stage,
          note: outcome.note,
          competence_score: null,
          badge: null,
        }))
      : [];

  const entries = [...lifecycle, ...decisions].sort((a, b) => a.at.localeCompare(b.at));

  return {
    evaluation_id: e.id,
    candidate_id: evaluation.candidate_id,
    status: evaluation.status,
    finalized_at: evaluation.finalized_at,
    competence_score: evaluation.competence_score,
    badge: evaluation.badge,
    current_decision: decisions.length
      ? decisions[decisions.length - 1].decision
      : null,
    decisions_recorded: decisions.length,
    entries,
  };
}
