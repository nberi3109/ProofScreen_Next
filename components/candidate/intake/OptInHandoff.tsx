"use client";

import { ArrowRight, Check, Copy, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Hands the candidate straight to WhatsApp with the opt-in code already typed.
 *
 * WHY THE CODE EXISTS AT ALL, AND WHY IT SHOULD NOT BE THE INTERFACE
 * ------------------------------------------------------------------
 * The WhatsApp Business API will not let a business open a conversation with
 * someone who has not messaged it first, unless an approved message template
 * is configured. Until one is, the candidate genuinely has to send the first
 * message, and the code is how the backend matches that inbound message to the
 * session waiting for it.
 *
 * That is a backend matching problem, and the first version of this screen
 * made it the candidate's problem: here is a six-character string, please
 * retype it into another app. `wa.me` takes a `text` parameter, so the whole
 * thing collapses into one tap — the message arrives pre-written and the
 * candidate only presses send. Pressing send is still the consent step, which
 * is the one part that must stay manual and must not be automated away.
 *
 * So: open WhatsApp automatically, keep a visible button for when the
 * automatic hop is blocked, and demote the code to a copyable fallback for the
 * case where the text did not pre-fill.
 *
 * The auto-hop fires ONCE per code, remembered in sessionStorage. Without that
 * guard, coming back from WhatsApp re-runs the effect and throws the candidate
 * straight out of the app again — an unescapable loop.
 */
export default function OptInHandoff({
  code,
  instructions,
  autoOpen = true,
}: {
  code: string;
  /** The backend's own wording, shown when there is no number to link to. */
  instructions?: string;
  autoOpen?: boolean;
}) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/[^0-9]/g, "");
  const url = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(code)}`
    : "";

  const [opening, setOpening] = useState(false);
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (!autoOpen || !url || fired.current) return;
    fired.current = true;

    const key = `proofscreen.optin-opened.${code}`;
    let already = false;
    try {
      already = window.sessionStorage.getItem(key) === "1";
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked. Skip the auto-hop rather than risk a redirect loop
      // we cannot remember having done.
      already = true;
    }
    if (already) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpening(true);
    // A beat, so the card paints and the candidate sees where they are going
    // rather than the page appearing to vanish.
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 700);
    return () => clearTimeout(timer);
  }, [autoOpen, url, code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission — the code is on screen to read.
    }
  };

  // Nothing to link to. Fall back to the original instructions rather than
  // rendering a dead button.
  if (!url) {
    return (
      <div className="optin-handoff">
        <span className="mini-label">
          <MessageCircle size={13} /> ONE STEP LEFT
        </span>
        <h2>Send this code on WhatsApp</h2>
        <button className="optin-code optin-code-copy" onClick={copy} type="button">
          {code}
          <span>{copied ? <Check size={15} /> : <Copy size={15} />}</span>
        </button>
        <p className="optin-instructions">
          {instructions ||
            `Send the message ${code} to our WhatsApp business number to start the verification.`}
        </p>
      </div>
    );
  }

  return (
    <div className="optin-handoff">
      <span className="mini-label">
        <MessageCircle size={13} /> ONE TAP LEFT
      </span>
      <h2>{opening ? "Opening WhatsApp…" : "Start on WhatsApp"}</h2>
      <p className="optin-lede">
        The message is already written. Press send and the first question
        arrives right there — sending it is how you agree to be interviewed.
      </p>

      <a className="whatsapp-button" href={url} rel="noopener noreferrer">
        <MessageCircle size={19} />
        {opening ? "Continue to WhatsApp" : "Open WhatsApp"}
        <ArrowRight size={17} />
      </a>

      <details className="optin-fallback">
        <summary>WhatsApp didn&apos;t open, or the message was empty?</summary>
        <p>
          Message our business number manually with this code — it is how we
          match your reply to your resume.
        </p>
        <button className="optin-code optin-code-copy" onClick={copy} type="button">
          {code}
          <span>{copied ? <Check size={15} /> : <Copy size={15} />}</span>
        </button>
      </details>
    </div>
  );
}
