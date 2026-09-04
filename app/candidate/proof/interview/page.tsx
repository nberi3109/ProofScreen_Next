import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import SessionRunner from "@/components/dev/SessionRunner";
import { getSession } from "@/lib/api/candidates";

/**
 * The in-browser interview — a SIMULATOR, and labelled as one.
 *
 * The screen this replaced walked through three hard-coded questions and
 * printed a hard-coded 87. It looked like the product and shared nothing with
 * it. This one drives the real orchestrator through /api/dev/sessions/*, so
 * the questions are generated, the answers are scored by the same rubric, and
 * the number at the end is the real one.
 *
 * It is not a candidate channel and must never be presented as one. WhatsApp
 * is the channel; the opt-in message a candidate sends there is a consent
 * step, and these dev routes skip it — which is exactly why they are gated by
 * ENABLE_DEV_ENDPOINTS on the backend and by PROOFSCREEN_ENABLE_DEV_ACTIONS
 * here, and why the page 404s rather than degrades when either is off.
 */
export default async function InterviewSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS !== "true") notFound();

  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="page detail-layout">
        <Link className="back-link" href="/candidate/proof">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyNotice title="No session to run.">
          <p>
            Onboard a candidate first — the intake screen hands back a session
            id, and this page steps through its questions.
          </p>
          <Link href="/candidate/start" className="primary-button">
            Go to intake
          </Link>
        </EmptyNotice>
      </main>
    );
  }

  const session = await getSession(sessionId);

  return (
    <main className="page detail-layout">
      <Link
        className="back-link"
        href={`/candidate/proof?session_id=${encodeURIComponent(sessionId)}`}
      >
        <ArrowLeft size={15} /> Exit simulator
      </Link>

      {session.ok ? (
        <SessionRunner sessionId={sessionId} initial={session.data} />
      ) : (
        <ApiNotice error={session.error} what={`session ${sessionId}`} />
      )}
    </main>
  );
}
