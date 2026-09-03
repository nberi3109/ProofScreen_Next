"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";

const WHATSAPP_ASSESSMENT_URL =
  "https://wa.me/919876543210?text=Hi%20SkillsProof%2C%20I%27d%20like%20to%20take%20my%20assessment%20test.";

export default function ApplyButton() {
  const [applied, setApplied] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  const closeAssessment = () => setAssessmentOpen(false);

  const apply = () => {
    setApplied(true);
    setAssessmentOpen(true);
  };

  const startAssessment = () => {
    window.open(WHATSAPP_ASSESSMENT_URL, "_blank", "noopener,noreferrer");
    closeAssessment();
  };

  return (
    <>
      <button className="primary-button" onClick={apply}>
        {applied ? (
          <>
            <Check size={17} /> Applied
          </>
        ) : (
          <>
            Apply now <ArrowRight size={17} />
          </>
        )}
      </button>

      {assessmentOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeAssessment}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeAssessment}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Check size={22} />
            </div>
            <h2 id="assessment-title">Application sent</h2>
            <p>
              Would you like to give an assessment test to increase your
              chances?
            </p>
            <div className="modal-actions">
              <button className="outline-button" onClick={closeAssessment}>
                Maybe later
              </button>
              <button className="primary-button" onClick={startAssessment}>
                Allow <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
