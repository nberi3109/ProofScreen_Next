"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/api/actions";
import { resetDatabase } from "@/lib/api/actions";

/**
 * The one irreversible button in the product.
 *
 * The confirmation is a typed literal rather than a `confirm()` dialog, and it
 * is checked on the server. A dialog protects against a slip of the mouse; a
 * server-checked literal also protects against a stray POST to an endpoint
 * that Next.js has, by design, made publicly reachable.
 */
export default function ResetPanel() {
  const [state, submit, pending] = useActionState<
    ActionResult<{ status: string }> | null,
    FormData
  >(resetDatabase, null);

  return (
    <section className="recruiter-panel danger-panel">
      <h2>
        <TriangleAlert size={17} /> Reset the database
      </h2>
      <p className="panel-note">
        Drops and recreates every table — candidates, sessions, evidence,
        recorded decisions. Before a rehearsal, not during one. Re-seed
        afterwards with <code>python seed.py</code>.
      </p>
      <form action={submit} className="reset-form">
        <label>
          Type RESET to confirm
          <input name="confirm" placeholder="RESET" autoComplete="off" />
        </label>
        <button className="danger-button" type="submit" disabled={pending}>
          {pending ? "Resetting…" : "Reset everything"}
        </button>
      </form>
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      {state?.ok && (
        <p className="form-success">
          <CheckCircle2 size={14} /> Database reset. Re-seed before demoing.
        </p>
      )}
    </section>
  );
}
