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
