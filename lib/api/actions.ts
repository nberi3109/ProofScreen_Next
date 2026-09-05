"use server";

/**
 * Every write this app performs. Nothing mutates the backend from anywhere else.
 *
 * SECURITY NOTE, READ BEFORE DEPLOYING
 * ------------------------------------
 * Next.js compiles each exported function below into a public HTTP endpoint.
 * Anyone can POST to it — the form on the page is a convenience, not a gate.
 * From the framework docs: "Server Functions are reachable via direct POST, so
 * authorisation must be verified inside each one."
 *
 * This app has no authentication yet: `/candidate-login` and
 * `/recruiter-login` are unwired screens. So the honest statement is that
 * these endpoints are OPEN, and `requireWriteAccess()` below is the single
 * seam where a real session check goes. What it does today is refuse to run at
 * all unless the deployment has explicitly opted in, which keeps a public
 * preview build from exposing candidate intake and recruiter decisions to the
 * internet by default. Wiring real auth means replacing that one function, not
 * touching seven call sites.
 *
 * What is genuinely enforced today, and matters regardless of auth:
 *   - every field is validated here, not just in the browser, so a
 *     hand-rolled POST cannot push a bad decision value or a 40MB "resume"
 *     into the backend;
 *   - the dev/simulator actions need their own separate opt-in, because they
 *     write `Channel.simulated` rows that must never be mistaken for a real
 *     candidate, and `resetDatabase` deletes everything.
 */

import { revalidatePath } from "next/cache";

import { rememberSessionId } from "./viewer";
import {
  ApiError,
  ApiNotConfiguredError,
  SLOW_CALL_TIMEOUT_MS,
  apiPost,
  apiPostForm,
} from "./client";
import {
  OUTCOME_DECISIONS,
  type CandidateCreateOut,
  type DevAnswerOut,
  type OutcomeDecision,
  type OutcomeOut,
  type RoleOut,
  type SessionOut,
  type SimulateOut,
} from "./types";

// ---------------------------------------------------------------------------
// result shape
//
// Actions return a result object instead of throwing, because these are called
// from `useActionState` and a thrown error there becomes an error boundary —
// which loses the form the user just filled in. Failure is a value.
// ---------------------------------------------------------------------------

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

function fail<T>(error: string, field?: string): ActionResult<T> {
  return { ok: false, error, field };
}

/** Turns any thrown error into an operator-readable sentence. Backend `detail`
 *  strings are surfaced verbatim — they are written for humans and hiding them
 *  behind "something went wrong" makes a demo undebuggable. */
function describe(error: unknown): string {
  if (error instanceof ApiNotConfiguredError) return error.message;
  if (error instanceof ApiError) {
    if (error.isUnreachable) return `The ProofScreen API is unreachable — ${error.detail}.`;
    return error.detail;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}

// ---------------------------------------------------------------------------
// the auth seam
// ---------------------------------------------------------------------------

const WRITES_ENABLED = process.env.PROOFSCREEN_ENABLE_WRITES === "true";
const DEV_ACTIONS_ENABLED = process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS === "true";

/** REPLACE ME with a real session check. Until then, writes are off unless the
 *  deployment sets PROOFSCREEN_ENABLE_WRITES=true. */
function requireWriteAccess(): string | null {
  if (!WRITES_ENABLED) {
    return (
      "Writes are disabled on this deployment. Set PROOFSCREEN_ENABLE_WRITES=true " +
      "once a recruiter session check is in place — these endpoints are public " +
      "until then."
    );
  }
  return null;
}

/** Separate switch: these write simulated rows or delete data outright. */
function requireDevAccess(): string | null {
  if (!DEV_ACTIONS_ENABLED) {
    return (
      "Simulator actions are disabled. Set PROOFSCREEN_ENABLE_DEV_ACTIONS=true " +
      "locally to drive a session without WhatsApp."
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// validation helpers
// ---------------------------------------------------------------------------

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === "" ? null : value;
}

/** E.164, which is what the WhatsApp Cloud API requires. Rejecting it here
 *  saves a round trip and gives the candidate a message about their number
 *  rather than a 422 about a field name. */
const E164 = /^\+[1-9]\d{7,14}$/;

const MAX_RESUME_BYTES = 8 * 1024 * 1024;
/** Mirrors the backend's `extract_text` support. Anything else is rejected
 *  before an 8MB upload crosses the wire. */
const RESUME_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

/** The backend rejects anything shorter as unextractable. Same number, stated
 *  once, so the two sides cannot drift into disagreeing about it. */
const MIN_RESUME_CHARS = 80;

// ---------------------------------------------------------------------------
// candidate intake
// ---------------------------------------------------------------------------

/**
 * Resume file in, claims + WhatsApp opt-in code out.
 *
 * Slow on purpose: this runs claim extraction through the model. The client
 * timeout is raised to match, so a legitimate 40-second intake is not reported
 * as a network failure.
 */
export async function createCandidateFromResume(
  _previous: ActionResult<CandidateCreateOut> | null,
  form: FormData,
): Promise<ActionResult<CandidateCreateOut>> {
  const denied = requireWriteAccess();
  if (denied) return fail(denied);

  const name = text(form, "name");
  const phone = text(form, "phone");
  const file = form.get("file");

  if (name.length < 2) return fail("Enter the candidate's full name.", "name");
  if (!E164.test(phone)) {
    return fail(
      "Phone must be in international format, e.g. +919812345678.",
      "phone",
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    return fail("Attach a resume file.", "file");
  }
  if (file.size > MAX_RESUME_BYTES) {
    return fail("That resume is larger than 8MB.", "file");
  }
  const lower = file.name.toLowerCase();
  if (!RESUME_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return fail(`Resume must be one of ${RESUME_EXTENSIONS.join(", ")}.`, "file");
  }

  // Rebuilt rather than forwarded: the incoming FormData carries React's own
  // action fields, and forwarding them would send junk to FastAPI.
  const upload = new FormData();
  upload.set("file", file, file.name);
  upload.set("name", name);
  upload.set("phone", phone);
  for (const key of ["email", "role", "job_family", "role_id", "job_description"]) {
    const value = optional(form, key);
    if (value) upload.set(key, value);
  }

  try {
    const data = await apiPostForm<CandidateCreateOut>("/api/candidates", upload);
    await rememberSessionId(data.session_id);
    revalidatePath("/recruiter/candidates");
    revalidatePath("/recruiter");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

/** Same pipeline, pasted text instead of a file — the path a booth demo uses
 *  when nobody has a PDF to hand. */
export async function createCandidateFromText(
  _previous: ActionResult<CandidateCreateOut> | null,
  form: FormData,
): Promise<ActionResult<CandidateCreateOut>> {
  const denied = requireWriteAccess();
  if (denied) return fail(denied);

  const name = text(form, "name");
  const phone = text(form, "phone");
  const resumeText = text(form, "resume_text");

  if (name.length < 2) return fail("Enter the candidate's full name.", "name");
  if (!E164.test(phone)) {
    return fail(
      "Phone must be in international format, e.g. +919812345678.",
      "phone",
    );
  }
  if (resumeText.length < MIN_RESUME_CHARS) {
    return fail(
      `Paste at least ${MIN_RESUME_CHARS} characters — there is nothing to extract claims from yet.`,
      "resume_text",
    );
  }

  try {
    const data = await apiPost<CandidateCreateOut>(
      "/api/candidates/text",
      {
        resume_text: resumeText,
        name,
        phone,
        email: optional(form, "email"),
        role: optional(form, "role"),
        job_family: optional(form, "job_family"),
        role_id: optional(form, "role_id"),
        job_description: optional(form, "job_description"),
      },
      SLOW_CALL_TIMEOUT_MS,
    );
    await rememberSessionId(data.session_id);
    revalidatePath("/recruiter/candidates");
    revalidatePath("/recruiter");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

// ---------------------------------------------------------------------------
// recruiter decisions
//
// The only place a human judgement enters the system, and the reason "evidence
// beats resume screening" is falsifiable rather than self-referential. The
// validation report rank-correlates scores against these rows, so a decision
// recorded by accident is worse than one not recorded at all — which is why
// `decision` is checked against the enum rather than passed through.
// ---------------------------------------------------------------------------

export async function recordOutcome(
  candidateId: string,
  _previous: ActionResult<OutcomeOut> | null,
  form: FormData,
): Promise<ActionResult<OutcomeOut>> {
  const denied = requireWriteAccess();
  if (denied) return fail(denied);
  if (!candidateId) return fail("Missing candidate.");

  const decision = text(form, "decision");
  if (!(OUTCOME_DECISIONS as readonly string[]).includes(decision)) {
    return fail(
      `Decision must be one of ${OUTCOME_DECISIONS.join(", ")}.`,
      "decision",
    );
  }

  try {
    const data = await apiPost<OutcomeOut>(
      `/api/recruiter/candidates/${encodeURIComponent(candidateId)}/outcome`,
      {
        decision: decision as OutcomeDecision,
        stage: optional(form, "stage"),
        role_id: optional(form, "role_id"),
        decided_by: optional(form, "decided_by"),
        note: optional(form, "note"),
      },
    );
    revalidatePath(`/recruiter/candidates/${candidateId}`);
    revalidatePath("/recruiter/validation");
    revalidatePath("/recruiter");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

// ---------------------------------------------------------------------------
// role weight profiles
// ---------------------------------------------------------------------------

/** Reads `weight:<key>` / `dim:<DIMENSION>` inputs so the form can render one
 *  field per taxonomy key without the action knowing the taxonomy. Blank and
 *  non-numeric fields are dropped rather than coerced to 0, because 0 is a
 *  meaningful weight ("this role does not care about that claim") and typing
 *  nothing is not the same statement. */
function collectWeights(form: FormData, prefix: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of form.entries()) {
    if (!key.startsWith(prefix) || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed === "") continue;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) continue;
    out[key.slice(prefix.length)] = parsed;
  }
  return out;
}

export async function createRoleProfile(
  _previous: ActionResult<RoleOut> | null,
  form: FormData,
): Promise<ActionResult<RoleOut>> {
  const denied = requireWriteAccess();
  if (denied) return fail(denied);

  const title = text(form, "title");
  const jobFamily = text(form, "job_family") || "general";
  if (title.length < 2) return fail("Give the role profile a title.", "title");

  const claimWeights = collectWeights(form, "weight:");
  const dimensionWeights = collectWeights(form, "dim:");

  // Not normalised here. The backend rescales to sum to 100 and its arithmetic
  // is the one that must be quotable, so doing it twice would only create a
  // second place for the numbers to disagree.
  try {
    const data = await apiPost<RoleOut>("/api/recruiter/roles", {
      title,
      job_family: jobFamily,
      claim_weights: claimWeights,
      dimension_weights: dimensionWeights,
    });
    revalidatePath("/recruiter/jobs");
    revalidatePath("/recruiter/candidates");
    revalidatePath("/recruiter/saved-searches");
    revalidatePath("/recruiter");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

// ---------------------------------------------------------------------------
// simulator — /api/dev/*, gated separately
//
// These exist because WhatsApp is the only real candidate channel, and a booth
// demo cannot depend on a handset and a Meta-approved template. Every row they
// create is `Channel.simulated`, which the backend's own contract describes as
// "never a real candidate" — so every screen that calls them says SIMULATED on
// it, and none of them is reachable without the explicit opt-in above.
// ---------------------------------------------------------------------------

export async function startSimulatedSession(
  sessionId: string,
): Promise<ActionResult<SessionOut>> {
  const denied = requireDevAccess();
  if (denied) return fail(denied);
  if (!sessionId) return fail("Missing session.");

  try {
    const data = await apiPost<SessionOut>(
      `/api/dev/sessions/${encodeURIComponent(sessionId)}/start`,
      {},
      SLOW_CALL_TIMEOUT_MS,
    );
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

export async function answerSimulatedSession(
  sessionId: string,
  answer: string,
  audioSeconds?: number | null,
): Promise<ActionResult<DevAnswerOut>> {
  const denied = requireDevAccess();
  if (denied) return fail(denied);
  if (!sessionId) return fail("Missing session.");

  const trimmed = answer.trim();
  if (trimmed.length < 2) return fail("Type an answer first.", "text");

  try {
    const data = await apiPost<DevAnswerOut>(
      `/api/dev/sessions/${encodeURIComponent(sessionId)}/answer`,
      { text: trimmed, audio_seconds: audioSeconds ?? null },
      SLOW_CALL_TIMEOUT_MS,
    );
    revalidatePath("/recruiter/candidates");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

/** Resume in, whole scored graph out, in one call. */
export async function simulateCandidate(
  _previous: ActionResult<SimulateOut> | null,
  form: FormData,
): Promise<ActionResult<SimulateOut>> {
  const denied = requireDevAccess();
  if (denied) return fail(denied);

  const resumeText = text(form, "resume_text");
  if (resumeText.length < MIN_RESUME_CHARS) {
    return fail(
      `Paste at least ${MIN_RESUME_CHARS} characters of resume text.`,
      "resume_text",
    );
  }

  const answers = text(form, "answers")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  try {
    const data = await apiPost<SimulateOut>(
      "/api/dev/simulate",
      {
        resume_text: resumeText,
        answers,
        name: text(form, "name") || "Simulated Candidate",
        role: optional(form, "role"),
        phone: optional(form, "phone"),
        job_family: optional(form, "job_family"),
        job_description: optional(form, "job_description"),
      },
      SLOW_CALL_TIMEOUT_MS,
    );
    revalidatePath("/recruiter/candidates");
    revalidatePath("/recruiter");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}

/**
 * POST /api/dev/reset — drop and recreate every table.
 *
 * "Before a rehearsal, not during one," as the backend puts it. This is the
 * only irreversible thing the frontend can do, so it carries three locks: the
 * dev switch, the backend's own ENABLE_DEV_ENDPOINTS, and a typed
 * confirmation checked here rather than in the browser — a misfired fetch
 * cannot satisfy a literal string it does not know to send.
 */
export async function resetDatabase(
  _previous: ActionResult<{ status: string }> | null,
  form: FormData,
): Promise<ActionResult<{ status: string }>> {
  const denied = requireDevAccess();
  if (denied) return fail(denied);

  if (text(form, "confirm") !== "RESET") {
    return fail("Type RESET to confirm. Every candidate and score is deleted.", "confirm");
  }

  try {
    const data = await apiPost<{ status: string }>("/api/dev/reset");
    revalidatePath("/recruiter");
    revalidatePath("/recruiter/candidates");
    revalidatePath("/recruiter/jobs");
    revalidatePath("/recruiter/validation");
    return { ok: true, data };
  } catch (error) {
    return fail(describe(error));
  }
}
