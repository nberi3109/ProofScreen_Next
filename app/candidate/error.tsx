"use client";

import { RotateCcw } from "lucide-react";

export default function CandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page">
      <div className="api-notice">
        <div>
          <b>Something went wrong on this screen.</b>
          <p>{error.message || "No further detail."}</p>
          <button className="outline-button" onClick={reset}>
            <RotateCcw size={15} /> Try again
          </button>
        </div>
      </div>
    </main>
  );
}
