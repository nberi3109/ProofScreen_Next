/**
 * The single place this app talks to the ProofScreen backend.
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
        `point it at the running ProofScreen API (default http://127.0.0.1:8000).`,
    );
    this.name = "ApiNotConfiguredError";
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  /** FastAPI's `detail`, already unwrapped — including the 422 list form. */
  readonly detail: string;

  constructor(status: number, path: string, detail: string) {
    super(`${status} on ${path}: ${detail}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.detail = detail;
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

  const headers: Record<string, string> = { Accept: "application/json" };
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
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON error body (a proxy's HTML 502, say) leaves payload null and
      // falls through to the status-text fallback below.
    }
    throw new ApiError(
      response.status,
      path,
      readDetail(payload, response.statusText || "request failed"),
    );
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
  | { ok: true; data: T }
  | { ok: false; error: ApiError | ApiNotConfiguredError };

export async function safeGet<T>(
  path: string,
  query?: RequestOptions["query"],
  timeoutMs?: number,
): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await apiGet<T>(path, query, timeoutMs) };
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiNotConfiguredError) {
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
