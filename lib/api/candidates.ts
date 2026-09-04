/** Candidate-side reads. Intake itself is a mutation and lives in actions.ts. */

import { safeGet, type ApiResult } from "./client";
import type { SessionOut } from "./types";

/**
 * The candidate's live session.
 *
 * Worth knowing what the states mean on screen, because the candidate journey
 * is mostly NOT in this app:
 *   AWAITING_OPT_IN — the resume is in and claims are extracted, but the
 *                     candidate must message the opt-in code to WhatsApp
 *                     first. This is a consent step, not a loading state, and
 *                     the UI must not imply the interview has started.
 *   ASKING          — questions are going out over WhatsApp.
 *   COMPLETE        — the evidence graph is final and the proof page has real
 *                     numbers to show.
 */
export function getSession(sessionId: string): Promise<ApiResult<SessionOut>> {
  return safeGet<SessionOut>(
    `/api/sessions/${encodeURIComponent(sessionId)}`,
  );
}
