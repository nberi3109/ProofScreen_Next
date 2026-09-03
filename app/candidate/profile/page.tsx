import { Check, Circle, CircleDot, FileText } from "lucide-react";

import { allSkills, evidenceLabel } from "@/lib/data";

const stateIcons = {
  verified: Check,
  resume: CircleDot,
  needs: Circle,
} as const;

const profileSkills = allSkills.slice(0, 6);

export default function Profile() {
  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <div
            className="avatar"
            style={{ width: 56, height: 56, fontSize: 16, marginBottom: 15 }}
          >
            RS
          </div>
          <h1>Rahul Sharma</h1>
          <p>Frontend Developer · Bengaluru</p>
        </div>
      </div>

      <section className="proof-card">
        <div>
          <span className="mini-label">PROOF SCORE</span>
          <div className="score-line">
            <strong>78</strong>
            <span>/100</span>
          </div>
          <p>Good foundation</p>
        </div>
      </section>

      <div className="section-title">
        <h2>Resume</h2>
      </div>

      <div className="evidence-card">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <FileText color="#5a45e8" />
          <div>
            <h3>rahul_resume.pdf</h3>
            <p>Uploaded recently</p>
          </div>
        </div>
        <button className="text-button">View resume</button>
      </div>

      <div className="section-title">
        <h2>Skills</h2>
      </div>

      <div className="evidence-list">
        {profileSkills.map((skill) => {
          const Icon = stateIcons[skill.state];
          const iconColor = skill.state === "verified" ? "#21835f" : "#8c8798";

          return (
            <div className="evidence-card" key={skill.name}>
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <Icon size={16} color={iconColor} />
                <h3 style={{ margin: 0 }}>{skill.name}</h3>
              </div>
              <span className={`evidence-state ${skill.state}`}>
                {evidenceLabel[skill.state]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="section-title">
        <h2>Career snapshot</h2>
      </div>

      <div className="evidence-card">
        <p style={{ lineHeight: 1.8 }}>
          Experience: <b>4 years</b>
          <br />
          Preferred roles: <b>Frontend Developer, Software Engineer</b>
          <br />
          Location: <b>Bengaluru, Remote</b>
          <br />
          Expected salary: <b>₹10–14 LPA</b>
        </p>
      </div>
    </main>
  );
}
