"use client";

import { CheckCircle2, Mail, Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BADGE_LABEL, DIMENSION_LABEL, scoreBand } from "@/lib/api/format";
import type { Badge, DimensionScore } from "@/lib/api/types";

/**
 * THE HANDOFF — shortlist, then send the evidence to the hiring manager.
 *
 * A recruiter shortlisting a candidate is only half the loop; the hiring
 * manager still has to be given something to read. Today that is a forwarded
 * CV and a sentence of opinion. This shows the alternative: the same dimension
 * profile the recruiter just looked at, travelling with the resume.
 *
 * PROTOTYPE. Nothing is sent — there is no mail transport in this build, and
 * the modal says so rather than letting a viewer assume otherwise. What is
 * real here is the FLOW and the CONTENT of the message: every score in the
 * preview is read off the same graph the page rendered, not invented, so the
 * template is an honest picture of what the email would carry.
 */

const MANAGER = { name: "Priya Menon", email: "priya.menon@company.example" };
const SENDER = "recruiting@company.example";

export default function SendToManager({
  candidateName,
  candidateRole,
  familyLabel,
  lensTitle,
  dims,
  competence,
  resumeScore,
  roleCoverage,
  questionsAsked,
  badge,
}: {
  candidateName: string;
  candidateRole: string | null;
  familyLabel: string;
  lensTitle: string | null;
  dims: DimensionScore[];
  competence: number;
  resumeScore: number;
  roleCoverage: number;
  questionsAsked: number;
  badge: Badge;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Escape closes, and the page behind does not scroll while the sheet is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  const probed = dims.filter((d) => d.probed);
  const attachment = `${candidateName.toLowerCase().replace(/[^a-z]+/g, "_")}_resume.pdf`;
  const subject = `Evident screen — ${candidateName}${candidateRole ? `, ${candidateRole}` : ""}`;

  return (
    <section className="recruiter-panel handoff-panel">
      <h2>
        <Mail size={17} /> Hand off
      </h2>
      <p className="panel-note">
        Shortlisting records the decision here. This is the next step: send the
        hiring manager the evidence behind it, not just the CV.
      </p>

      <button
        className="primary-button handoff-open"
        type="button"
        onClick={() => {
          setSent(false);
          setOpen(true);
        }}
      >
        <Send size={15} /> Send to hiring manager
      </button>

      {sent && !open && (
        <p className="handoff-sent-note">
          <CheckCircle2 size={14} /> Sent to {MANAGER.name}.
        </p>
      )}

      {open && (
        <div
          className="handoff-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="handoff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="handoff-title"
            tabIndex={-1}
            ref={dialog}
          >
            <header className="handoff-modal-head">
              <div>
                <span className="eyebrow">
                  PREVIEW · PROTOTYPE — NOTHING IS SENT FROM THIS BUILD
                </span>
                <h3 id="handoff-title">
                  {sent ? "Message sent" : "What the hiring manager receives"}
                </h3>
              </div>
              <button
                className="icon-button handoff-close"
                type="button"
                onClick={close}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </header>

            {sent ? (
              <div className="handoff-success">
                <span className="handoff-success-mark">
                  <CheckCircle2 size={26} />
                </span>
                <b>The email has been sent to the hiring manager.</b>
                <p>
                  Delivered to <code>{MANAGER.email}</code> with{" "}
                  <code>{attachment}</code> attached.
                </p>
                <em>
                  In this prototype no mail leaves the application — the flow
                  and the message content are what is being demonstrated.
                </em>
                <button className="primary-button" type="button" onClick={close}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="handoff-envelope">
                  <div>
                    <dt>From</dt>
                    <dd>{SENDER}</dd>
                  </div>
                  <div>
                    <dt>To</dt>
                    <dd>
                      {MANAGER.name} &lt;{MANAGER.email}&gt;
                    </dd>
                  </div>
                  <div>
                    <dt>Subject</dt>
                    <dd className="handoff-subject">{subject}</dd>
                  </div>
                </div>

                <div className="handoff-body">
                  <p>Hi {MANAGER.name.split(" ")[0]},</p>
                  <p>
                    I&rsquo;ve shortlisted <b>{candidateName}</b>
                    {candidateRole ? ` (${candidateRole})` : ""} for{" "}
                    <b>{lensTitle ?? familyLabel}</b>. They answered{" "}
                    {questionsAsked} follow-up questions about the claims on
                    their CV, and the profile below is scored from those
                    answers — every number is backed by a quote you can open.
                  </p>

                  <div className="handoff-scores">
                    <div className={`score-${scoreBand(competence)}`}>
                      <b>{competence}</b>
                      <small>Competence</small>
                    </div>
                    <div>
                      <b>{resumeScore}</b>
                      <small>Resume only</small>
                    </div>
                    <div>
                      <b>{roleCoverage}%</b>
                      <small>Role coverage</small>
                    </div>
                    <div>
                      <b>{BADGE_LABEL[badge]}</b>
                      <small>Verification</small>
                    </div>
                  </div>

                  <h4>Dimension profile</h4>
                  <table className="handoff-dims">
                    <tbody>
                      {dims.map((d) => (
                        <tr key={d.dimension}>
                          <th scope="row">{DIMENSION_LABEL[d.dimension]}</th>
                          <td className="handoff-dim-track">
                            {d.probed ? (
                              <i
                                className={`score-${scoreBand(d.score)}`}
                                style={{ width: `${d.score}%` }}
                              />
                            ) : (
                              <em>not probed</em>
                            )}
                          </td>
                          <td
                            className={
                              d.probed
                                ? `handoff-dim-value score-${scoreBand(d.score)}`
                                : "handoff-dim-value handoff-dim-none"
                            }
                          >
                            {d.probed ? d.score : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {probed.length < dims.length && (
                    <p className="handoff-note">
                      {dims.length - probed.length} of {dims.length} dimensions
                      were never probed. Those are gaps in the interview, not
                      marks against the candidate.
                    </p>
                  )}

                  <p>
                    The full evidence graph — claims, quotes and the transcript
                    — is on their Evident profile.
                  </p>
                  <p>Thanks,</p>
                </div>

                <div className="handoff-attachment">
                  <Paperclip size={14} />
                  <b>{attachment}</b>
                  <small>original CV, as uploaded</small>
                </div>

                <footer className="handoff-modal-foot">
                  <button
                    className="outline-button"
                    type="button"
                    onClick={close}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setSent(true)}
                  >
                    <Send size={15} /> Send to {MANAGER.name.split(" ")[0]}
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
