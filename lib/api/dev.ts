/**
 * The dev surface — /api/dev/*, gated by ENABLE_DEV_ENDPOINTS on the backend.
 *
 * Two of these are genuinely useful beyond debugging and are worth having on a
 * screen rather than in a terminal:
 *
 *   `detectFamily` answers "why did this resume land in that job family?".
 *   Routing decides which claim types a candidate is asked about and which
 *   rubric weights score them, so it is the first question anyone asks when a
 *   result looks wrong. It is deterministic and costs no model call.
 *
 *   `getLlmDiagnostics` says whether the model is live or fixture and how many
 *   calls and cache hits a rehearsal spent.
 *
 * A 404 from any of them means the backend has dev endpoints switched off,
 * which is a configuration answer rather than an error — the screens say so.
 */

import { safeGet, type ApiResult } from "./client";
import type {
  CandidateGraph,
  LlmDiagnostics,
  ProvenanceStampOut,
  RoutingExplanation,
} from "./types";

export function detectFamily(text: string): Promise<ApiResult<RoutingExplanation>> {
  return safeGet<RoutingExplanation>("/api/dev/detect", { text });
}

export function getLlmDiagnostics(): Promise<ApiResult<LlmDiagnostics>> {
  return safeGet<LlmDiagnostics>("/api/dev/llm");
}

/** The hand-written sample graph, so a screen has something to render before
 *  the database does. Shaped like a CandidateGraph but never validated as one
 *  by the backend, so it is typed loosely and read defensively. */
export function getFixture(): Promise<ApiResult<Partial<CandidateGraph>>> {
  return safeGet<Partial<CandidateGraph>>("/api/dev/fixture");
}

/**
 * The full version stamp, human-readable.
 *
 * Richer than the `ProvenanceOut` on an evaluation: it also carries the
 * material set the fingerprint is computed over, so "why do these two
 * evaluations have different hashes?" is a diff rather than an investigation.
 */
export function getProvenanceStamp(): Promise<ApiResult<ProvenanceStampOut>> {
  return safeGet<ProvenanceStampOut>("/api/dev/provenance");
}
