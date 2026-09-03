import { ArrowUpRight, Check, Circle, Sparkles } from "lucide-react";

import type { RecruiterCandidate } from "@/types/recruiter/candidate";

export default function CandidateRow({
  candidate,
}: {
  candidate: RecruiterCandidate;
}) {
  return (
    <div className="candidate-row">
      <span className="avatar candidate-avatar">{candidate.initials}</span>

      <span className="candidate-main">
        <b>
          {candidate.name}
          {candidate.shineVerified && (
            <span className="shine-badge">
              <Sparkles size={11} /> Shine verified
            </span>
          )}
        </b>
        <small>
          {candidate.role} · {candidate.location}
        </small>
      </span>

      <span className="candidate-score">
        <b>{candidate.score}</b>
        <small>Proof score</small>
      </span>

      <span className="candidate-skills">
        {candidate.skills.slice(0, 2).map((skill) => (
          <span key={skill.name}>
            {skill.evidence === "Verified" ? (
              <Check size={13} />
            ) : (
              <Circle size={13} />
            )}{" "}
            {skill.name}
          </span>
        ))}
      </span>

      <ArrowUpRight size={17} className="row-arrow" />
    </div>
  );
}
