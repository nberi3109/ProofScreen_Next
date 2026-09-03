import { Check, Circle } from "lucide-react";

export default function JobMatchReasons({
  strengths,
  missing,
}: {
  strengths: string[];
  missing: string[];
}) {
  return (
    <div className="evidence-list">
      {strengths.map((strength) => (
        <div className="evidence-card" key={strength}>
          <div>
            <h3>{strength}</h3>
            <p>Evidence found in your resume and experience.</p>
          </div>
          <span className="evidence-state">
            <Check size={14} /> Strong
          </span>
        </div>
      ))}

      {missing.map((skill) => (
        <div className="evidence-card" key={skill}>
          <div>
            <h3>{skill}</h3>
            <p>A short proof conversation can strengthen this skill.</p>
          </div>
          <span className="evidence-state needs">
            <Circle size={13} /> Needs proof
          </span>
        </div>
      ))}
    </div>
  );
}
