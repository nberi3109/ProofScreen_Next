import { NextResponse } from "next/server";

/**
 * WHAT THE NEXT SERVER SEES WHEN IT CALLS THE API.
 *
 * Every backend call in this app runs server-side, so "works in Postman,
 * 403 in the app" is almost never about the request being wrong — it is about
 * WHERE the request comes from. Postman and a browser leave your laptop on a
 * residential IP with a full browser header set. A deployed Next server leaves
 * a datacenter IP with four headers and no Origin, Referer or cookies. A CDN
 * bot rule, a WAF managed rule or an origin IP allowlist will happily let the
 * first through and refuse the second.
 *
 * Reproducing that from your laptop is impossible by definition, which is what
 * this route is for: hit it on the DEPLOYED frontend and it reports the status,
 * the response headers and the body that the failing caller actually got.
 *
 * READING THE RESULT
 *   `responder` names a CDN or proxy      -> the request never reached your app;
 *                                            look at the edge's rules
 *   `responder` is null and status is 403 -> your own stack refused it
 *   status 0                              -> DNS, TLS or connectivity, not policy
 *   200                                   -> the API is fine and the problem is
 *                                            config: check PROOFSCREEN_API_URL
 *                                            on the deployment, not the code
 *
 * SECURITY. This is behind two locks, because it names an internal hostname
 * that is deliberately not NEXT_PUBLIC_ anywhere else in the app: it 404s
 * unless dev actions are enabled AND a matching `?token=` is supplied. Unset
 * PROOFSCREEN_DEBUG_TOKEN and it cannot be reached at all. Delete the folder
 * once the 403 is solved — a diagnostic that outlives its bug becomes an
 * information leak nobody remembers shipping.
 */

const INTERESTING = [
  "server",
  "via",
  "cf-ray",
  "cf-mitigated",
  "cf-cache-status",
  "x-proxy-error",
  "x-amzn-errortype",
  "x-vercel-error",
  "x-served-by",
  "content-type",
  "location",
  "www-authenticate",
  "retry-after",
];

export async function GET(request: Request) {
  if (process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }
  const expected = process.env.PROOFSCREEN_DEBUG_TOKEN;
  const url = new URL(request.url);
  if (!expected || url.searchParams.get("token") !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  const base = (process.env.PROOFSCREEN_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json(
      { error: "PROOFSCREEN_API_URL is not set on this deployment." },
      { status: 500 },
    );
  }

  // Default to the cheapest endpoint that proves the whole path works.
  const path = url.searchParams.get("path") || "/api/health";
  const target = base + (path.startsWith("/") ? path : `/${path}`);

  // Exactly the headers lib/api/client.ts sends, so this reproduces the real
  // call rather than a friendlier version of it.
  //   (no ?ua)        -> exactly what the app sends now, UA included
  //   ?ua=none        -> omit the UA, which is what the app sent BEFORE. If
  //                      this 403s and the default does not, the edge is
  //                      judging the User-Agent and nothing else.
  //   ?ua=<string>    -> try a specific one.
  const defaultUa =
    process.env.PROOFSCREEN_USER_AGENT?.trim() ||
    "ProofScreen-Frontend/1.0 (+https://github.com/nberi3109/ProofScreen_Next)";
  const uaParam = url.searchParams.get("ua");
  const sent: Record<string, string> = { Accept: "application/json" };
  if (uaParam !== "none") sent["User-Agent"] = uaParam || defaultUa;

  const started = Date.now();
  try {
    const response = await fetch(target, {
      headers: sent,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const raw = await response.text().catch(() => "");
    const headers: Record<string, string> = {};
    for (const h of INTERESTING) {
      const v = response.headers.get(h);
      if (v) headers[h] = v;
    }
    return NextResponse.json({
      target_host: new URL(target).host,
      target_path: new URL(target).pathname,
      scheme: new URL(target).protocol.replace(":", ""),
      status: response.status,
      ms: Date.now() - started,
      /** Non-null means something in front of your API answered. */
      responder: Object.keys(headers).length ? headers : null,
      request_headers_sent: sent,
      body_first_400: raw.slice(0, 400),
      verdict:
        response.ok
          ? "API reachable from this deployment — the 403 is not the network. Check PROOFSCREEN_API_URL and the fixture mode on the deployment."
          : headers["server"] || headers["cf-ray"] || headers["x-proxy-error"] || headers["via"]
            ? "Blocked BEFORE your API by an edge or proxy. The request never reached uvicorn — look at that layer's rules, not the app."
            : "Refused with no proxy fingerprint, so your own stack most likely returned it. Check the API's access log for this request.",
    });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return NextResponse.json({
      target_host: new URL(target).host,
      status: 0,
      ms: Date.now() - started,
      error: message,
      verdict:
        "No HTTP reply at all — DNS, TLS or connectivity, not an access policy. A 403 elsewhere plus nothing here usually means the hostname resolves differently from where you tested.",
    });
  }
}
