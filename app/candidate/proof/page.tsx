import { ArrowRight, Circle } from "lucide-react";
import Link from "next/link";

import { allSkills, evidenceLabel } from "@/lib/data";

const verifiedSkills = allSkills.slice(0, 4);
const skillsToProve = allSkills.slice(-2);

export default function ProofPage() {
  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <h1>Your SkillsProof</h1>
          <p>Your evidence, in one clear signal.</p>
        </div>
      </div>

      <section className="score-hero">
        <div className="big-score">78</div>
        <h1>Good foundation</h1>
        <p>4 skills verified · 2 skills need verification</p>
      </section>

      <div className="section-title">
        <h2>Verified skills</h2>
      </div>

      <div className="skill-grid">
        {verifiedSkills.map((skill) => (
          <div className="skill-score" key={skill.name}>
            <div className="skill-score-top">
              <span>{skill.name}</span>
              <span style={{ color: "#21835f" }}>{skill.score}</span>
            </div>
            <div className="progress">
              <i style={{ width: `${skill.score}%` }} />
            </div>
            <p style={{ font: "11px Arial", color: "#716d82" }}>
              ✓ {evidenceLabel[skill.state]}
            </p>
          </div>
        ))}
      </div>

      <div className="section-title">
        <h2>Build stronger proof</h2>
      </div>

      <div className="evidence-list">
        {skillsToProve.map((skill) => (
          <div className="evidence-card" key={skill.name}>
            <div>
              <h3>{skill.name}</h3>
              <p>Show what you can do in a short proof interview.</p>
            </div>
            <Circle size={17} color="#ca7858" />
          </div>
        ))}
      </div>

      <Link
        href="/candidate/proof/interview"
        className="primary-button"
        style={{ marginTop: 18 }}
      >
        Prove a skill <ArrowRight size={16} />
      </Link>
    </main>
  );
}
