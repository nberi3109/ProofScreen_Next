import {
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import { getHealth } from "@/lib/api/client";
import {
  BADGE_LABEL,
  familyLabel,
  formatCorrelation,
  initials,
  scoreBand,
} from "@/lib/api/format";
import { getRankedCandidates, getValidation } from "@/lib/api/recruiter";

/**
 * The recruiter home.
 *
 * Every figure here is a COUNT OF ROWS the API returned — how many candidates
 * carry each badge, how many have a contradiction on file. None of it is a
 * score this page computed. That distinction is the reason the product's
 * central claim survives contact with a dashboard: if the frontend started
 * averaging competence scores into a headline "pipeline health" number, the
 * sentence "every number a recruiter sees is arithmetic over counted, quoted
 * evidence" would stop being true.
 *
 * The mode banner exists for the same reason. Fixture mode and WhatsApp dry
 * run are perfectly valid ways to run this system, but a demo that cannot tell
 * they are on is a demo that will claim a live model and a sent message when
 * neither happened.
 */
export default async function RecruiterHome() {
  const [ranked, validation, health] = await Promise.all([
    getRankedCandidates(null),
    getValidation(),
    getHealth(),
  ]);

  if (!ranked.ok) {
    return (
      <main className="recruiter-page">
        <div className="recruiter-heading">
          <div>
            <span className="eyebrow">EVIDENT</span>
            <h1>Evidence dashboard</h1>
          </div>
        </div>
        <ApiNotice error={ranked.error} what="the candidate ranking" />
      </main>
    );
  }

  const candidates = ranked.data.candidates;
  const verified = candidates.filter((c) => c.badge === "verified").length;
  const flagged = candidates.filter((c) => c.contradiction_count > 0).length;
  const awaiting = candidates.filter((c) => c.state === "AWAITING_OPT_IN").length;
  const interviewed = candidates.filter((c) => c.questions_asked > 0).length;
  const top = candidates.slice(0, 5);

  const modeWarnings: string[] = [];
  if (health.ok) {
    if (health.data.llm_mode !== "live") {
      modeWarnings.push(
        "FIXTURE MODE — claims, questions and signal extraction come from deterministic heuristics, not a model. Scoring is unchanged.",
      );
    }
    if (health.data.whatsapp !== "live") {
      modeWarnings.push(
        "WHATSAPP DRY RUN — outbound messages are logged, not sent. No candidate has received anything.",
      );
    }
  }

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">EVIDENT</span>
          <h1>Evidence dashboard</h1>
          <p>
            {candidates.length}{" "}
            {candidates.length === 1 ? "candidate" : "candidates"} scored from
            probed evidence.
          </p>
        </div>
        <Link href="/recruiter/candidates" className="primary-button">
          Open the ranking <ArrowRight size={16} />
        </Link>
      </div>

      {modeWarnings.length > 0 && (
        <div className="mode-banner">
          <FlaskConical size={16} />
          <div>
            {modeWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      )}
      {!health.ok && <ApiNotice error={health.error} what="the API mode" />}

      <div className="recruiter-stat-grid">
        <div className="recruiter-stat">
          <span>
            <Users size={17} />
          </span>
          <small>Candidates scored</small>
          <b>{candidates.length}</b>
          <em>{interviewed} have answered at least one question</em>
        </div>
        <div className="recruiter-stat">
          <span>
            <ShieldCheck size={17} />
          </span>
          <small>Verified badge</small>
          <b>{verified}</b>
          <em>enough evidence across enough dimensions</em>
        </div>
        <div className="recruiter-stat">
          <span>
            <AlertTriangle size={17} />
          </span>
          <small>Contradictions on file</small>
          <b>{flagged}</b>
          <em>a tracked fact changed between answers</em>
        </div>
        <div className="recruiter-stat">
          <span>
            <Users size={17} />
          </span>
          <small>Awaiting WhatsApp opt-in</small>
          <b>{awaiting}</b>
          <em>claims extracted, consent not yet given</em>
        </div>
      </div>

      <div className="recruiter-section-head">
        <h2>Top of the default ranking</h2>
        <Link href="/recruiter/candidates">
          All candidates <ArrowRight size={15} />
        </Link>
      </div>

      {top.length === 0 ? (
        <EmptyNotice title="Nothing scored yet.">
          <p>
            Onboard a candidate from{" "}
            <Link href="/candidate/start">the intake screen</Link> and the
            ranking appears here once they have answered on WhatsApp.
          </p>
        </EmptyNotice>
      ) : (
        <div className="mini-ranked">
          {top.map((candidate, index) => (
            <Link href={`/recruiter/candidates/${candidate.id}`} key={candidate.id}>
              <span className="ranked-position">{index + 1}</span>
              <span className="avatar candidate-avatar">
                {initials(candidate.name)}
              </span>
              <span>
                <b>{candidate.name}</b>
                <small>
                  {familyLabel(candidate.job_family, candidate.job_family_label)} ·{" "}
                  {BADGE_LABEL[candidate.badge]}
                </small>
              </span>
              <strong className={`score-${scoreBand(candidate.competence_score)}`}>
                {candidate.competence_score}
              </strong>
              <ArrowRight size={15} />
            </Link>
          ))}
        </div>
      )}

      <div className="recruiter-section-head">
        <h2>Does evidence beat resume screening?</h2>
        <Link href="/recruiter/validation">
          Full report <ArrowRight size={15} />
        </Link>
      </div>

      {validation.ok ? (
        <div className="validation-teaser">
          {validation.data.overall.sufficient ? (
            <>
              <div>
                <b>{formatCorrelation(validation.data.overall.competence_correlation)}</b>
                <small>competence vs recruiter decision</small>
              </div>
              <div>
                <b>{formatCorrelation(validation.data.overall.resume_correlation)}</b>
                <small>resume score vs the same decisions</small>
              </div>
              <div>
                <b>{validation.data.overall.inversions_caught}</b>
                <small>strong-resume, weak-evidence candidates rejected</small>
              </div>
            </>
          ) : (
            <p className="panel-note">
              {validation.data.overall.n_decided} recorded{" "}
              {validation.data.overall.n_decided === 1 ? "decision" : "decisions"} —
              below the floor of {validation.data.minimum_n}, so correlations are
              withheld. A coefficient over a handful of candidates looks like
              evidence and is not.
            </p>
          )}
        </div>
      ) : (
        <ApiNotice error={validation.error} what="the validation report" />
      )}
    </main>
  );
}
