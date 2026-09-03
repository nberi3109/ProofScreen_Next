import { ChevronDown, X } from "lucide-react";
import Link from "next/link";

import { recruiterCandidates } from "@/data/recruiter/candidates";

export default function CandidatePreview({
  candidateId,
  onClose,
}: {
  candidateId: string;
  onClose: () => void;
}) {
  const candidate = recruiterCandidates.find((item) => item.id === candidateId);

  if (!candidate) {
    return (
      <aside className="candidate-preview preview-empty">
        <p>Select a candidate to view their profile.</p>
      </aside>
    );
  }

  return (
    <aside className="candidate-preview">
      <button
        className="preview-close"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X size={16} />
      </button>

      <div className="preview-person">
        <span className="avatar large-avatar">{candidate.initials}</span>
        <div>
          <h2>{candidate.name}</h2>
          <p>{candidate.role}</p>
          <span className="available">{candidate.availability}</span>
        </div>
      </div>

      <div className="preview-actions">
        <button
          className="outline-button"
          onClick={(event) =>
            event.currentTarget.classList.toggle("selected-action")
          }
        >
          Bookmark
        </button>
        <Link
          className="primary-button"
          href={`/recruiter/candidates/${candidate.id}`}
        >
          Contact
        </Link>
      </div>

      <div className="preview-tabs">
        <button className="active-tab">Profile</button>
        <button>Resume</button>
        <button>Activity</button>
      </div>

      <section className="preview-section">
        <h3>Skills</h3>
        <div className="preview-skills">
          {candidate.skills.map((skill) => (
            <span key={skill.name}>{skill.name}</span>
          ))}
        </div>
      </section>

      <section className="preview-section">
        <h3>Experience</h3>
        <div className="experience-item">
          <b>{candidate.role}</b>
          <small>Current role · {candidate.experience}</small>
          <p>
            Building reliable outcomes with a focus on customer and team impact.
          </p>
        </div>
        <div className="experience-item">
          <b>Previous experience</b>
          <small>Relevant professional experience</small>
          <p>
            Delivered measurable improvements across projects and processes.
          </p>
        </div>
      </section>

      <section className="preview-section preview-details">
        <h3>Key details</h3>
        <p>
          Location <b>{candidate.location}</b>
        </p>
        <p>
          Availability <b>{candidate.availability}</b>
        </p>
        <p>
          Proof score <b>{candidate.score}/100</b>
        </p>
      </section>

      <Link
        className="full-profile-button"
        href={`/recruiter/candidates/${candidate.id}`}
      >
        View full profile <ChevronDown size={15} />
      </Link>
    </aside>
  );
}
