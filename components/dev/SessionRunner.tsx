"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import VoiceRecorder from "@/components/candidate/proof/VoiceRecorder";
import { answerSimulatedSession, startSimulatedSession } from "@/lib/api/actions";
import { PROBE_LABEL, PROBE_MEANING } from "@/lib/api/format";
import type { Contradiction, ProbeLevel, SessionOut } from "@/lib/api/types";

type Turn = {
  question: string;
  level: ProbeLevel | null;
  answer: string;
  score: number;
  contradictions: Contradiction[];
};

/**
 * Steps one answer at a time through /api/dev/sessions/{id}/start and /answer.
 *
 * Worth watching rather than just running, because this is where the adaptive
 * part is visible: each answer decides the next question's LEVEL. A vague
 * answer gets validated again; a good one escalates towards incident, decision
 * and outcome; a claim that has stalled twice gets a TRANSFER probe — a
 * situation the candidate never described, assembled from their own claims. A
 * memorised resume can be recited. It cannot be transferred.
 *
 * Dev-only, and the banner says so. The real channel is WhatsApp, and this
 * path skips the opt-in that represents consent.
 */
export default function SessionRunner({
  sessionId,
  initial,
}: {
  sessionId: string;
  initial: SessionOut;
}) {
  const [question, setQuestion] = useState(initial.next_question);
  const [level, setLevel] = useState<ProbeLevel | null>(
    initial.current_probe_level,
  );
  const [asked, setAsked] = useState(initial.questions_asked);
  const [history, setHistory] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [seconds, setSeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(initial.state === "COMPLETE");

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await startSimulatedSession(sessionId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setQuestion(result.data.next_question);
    setLevel(result.data.current_probe_level);
    setAsked(result.data.questions_asked);
    setDone(result.data.state === "COMPLETE");
  }

  async function send() {
    if (!question) return;
    setBusy(true);
    setError(null);
    const result = await answerSimulatedSession(sessionId, draft, seconds);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHistory((previous) => [
      ...previous,
      {
        question,
        level,
        answer: result.data.accepted_text,
        score: result.data.answer_score,
        contradictions: result.data.contradictions,
      },
    ]);
    setDraft("");
    setSeconds(null);
    setQuestion(result.data.next_question);
    setLevel(result.data.next_probe_level);
    setAsked(result.data.questions_asked);
    setDone(result.data.done || result.data.state === "COMPLETE");
  }

  const progress =
    initial.max_questions > 0
      ? Math.min(100, Math.round((asked / initial.max_questions) * 100))
      : 0;

  return (
    <>
      <div className="mode-banner">
        <FlaskConical size={16} />
        <div>
          <p>
            SIMULATOR — the real interview happens on WhatsApp. This path skips
            the opt-in message, which is the candidate&apos;s consent step.
          </p>
        </div>
      </div>

      <section className="detail-head">
        <div className="progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <p className="panel-note">
          {asked} of {initial.max_questions} questions
        </p>

        {history.length > 0 && (
          <ol className="runner-history">
            {history.map((turn, index) => (
              <li key={index}>
                <div className="qa-level">
                  {turn.level && (
                    <span title={PROBE_MEANING[turn.level]}>
                      {PROBE_LABEL[turn.level]}
                    </span>
                  )}
                  <b>{turn.score}</b>
                </div>
                <p className="qa-question">{turn.question}</p>
                <p className="qa-answer">{turn.answer}</p>
                {turn.contradictions.map((item, position) => (
                  <p className="form-error" key={position}>
                    <AlertTriangle size={13} /> {item.fact_label || item.fact_key}:
                    said {item.earlier_value} earlier, now {item.later_value}
                    {item.note ? ` — ${item.note}` : ""}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        )}

        {done ? (
          <div className="runner-done">
            <span className="mini-label">
              <CheckCircle2 size={14} /> SESSION COMPLETE
            </span>
            <h3>The evidence graph is final.</h3>
            <Link
              href={`/recruiter/candidates/${initial.candidate_id}`}
              className="primary-button"
            >
              Open the evidence graph <ArrowRight size={16} />
            </Link>
          </div>
        ) : question ? (
          <>
            {level && (
              <span className="probe-chip" title={PROBE_MEANING[level]}>
                {PROBE_LABEL[level]} probe
              </span>
            )}
            <h3 className="runner-question">{question}</h3>

            <VoiceRecorder onComplete={setSeconds} />
            {seconds !== null && (
              <p className="panel-note">
                {seconds}s timed — sent as the voice-note duration.
              </p>
            )}

            <label className="intake-textarea">
              Answer
              <textarea
                rows={5}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Answer as the candidate would. Quantities, named tools and complete cause → action → outcome chains are what the rubric counts."
              />
            </label>

            <button
              className="primary-button"
              onClick={send}
              disabled={busy || draft.trim().length < 2}
            >
              {busy ? "Scoring…" : "Send answer"}
            </button>
          </>
        ) : (
          <div className="runner-start">
            <p className="panel-note">
              This session is waiting at{" "}
              <b>{initial.state}</b>. Starting it asks the first question
              without a WhatsApp opt-in.
            </p>
            <button className="primary-button" onClick={begin} disabled={busy}>
              {busy ? "Starting…" : <><Play size={16} /> Ask the first question</>}
            </button>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
      </section>
    </>
  );
}
