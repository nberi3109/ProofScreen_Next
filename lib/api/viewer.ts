/**
 * Who is looking at the candidate screens.
 *
 * There is no candidate login — `/candidate-login` is an unwired screen — so
 * identity here is the session id handed back by intake, kept in a cookie so
 * every candidate page can find it without threading `?session_id=` through
 * every link on the site. A query parameter still wins when present, which is
 * what makes an intake link shareable and a bug report reproducible.
 *
 * THIS IS NOT AUTHENTICATION. A cookie holding an id is a bookmark, not a
 * credential: anyone with the id can read the session, and the same is true of
 * the API route underneath. Real auth belongs in the backend, and this file is
 * the single place a frontend session check would replace.
 */

import { cookies } from "next/headers";

import { getSession } from "./candidates";
import type { ApiResult } from "./client";
import { buildCandidateOpening, type CandidateOpening } from "./openings";
import { getCandidateGraph, getRoles } from "./recruiter";
import type { CandidateGraph, SessionOut } from "./types";

export const SESSION_COOKIE = "ps_session";

/** Set after a successful intake so the rest of the candidate app knows who
 *  it is talking to. `httpOnly` because nothing in the browser needs to read
 *  it; `lax` because the WhatsApp opt-in can bring the candidate back through
 *  a top-level navigation from another origin. */
export async function rememberSessionId(sessionId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readSessionId(override?: string): Promise<string> {
  if (override && override.trim()) return override.trim();
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? "";
}

export type Viewer = {
  sessionId: string;
  session: SessionOut;
  /** Present only once the graph is final. Before that there is no score, and
   *  a provisional one is a number the candidate remembers and the recruiter
   *  never sees. */
  graph: CandidateGraph | null;
};

/**
 * Resolve the current candidate, or null when there is no verification yet.
 *
 * `withGraph` is opt-in because most candidate screens only need the session
 * state, and the graph is a much larger payload. Pass it on the screens that
 * show scores.
 */
export async function getViewer(
  override?: string,
  withGraph = false,
): Promise<Viewer | null> {
  const sessionId = await readSessionId(override);
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session.ok) return null;

  if (!withGraph || session.data.state !== "COMPLETE") {
    return { sessionId, session: session.data, graph: null };
  }

  const graph = await getCandidateGraph(session.data.candidate_id);
  return {
    sessionId,
    session: session.data,
    graph: graph.ok ? graph.data : null,
  };
}

/**
 * Every opening, with this candidate's coverage under each one.
 *
 * COST, STATED PLAINLY: this is one graph fetch per opening, because
 * `role_coverage` is lens-specific — the same candidate covers 71% of one
 * opening and 34% of another, and that difference is the whole reason the
 * screen exists. Fetching the default-weighted graph once and reusing it would
 * print an identical number under every role and destroy the point.
 *
 * The calls go out together, and there are as many as the recruiter has
 * created openings — a handful in practice. If that ever stops being true the
 * fix is a backend route that returns coverage for one candidate across all
 * roles in a single query, not a cached approximation here.
 *
 * A candidate with no completed verification gets nulls, and the UI renders a
 * dash rather than a zero: no verification is not the same as no coverage.
 */
export async function getOpeningsForViewer(
  viewer: Viewer | null,
): Promise<ApiResult<CandidateOpening[]>> {
  const roles = await getRoles();
  if (!roles.ok) return roles;

  const candidateId =
    viewer && viewer.session.state === "COMPLETE"
      ? viewer.session.candidate_id
      : null;

  if (candidateId === null) {
    return {
      ok: true,
      data: roles.data.map((role) => buildCandidateOpening(role, null)),
    };
  }

  const graphs = await Promise.all(
    roles.data.map((role) => getCandidateGraph(candidateId, role.id)),
  );

  return {
    ok: true,
    data: roles.data.map((role, index) => {
      const graph = graphs[index];
      return buildCandidateOpening(role, graph.ok ? graph.data : null);
    }),
  };
}
