"use client";

import { RotateCcw, ServerCrash } from "lucide-react";

/**
 * Last resort. Every API read on these screens goes through `safeGet` and
 * renders an inline notice instead, so reaching this boundary means something
 * OTHER than the backend being down went wrong — a render bug, or a thrown
 * non-API error. Saying so is more useful than a generic apology, because it
 * tells whoever sees it not to go restart the API.
 */
export default function RecruiterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="recruiter-page">
      <div className="api-notice">
        <ServerCrash size={18} />
        <div>
          <b>This screen failed to render.</b>
          <p>
            API failures are handled inline, so this is something else:{" "}
            {error.message || "no message"}
            {error.digest ? ` (digest ${error.digest})` : ""}
          </p>
          <button className="outline-button" onClick={reset}>
            <RotateCcw size={15} /> Try again
          </button>
        </div>
      </div>
    </main>
  );
}
