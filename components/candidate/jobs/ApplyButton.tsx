"use client";

import { ArrowRight, Check, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Apply — which in this product means "be verified against this opening".
 *
 * There is no applications table, and the previous version's Apply button set
 * a local flag and opened a hard-coded wa.me link, so nothing was recorded
 * anywhere. That is not a missing endpoint so much as a misread of the
 * product: an opening is a set of weights, and the way a candidate enters
 * consideration for it is to have their claims probed and scored under those
 * weights. So Apply routes into intake with this opening's `role_id`
 * preselected — a parameter `POST /api/candidates` already accepts — and the
 * resulting graph is scored for this role from the start.
 *
 * A candidate who is already verified is offered the WhatsApp channel instead,
 * because their evidence exists and the useful next step is answering more
 * questions, not re-uploading a resume.
 */
export default function ApplyButton({
  openingId,
  openingTitle,
  alreadyVerified,
}: {
  openingId: string;
  openingTitle: string;
  alreadyVerified: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hi ProofScreen, I'd like to be considered for ${openingTitle}.`,
      )}`
    : "";

  const startVerification = () => {
    router.push(`/candidate/start?role_id=${encodeURIComponent(openingId)}`);
  };

  return (
    <>
      <button className="primary-button" onClick={() => setOpen(true)}>
        {alreadyVerified ? (
          <>
            <Check size={17} /> Strengthen my proof
          </>
        ) : (
          <>
            Get considered <ArrowRight size={17} />
          </>
        )}
      </button>

      {open && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="modal-icon">
              <MessageCircle size={22} />
            </div>
            <h2 id="apply-title">
              {alreadyVerified ? "Answer a few more questions" : "This role is decided on evidence"}
            </h2>
            <p>
              {alreadyVerified
                ? "Your evidence graph already exists. More answers mean more dimensions probed, which is what moves the score."
                : `We will pull the claims out of your resume and verify them one by one on WhatsApp, scored against what ${openingTitle} actually weights.`}
            </p>
            <div className="modal-actions">
              <button className="outline-button" onClick={() => setOpen(false)}>
                Maybe later
              </button>
              {alreadyVerified && whatsappUrl ? (
                <a
                  className="primary-button"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open WhatsApp <ArrowRight size={16} />
                </a>
              ) : (
                <button className="primary-button" onClick={startVerification}>
                  Start <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
