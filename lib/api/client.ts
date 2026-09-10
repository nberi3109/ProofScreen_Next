/**
 * The single place this app talks to the Evident backend.
 *
 * WHY EVERY CALL IS SERVER-SIDE
 * -----------------------------
 * The two apps deploy separately, which leaves two ways to connect them:
 * let the browser call the API directly with a NEXT_PUBLIC_ base URL, or keep
 * every call on the Next server. This app does the second, for three reasons
 * that all bite on the day of a demo rather than in theory:
 *
 *  1. No CORS. The backend's allowed origins are an env var on a machine
 *     nobody wants to redeploy at 2am because the preview URL changed. Server
 *     to server, the browser's origin never enters the picture.
 *  2. The API's address stays private. `PROOFSCREEN_API_URL` has no
 *     NEXT_PUBLIC_ prefix, so it is not inlined into the client bundle and the
 *     backend can sit on an internal hostname with no public ingress at all.
 *  3. One retry/timeout/error policy, in one file, for every screen.
 *
 * WHY NOTHING IS CACHED
 * ---------------------
 * In Next 16 `fetch` is not cached by default, which is the behaviour this app
 * wants: a recruiter dashboard that serves a stale competence score is worse
 * than one that takes another 200ms. `cache: "no-store"` is passed anyway, so
 * the intent survives someone later enabling `cacheComponents` in
 * next.config.ts. If a screen ever does want caching it should opt in locally
 * with `use cache` + `cacheLife()`, never by relaxing the default here.
 */

import type { HealthOut } from "./types";

/** Server-only by construction: the env var carries no NEXT_PUBLIC_ prefix, so
 *  in a browser bundle it would be undefined. This turns that into a loud
 *  error at the import site instead of a confusing "undefined/api/..." URL. */
function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/api/client.ts ran in the browser. Every backend call belongs in a " +
        "Server Component or a Server Action — move the call, do not add a " +
        "NEXT_PUBLIC_ base URL.",
    );
  }
}

export const API_BASE_URL_ENV = "PROOFSCREEN_API_URL";

/** Errors from `resolveBaseUrl` are configuration mistakes, not API failures,
 *  so they carry their own type and their own remedy text. */
export class ApiNotConfiguredError extends Error {
  constructor() {
    super(
      `${API_BASE_URL_ENV} is not set. Copy .env.example to .env.local and ` +
        `point it at the running Evident API (default http://127.0.0.1:8000).`,
    );
    this.name = "ApiNotConfiguredError";
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  /** FastAPI's `detail`, already unwrapped — including the 422 list form. */
  readonly detail: string;

  /**
   * Who answered, when it was not the API.
   *
   * A 403 or 503 from a CDN, WAF or reverse proxy is indistinguishable from
   * one the application produced unless you look at the response headers —
   * and the difference decides where you go looking. `server: cloudflare`
   * plus a `cf-ray` means the request never reached uvicorn.
   */
  readonly via: string | null;

  constructor(status: number, path: string, detail: string, via: string | null = null) {
    super(`${status} on ${path}: ${detail}${via ? ` [via ${via}]` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.detail = detail;
    this.via = via;
  }

  /** 401/403 — and the interesting question is whether the API said it, or
   *  something in front of it did. `via` is how you tell. */
  get isForbidden(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** Cloudflare 520-527: the edge answered because it could not reach the
   *  origin. The application never saw the request. */
  get isOriginDown(): boolean {
    return this.status >= 520 && this.status <= 527;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** 0 is this client's code for "the request never got an HTTP reply":
   *  connection refused, DNS failure, or our own timeout. Worth separating,
   *  because the fix is "start the backend", not "fix the request". */
  get isUnreachable(): boolean {
    return this.status === 0;
  }
}

function resolveBaseUrl(): string {
  const raw = process.env[API_BASE_URL_ENV];
  if (!raw || !raw.trim()) throw new ApiNotConfiguredError();
  return raw.trim().replace(/\/+$/, "");
}

/** FastAPI returns `detail` as a string for HTTPException and as a list of
 *  objects for validation errors. Recruiters should not be shown a stringified
 *  pydantic error, so the list form is flattened to "field: message". */
function readDetail(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const entry = item as { loc?: unknown[]; msg?: unknown };
          const field = Array.isArray(entry.loc)
            ? entry.loc.filter((p) => p !== "body").join(".")
            : "";
          const msg = typeof entry.msg === "string" ? entry.msg : "invalid";
          return field ? `${field}: ${msg}` : msg;
        })
        .filter((part): part is string => Boolean(part));
      if (parts.length) return parts.join("; ");
    }
  }
  return fallback;
}

/** A non-JSON error body, flattened to one readable line. HTML error pages
 *  are mostly markup, so the tags go and the first real sentence stays. */
function snippet(raw: string): string {
  if (!raw) return "";
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 300 ? `${text.slice(0, 300)}…` : text;
}

/** Names the hop that answered, from the headers CDNs and proxies add. Blank
 *  when nothing identifies an intermediary, which itself is informative: it
 *  suggests the response really did come from the application. */
function describeResponder(response: Response): string | null {
  const bits: string[] = [];
  for (const header of [
    "server",
    "via",
    "cf-ray",
    "cf-mitigated",
    "x-proxy-error",
    "x-amzn-errortype",
    "x-vercel-error",
    "x-envoy-upstream-service-time",
  ]) {
    const value = response.headers.get(header);
    if (value) bits.push(`${header}: ${value}`);
  }
  return bits.length ? bits.join("; ") : null;
}

const DEFAULT_TIMEOUT_MS = 20_000;
/** Signal extraction runs several model calls per answer, so intake and the
 *  simulator need a much longer ceiling than a dashboard read. */
const SLOW_TIMEOUT_MS = 120_000;

type RequestOptions = {
  method?: "GET" | "POST";
  /** JSON body. Mutually exclusive with `form`. */
  json?: unknown;
  /** Multipart body, for the resume upload. Mutually exclusive with `json`. */
  form?: FormData;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Use `slow` for anything that runs the LLM pipeline. */
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  assertServer();
  const base = resolveBaseUrl();

  const url = new URL(base + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  // A User-Agent, on purpose.
  //
  // Node's fetch sends little or no UA of its own, and an edge in front of the
  // API may refuse that outright — Cloudflare's Browser Integrity Check 403s
  // requests with a missing or non-standard User-Agent, which is exactly why
  // such a call fails from a deployed server while the same request from
  // Postman (PostmanRuntime/x.y) or a browser succeeds. Identifying the caller
  // is also just good manners: it puts a name in the API's access log instead
  // of a blank.
  //
  // Override with PROOFSCREEN_USER_AGENT if the edge wants something specific.
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent":
      process.env.PROOFSCREEN_USER_AGENT?.trim() ||
      "ProofScreen-Frontend/1.0 (+https://github.com/nberi3109/ProofScreen_Next)",
  };

  // The tenant API key. The backend reads `X-API-Key` (api/tenancy.py) and
  // resolves it to a tenant; with no header and REQUIRE_API_KEY=false it falls
  // back to the development tenant, which is why today's calls work without
  // one. Set this before turning REQUIRE_API_KEY on, not after.
  const apiKey = process.env.PROOFSCREEN_API_KEY?.trim();
  if (apiKey) headers["X-API-Key"] = apiKey;

  // A SEPARATE secret for getting past a CDN or WAF that challenges
  // server-to-server calls. Deliberately not the same value as the tenant key:
  // one is an application credential, the other is shared with an edge
  // provider, and they should never have to be rotated together.
  const edgeSecret = process.env.PROOFSCREEN_EDGE_SECRET?.trim();
  const edgeHeader = process.env.PROOFSCREEN_EDGE_HEADER?.trim() || "X-ProofScreen-Edge";
  if (edgeSecret) headers[edgeHeader] = edgeSecret;
  let body: BodyInit | undefined;
  if (options.form) {
    // Content-Type is deliberately unset: fetch adds the multipart boundary.
    body = options.form;
  } else if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (cause) {
    const reason =
      cause instanceof Error && cause.name === "TimeoutError"
        ? `no reply within ${(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s`
        : `could not reach the API at ${base}`;
    throw new ApiError(0, path, reason);
  }

  if (!response.ok) {
    // Read the body as TEXT first, then try to parse it. The previous version
    // called `response.json()` and threw away anything that was not JSON —
    // which meant a proxy explaining exactly why it blocked the request
    // ("blocked-by-allowlist", "Attention Required: Cloudflare") arrived in
    // the UI as the word "Forbidden" and nothing else. The body of a 403 is
    // usually the whole answer, so it is no longer discarded.
    const raw = await response.text().catch(() => "");
    let payload: unknown = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    const detail = payload
      ? readDetail(payload, response.statusText || "request failed")
      : snippet(raw) || response.statusText || "request failed";

    throw new ApiError(response.status, path, detail, describeResponder(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiGet<T>(
  path: string,
  query?: RequestOptions["query"],
  timeoutMs?: number,
): Promise<T> {
  return request<T>(path, { method: "GET", query, timeoutMs });
}

export function apiPost<T>(
  path: string,
  json?: unknown,
  timeoutMs?: number,
): Promise<T> {
  return request<T>(path, { method: "POST", json: json ?? {}, timeoutMs });
}

export function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: "POST", form, timeoutMs: SLOW_TIMEOUT_MS });
}

export const SLOW_CALL_TIMEOUT_MS = SLOW_TIMEOUT_MS;

// ---------------------------------------------------------------------------
// SAMPLE DATA
//
// A screen with no backend is a blank screen, which is useless while the API
// is still coming up and alarming in front of an audience. So reads can fall
// back to the typed fixtures in ./fixtures.
//
// Three modes, because "always fake" and "fake only when broken" are very
// different promises:
//
//   off       (default) never. A dead API renders the inline notice, which is
//             the honest answer for a deployed build.
//   fallback  only when the API could not be reached at all — a connection
//             refused, a DNS failure, our own timeout, or an unset base URL.
//             A 404 or a 500 still surfaces as an error, because those mean
//             the API answered and said something was wrong, and hiding that
//             behind plausible sample numbers is how a real bug ships.
//   on        skip the network entirely. For working on the UI.
//
// Whenever a fixture is served the result carries `sample: true`, and the
// layouts turn that into a banner. That matters more here than in most apps:
// this product's whole claim is that every number came from counted, quoted
// evidence, so a sample score that cannot be told apart from a real one is
// not a convenience, it is a liability.
// ---------------------------------------------------------------------------

export type FixtureMode = "off" | "fallback" | "on";

export function fixtureMode(): FixtureMode {
  const raw = (process.env.PROOFSCREEN_FIXTURES ?? "off").trim().toLowerCase();
  return raw === "on" || raw === "fallback" ? raw : "off";
}

/** Maps a request to its fixture. Returns undefined when nothing covers the
 *  path, in which case the caller reports the real error rather than
 *  pretending the endpoint succeeded with an empty body. */
async function fixtureFor(
  path: string,
  query?: RequestOptions["query"],
): Promise<unknown | undefined> {
  const f = await import("./fixtures");

  if (path === "/api/health") return f.FIXTURE_HEALTH;
  if (path === "/api/recruiter/candidates") {
    return f.fixtureRanked(query?.role_id ? String(query.role_id) : null);
  }
  const outcomes = path.match(/^\/api\/recruiter\/candidates\/([^/]+)\/outcomes$/);
  if (outcomes) return f.FIXTURE_OUTCOMES.map((o) => ({ ...o, candidate_id: outcomes[1] }));
  const evals = path.match(/^\/api\/recruiter\/candidates\/([^/]+)\/evaluations$/);
  if (evals) return f.fixtureEvaluations(evals[1]);
  const history = path.match(/^\/api\/recruiter\/evaluations\/([^/]+)\/history$/);
  if (history) return f.fixtureEvaluationHistory(history[1]);
  const evaluation = path.match(/^\/api\/recruiter\/evaluations\/([^/]+)$/);
  if (evaluation) return f.fixtureEvaluation(evaluation[1]);
  if (path === "/api/dev/provenance") return f.FIXTURE_PROVENANCE_STAMP;
  const graph = path.match(/^\/api\/recruiter\/candidates\/([^/]+)$/);
  if (graph) {
    return f.fixtureGraph(graph[1], query?.role_id ? String(query.role_id) : null);
  }
  if (path === "/api/recruiter/roles") return f.FIXTURE_ROLES;
  if (path === "/api/recruiter/validation") return f.FIXTURE_VALIDATION;
  if (path === "/api/recruiter/taxonomy") {
    return query?.job_family
      ? f.fixtureTaxonomy(String(query.job_family))
      : f.FIXTURE_TAXONOMY_ALL;
  }
  if (/^\/api\/sessions\//.test(path)) return f.FIXTURE_SESSION;
  return undefined;
}

/**
 * Only a genuine "could not reach it" earns a fixture in fallback mode.
 *
 * A CDN's interstitial counts. "Just a moment… Enable JavaScript and cookies
 * to continue" is a JavaScript challenge, which no server-side fetch can ever
 * solve — so the request provably never reached the API, and treating it as
 * an API refusal is simply wrong. The test is narrow on purpose: an
 * intermediary must have identified itself in the headers AND the body must
 * look like a challenge. A bare 403 with no proxy fingerprint is still
 * reported as the real error it is, because that one probably came from the
 * application and hiding it would be how a genuine auth bug ships.
 */
const CHALLENGE_MARKERS = [
  "just a moment",
  "enable javascript and cookies",
  "checking your browser",
  "attention required",
  "cf-browser-verification",
  "challenge-platform",
];

/**
 * Cloudflare's 52x family: the edge is up, the origin is not.
 *
 *   520 unknown  521 connection refused  522 connect timeout
 *   523 origin unreachable  524 origin timeout  525/526 TLS failure
 *
 * Every one of these means the request DIED AT THE EDGE and the application
 * never saw it. That is the same fact as a connection refused, so it belongs
 * in the same bucket — a red error box here would be reporting an API failure
 * that the API had no part in.
 *
 * Deliberately not the whole 5xx range: a 500 or 503 from the application
 * itself is a real bug in the application, and papering over that with
 * plausible sample numbers is how a broken endpoint ships unnoticed.
 */
function isEdgeOriginError(error: ApiError): boolean {
  return error.status >= 520 && error.status <= 527;
}

function unreachable(error: ApiError | ApiNotConfiguredError): boolean {
  if (error instanceof ApiNotConfiguredError || error.isUnreachable) return true;
  if (isEdgeOriginError(error)) return true;
  if (!error.isForbidden || !error.via) return false;
  const haystack = error.detail.toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => haystack.includes(marker));
}

/**
 * For pages that must render something useful when the backend is down.
 *
 * A dashboard whose only failure mode is a full-page error boundary is
 * unusable during a demo, where "the API is not running yet" is the single
 * most likely problem in the room. Pages use this and render an inline notice;
 * Server Actions do NOT, because a mutation that silently failed is worse than
 * one that reports an error.
 */
export type ApiResult<T> =
  /** `sample` is set when this came from ./fixtures rather than the API. */
  | { ok: true; data: T; sample?: boolean }
  | { ok: false; error: ApiError | ApiNotConfiguredError };

export async function safeGet<T>(
  path: string,
  query?: RequestOptions["query"],
  timeoutMs?: number,
): Promise<ApiResult<T>> {
  const mode = fixtureMode();

  if (mode === "on") {
    const sample = await fixtureFor(path, query);
    if (sample !== undefined) return { ok: true, data: sample as T, sample: true };
    // Nothing covers this path, so fall through and try the API for real
    // rather than returning an empty success.
  }

  try {
    return { ok: true, data: await apiGet<T>(path, query, timeoutMs) };
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiNotConfiguredError) {
      if (mode !== "off" && unreachable(error)) {
        const sample = await fixtureFor(path, query);
        if (sample !== undefined) return { ok: true, data: sample as T, sample: true };
      }
      return { ok: false, error };
    }
    throw error;
  }
}

/** Rendered in the corner of the recruiter shell so a demo can never mistake
 *  fixture mode for a live model, or a dry run for a sent WhatsApp message. */
export function getHealth(): Promise<ApiResult<HealthOut>> {
  return safeGet<HealthOut>("/api/health", undefined, 5_000);
}
