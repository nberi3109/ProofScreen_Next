/**
 * Recruiter-side reads. One function per backend route, no composition and no
 * derived numbers — a page that needs two things makes two calls, in parallel.
 *
 * Every function here uses `safeGet`, so a page can render a "backend
 * unreachable" panel rather than blowing up the whole route. Writes live in
 * `actions.ts` and deliberately do NOT swallow errors.
 */

import { safeGet, type ApiResult } from "./client";
import type {
  CandidateGraph,
  EvaluationHistoryOut,
  EvaluationOut,
  EvaluationSummary,
  OutcomeOut,
  RankedCandidates,
  RoleOut,
  TaxonomyAll,
  TaxonomyFamily,
  ValidationOut,
} from "./types";

/**
 * The ranked list. `roleId` is the whole recruiter-lens argument: the same
 * stored evidence re-weighted, with no candidate re-interviewed and no model
 * call. Passing a different roleId is expected to change the ORDER, not just
 * the numbers.
 */
export function getRankedCandidates(
  roleId?: string | null,
): Promise<ApiResult<RankedCandidates>> {
  return safeGet<RankedCandidates>("/api/recruiter/candidates", {
    role_id: roleId,
  });
}

/** The evidence graph behind one candidate's score. */
export function getCandidateGraph(
  candidateId: string,
  roleId?: string | null,
): Promise<ApiResult<CandidateGraph>> {
  return safeGet<CandidateGraph>(
    `/api/recruiter/candidates/${encodeURIComponent(candidateId)}`,
    { role_id: roleId },
  );
}

export function getRoles(): Promise<ApiResult<RoleOut[]>> {
  return safeGet<RoleOut[]>("/api/recruiter/roles");
}

/** Oldest first, as the backend returns it — this is a decision trail and
 *  reversing it would misrepresent which call came first. */
export function getOutcomes(
  candidateId: string,
): Promise<ApiResult<OutcomeOut[]>> {
  return safeGet<OutcomeOut[]>(
    `/api/recruiter/candidates/${encodeURIComponent(candidateId)}/outcomes`,
  );
}

/**
 * M4 — does evidence outrank resume screening?
 *
 * `minimumN` is exposed but never defaulted down. Below the floor the backend
 * returns `sufficient: false` with null correlations, and the UI must print
 * "withheld" rather than a number: a Spearman coefficient over four
 * candidates looks like evidence and is not.
 */
export function getValidation(
  minimumN?: number,
): Promise<ApiResult<ValidationOut>> {
  return safeGet<ValidationOut>("/api/recruiter/validation", {
    minimum_n: minimumN,
  });
}

/** Read-only view of the claim taxonomy — what the weight editor renders. */
export function getTaxonomy(
  jobFamily: string,
): Promise<ApiResult<TaxonomyFamily>> {
  return safeGet<TaxonomyFamily>("/api/recruiter/taxonomy", {
    job_family: jobFamily,
  });
}

export function getAllTaxonomy(): Promise<ApiResult<TaxonomyAll>> {
  return safeGet<TaxonomyAll>("/api/recruiter/taxonomy");
}

/**
 * One lens by id.
 *
 * There is no `GET /roles/{id}`, so this filters the list. Deliberately not
 * worked around with a new endpoint: the list is small, uncached and already
 * needed by the same screens, and a second route would be a second thing to
 * keep in step with the contract.
 */
export async function getRole(roleId: string): Promise<ApiResult<RoleOut | null>> {
  const roles = await getRoles();
  if (!roles.ok) return roles;
  return { ok: true, data: roles.data.find((role) => role.id === roleId) ?? null };
}

// ---------------------------------------------------------------------------
// evaluations — the auditable record behind a score
// ---------------------------------------------------------------------------

/**
 * A candidate's assessment history, NEWEST FIRST.
 *
 * Note the deliberate asymmetry with `getOutcomes`, which is oldest-first:
 * outcomes are read as a progression by the validation report, while this is a
 * feed a human scrolls. Do not "normalise" either one — the order is part of
 * each endpoint's meaning.
 */
export function getCandidateEvaluations(
  candidateId: string,
): Promise<ApiResult<EvaluationSummary[]>> {
  return safeGet<EvaluationSummary[]>(
    `/api/recruiter/candidates/${encodeURIComponent(candidateId)}/evaluations`,
  );
}

/** One assessment, retrievable independently of the live interview — with the
 *  weights it was scored under and the version stamp that produced it. */
export function getEvaluation(
  evaluationId: string,
): Promise<ApiResult<EvaluationOut>> {
  return safeGet<EvaluationOut>(
    `/api/recruiter/evaluations/${encodeURIComponent(evaluationId)}`,
  );
}

/** What the evaluation concluded, and what a human then did about it. */
export function getEvaluationHistory(
  evaluationId: string,
): Promise<ApiResult<EvaluationHistoryOut>> {
  return safeGet<EvaluationHistoryOut>(
    `/api/recruiter/evaluations/${encodeURIComponent(evaluationId)}/history`,
  );
}
