"use client";

import { FileText, Type, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import OptInHandoff from "@/components/candidate/intake/OptInHandoff";
import type { ActionResult } from "@/lib/api/actions";
import {
  createCandidateFromResume,
  createCandidateFromText,
} from "@/lib/api/actions";
import { familyLabel } from "@/lib/api/format";
import type { CandidateCreateOut, RoleOut } from "@/lib/api/types";

/**
 * Resume in, claims + a WhatsApp opt-in code out.
 *
 * What this screen must NOT imply is that the interview has started. It has
 * not. The backend puts the session in AWAITING_OPT_IN and waits for the
 * candidate to send the code from their own handset, because that message is
 * the consent step — the moment a person agrees to be interviewed by a machine
 * on a channel they own. Rendering that as a spinner, or auto-advancing past
 * it, would be dressing a consent gate up as a loading state.
 *
 * So the success state below is the code, large, with the number to send it to.
 */
export default function IntakeForm({
  roles,
  defaultRoleId = "",
  showDiagnostics = false,
}: {
  roles: RoleOut[];
  /** Preselected when the candidate arrived from a specific opening. */
  defaultRoleId?: string;
  /** Reveals operator-only detail — the outreach diagnostic and a link into
   *  the recruiter dashboard. Off for candidates, who should see neither. */
  showDiagnostics?: boolean;
}) {
  const [mode, setMode] = useState<"file" | "text">("file");

  const [fileState, submitFile, filePending] = useActionState<
    ActionResult<CandidateCreateOut> | null,
    FormData
  >(createCandidateFromResume, null);

  const [textState, submitText, textPending] = useActionState<
    ActionResult<CandidateCreateOut> | null,
    FormData
  >(createCandidateFromText, null);

  const state = mode === "file" ? fileState : textState;
  const pending = mode === "file" ? filePending : textPending;

  if (state?.ok) return <OptInCard result={state.data} showDiagnostics={showDiagnostics} />;

  return (
    <>
      <div className="intake-modes">
        <button
          className={mode === "file" ? "active" : ""}
          onClick={() => setMode("file")}
          type="button"
        >
          <FileText size={14} /> Upload a resume
        </button>
        <button
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
          type="button"
        >
          <Type size={14} /> Paste the text
        </button>
      </div>

      <form
        action={mode === "file" ? submitFile : submitText}
        className="intake-form"
        key={mode}
      >
        <label>
          Full name
          <input name="name" required minLength={2} placeholder="Priya Sharma" />
        </label>

        <label>
          WhatsApp number
          <input
            name="phone"
            required
            placeholder="+919812345678"
            inputMode="tel"
            pattern="\+[1-9][0-9]{7,14}"
          />
          <small>
            International format. The interview happens here — every question
            arrives on WhatsApp.
          </small>
        </label>

        <label>
          Email <small>optional</small>
          <input name="email" type="email" placeholder="priya@example.com" />
        </label>

        <label>
          Current or target role <small>optional</small>
          <input name="role" placeholder="Customer Support Lead" />
        </label>

        {mode === "file" ? (
          <label className="intake-file">
            Resume
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.docx,.txt,.md"
            />
            <small>PDF, DOCX, TXT or MD, up to 8MB.</small>
          </label>
        ) : (
          <label className="intake-textarea">
            Resume text
            <textarea
              name="resume_text"
              required
              minLength={80}
              rows={10}
              placeholder="Paste the resume here — experience, metrics, tools, responsibilities."
            />
            <small>
              At least 80 characters. Claims are extracted from what is written
              here, so bullet points with numbers work better than a summary.
            </small>
          </label>
        )}

        <label className="intake-textarea">
          Job description <small>optional</small>
          <textarea
            name="job_description"
            rows={4}
            placeholder="Paste the opening this candidate is being considered for."
          />
          <small>
            Used to route the resume to the right claim taxonomy. Leave it blank
            and the job family is detected from the resume itself.
          </small>
        </label>

        {roles.length > 0 && (
          <label>
            Score against an opening{" "}
            <small>{defaultRoleId ? "preselected from the role you opened" : "optional"}</small>
            <select name="role_id" defaultValue={defaultRoleId}>
              <option value="">Job-family defaults</option>
              {roles.map((role) => (
                <option value={role.id} key={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? (
            <>Extracting claims…</>
          ) : (
            <>
              <Upload size={16} /> Extract claims
            </>
          )}
        </button>

        {pending && (
          <p className="panel-note">
            Reading the resume and pulling out verifiable claims. This runs
            through the model, so it can take up to a minute.
          </p>
        )}

        {state && !state.ok && (
          <p className="form-error">
            {state.error}
          </p>
        )}
      </form>
    </>
  );
}

/**
 * The consent gate, rendered as one tap rather than a transcription exercise.
 *
 * `outreach_note` is deliberately NOT shown to a candidate. It says things like
 * "No approved template configured, so the candidate must message the business
 * number first" — a true and useful sentence for whoever configures the Meta
 * app, and meaningless-to-alarming for the person who just uploaded a CV. It
 * appears only when diagnostics are on.
 */
function OptInCard({
  result,
  showDiagnostics,
}: {
  result: CandidateCreateOut;
  showDiagnostics: boolean;
}) {
  return (
    <section className="optin-card">
      <OptInHandoff
        code={result.opt_in_code}
        instructions={result.whatsapp_instructions}
      />

      {showDiagnostics && result.outreach_note && (
        <p className={`panel-note ${result.outreach_sent ? "" : "warn"}`}>
          {result.outreach_sent
            ? `Outreach sent: ${result.outreach_note}`
            : `Outreach not sent — ${result.outreach_note}`}
        </p>
      )}

      <div className="optin-claims">
        <h3>
          {result.claims.length}{" "}
          {result.claims.length === 1 ? "claim" : "claims"} to verify ·{" "}
          {familyLabel(result.job_family, result.job_family_label)}
        </h3>
        <ul>
          {result.claims.map((claim) => (
            <li key={claim.id}>
              <b>{claim.text}</b>
              <small>
                {claim.claim_type_label}
                {claim.metric ? ` · metric ${claim.metric}` : ""} · weight{" "}
                {claim.weight.toFixed(1)}
              </small>
            </li>
          ))}
        </ul>
        {result.claims.length === 0 && (
          <p className="panel-note">
            Nothing in the document scored high enough to treat as a verifiable
            claim. Headings, skill lists and date ranges are rejected on
            purpose — a claim needs a verb and something checkable in it.
          </p>
        )}
      </div>

      <div className="optin-links">
        <Link
          href={`/candidate/proof?session_id=${encodeURIComponent(result.session_id)}`}
          className="outline-button"
        >
          Track this verification
        </Link>
        {showDiagnostics && (
          <Link
            href={`/recruiter/candidates/${result.candidate_id}`}
            className="outline-button"
          >
            Open the recruiter view
          </Link>
        )}
      </div>
    </section>
  );
}
