import { MessageSquare, Mic } from "lucide-react";

import DimensionBar from "@/components/recruiter/evidence/DimensionBar";
import { PROBE_LABEL, PROBE_MEANING, scoreBand } from "@/lib/api/format";
import type { ClaimGraph } from "@/lib/api/types";

/**
 * One resume claim, and everything the interview produced about it.
 *
 * Reading order is deliberate and matches how the score was built:
 *   the claim  ->  what the role weights it at  ->  the six dimensions with
 *   their bases and quotes  ->  the actual questions and answers  ->  the
 *   durable facts extracted from them.
 *
 * The transcript is last but never omitted. A recruiter who distrusts the
 * number has to be able to reach the raw answer in one click, or the number is
 * just a nicer-looking assertion.
 */
export default function ClaimEvidence({ claim }: { claim: ClaimGraph }) {
  const unscored = claim.claim_score === null;

  return (
    <article className="claim-card">
      <header className="claim-head">
        <div>
          <span className="claim-type">{claim.claim_type_label}</span>
          <h3>{claim.text}</h3>
          <p className="claim-meta">
            {claim.metric ? (
              <>
                Metric <b>{claim.metric}</b> ·{" "}
              </>
            ) : null}
            Role weight <b>{claim.weight.toFixed(1)}</b> · {claim.probed_dimensions}{" "}
            of 6 dimensions probed
          </p>
        </div>
        <div className={`claim-score ${unscored ? "" : `score-${scoreBand(claim.claim_score!)}`}`}>
          {unscored ? <em>not scored</em> : <b>{claim.claim_score}</b>}
          <small>{unscored ? "no answers yet" : "claim score"}</small>
        </div>
      </header>

      {claim.summary && <p className="claim-summary">{claim.summary}</p>}

      <div className="dim-list">
        {claim.dimensions.map((dim) => (
          <DimensionBar dim={dim} key={dim.dimension} />
        ))}
      </div>

      {claim.qa.length > 0 && (
        <details className="qa-block">
          <summary>
            <MessageSquare size={13} /> Transcript — {claim.qa.length}{" "}
            {claim.qa.length === 1 ? "exchange" : "exchanges"}
          </summary>
          <ol className="qa-list">
            {claim.qa.map((turn, index) => (
              <li key={turn.response_id ?? `${index}`}>
                <div className="qa-level">
                  <span title={PROBE_MEANING[turn.probe_level]}>
                    {PROBE_LABEL[turn.probe_level]}
                  </span>
                  {turn.answered_by === "voice" && (
                    <em>
                      <Mic size={11} />
                      {turn.voice
                        ? ` ${Math.round(turn.voice.duration_seconds)}s · ${turn.voice.word_count} words`
                        : " voice note"}
                    </em>
                  )}
                  {turn.answer_score !== null && <b>{turn.answer_score}</b>}
                </div>
                <p className="qa-question">{turn.question}</p>
                <p className="qa-answer">{turn.answer}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {claim.facts.length > 0 && (
        <details className="facts-block">
          <summary>
            Facts on record — {claim.facts.length}
          </summary>
          <p className="facts-note">
            The values the consistency engine compares across answers. A stable
            key that changes between answers is a contradiction; a variable one
            that changes is just an improvement.
          </p>
          <ul className="fact-list">
            {claim.facts.map((fact, index) => (
              <li key={`${fact.key}-${index}`}>
                <b>{fact.key}</b>
                <span>
                  {fact.value_num !== null
                    ? `${fact.value_num}${fact.unit ? ` ${fact.unit}` : ""}`
                    : (fact.value_text ?? "—")}
                </span>
                {fact.quote && <em>&ldquo;{fact.quote}&rdquo;</em>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
