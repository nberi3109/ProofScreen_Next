import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

import { BADGE_LABEL, SESSION_STATE_LABEL, scoreBand } from "@/lib/api/format";
import type { Viewer } from "@/lib/api/viewer";

/**
 * The candidate's proof status, from their live session.
 *
 * Three states, because the honest answer differs completely between them and
 * the old hard-coded "78 / Good foundation" covered none of them:
 *
 *   no verification yet  -> an invitation, not a zero. A candidate who has
 *                           never been interviewed does not have a bad score;
 *                           they have no score, and showing 0 would be a
 *                           statement about them that nothing supports.
 *   in progress          -> the consent step or the question count, with the
 *                           reminder that the interview lives on WhatsApp.
 *   complete             -> the real competence score and badge.
 */
export default function ProofScoreCard({ viewer }: { viewer: Viewer | null }) {
  if (viewer === null) {
    return (
      <section className="proof-card">
        <div className="proof-card-copy">
          <span className="mini-label">
            <Sparkles size={13} /> YOUR PROOF STATUS
          </span>
          <div className="score-line">
            <strong>—</strong>
            <span>/100</span>
          </div>
          <p>
            No verification yet. Turn your resume into evidence and recruiters
            see what you can actually do.
          </p>
          <Link href="/candidate/start" className="light-button">
            Get verified <ArrowRight size={15} />
          </Link>
        </div>
        <div className="score-ring score-ring-empty" aria-label="No proof score yet">
          <span>—</span>
        </div>
      </section>
    );
  }

  const { session, graph } = viewer;

  if (graph === null) {
    const waiting = session.state === "AWAITING_OPT_IN";
    return (
      <section className="proof-card">
        <div className="proof-card-copy">
          <span className="mini-label">
            <MessageCircle size={13} /> VERIFICATION IN PROGRESS
          </span>
          <div className="score-line">
            <strong>
              {session.questions_asked}
              <em>/{session.max_questions}</em>
            </strong>
          </div>
          <p>
            {waiting
              ? "Your claims are extracted. Send the opt-in code on WhatsApp and the questions begin."
              : "The interview is running on WhatsApp — answer there, by text or voice note."}
          </p>
          <Link
            href={`/candidate/proof?session_id=${encodeURIComponent(viewer.sessionId)}`}
            className="light-button"
          >
            {waiting ? "See the code" : "Track progress"} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="score-ring score-ring-empty" aria-label={SESSION_STATE_LABEL[session.state]}>
          <span>{session.questions_asked}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="proof-card">
      <div className="proof-card-copy">
        <span className="mini-label">
          <Sparkles size={13} /> YOUR PROOF STATUS
        </span>
        <div className="score-line">
          <strong>{graph.competence_score}</strong>
          <span>/100</span>
        </div>
        <p>
          {BADGE_LABEL[graph.badge]} ·{" "}
          {graph.claims.filter((claim) => claim.qa.length > 0).length} of{" "}
          {graph.claims.length} claims backed by your own answers.
        </p>
        <Link
          href={`/candidate/proof?session_id=${encodeURIComponent(viewer.sessionId)}`}
          className="light-button"
        >
          See the detail <ArrowRight size={15} />
        </Link>
      </div>
      <div
        className={`score-ring score-ring-${scoreBand(graph.competence_score)}`}
        aria-label={`Competence score ${graph.competence_score} out of 100`}
      >
        <span>{graph.competence_score}</span>
      </div>
    </section>
  );
}
