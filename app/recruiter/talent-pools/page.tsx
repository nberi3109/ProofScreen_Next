import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

const talentPools = [
  {
    name: "Frontend specialists",
    count: 28,
    description:
      "React, TypeScript, and design systems talent ready to build polished product experiences.",
  },
  {
    name: "Backend Developer",
    count: 22,
    description:
      "API, database, and platform engineers with verified systems and delivery experience.",
  },
  {
    name: "Finance & Accounting",
    count: 19,
    description:
      "Finance professionals across reporting, compliance, accounting operations, and analysis.",
  },
  {
    name: "Sales & Business Development",
    count: 34,
    description:
      "Commercial talent with proven relationship building, prospecting, and negotiation skills.",
  },
  {
    name: "Marketing",
    count: 26,
    description:
      "Growth-minded marketers across content, performance, brand, and customer acquisition.",
  },
  {
    name: "Future Data Team",
    count: 17,
    description:
      "Analysts with strong SQL, business intelligence, and problem-solving evidence.",
  },
];

export default function TalentPools() {
  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">ORGANIZE TALENT</span>
          <h1>Talent pools</h1>
          <p>Keep promising people close for the roles ahead.</p>
        </div>
        <button className="primary-button">
          <Plus size={16} /> New pool
        </button>
      </div>

      <div className="pool-grid">
        {talentPools.map((pool) => (
          <Link
            href="/recruiter/candidates"
            className="pool-card"
            key={pool.name}
          >
            <span>
              <FolderKanban size={18} />
            </span>
            <h2>{pool.name}</h2>
            <p>{pool.description}</p>
            <strong>
              <Users size={14} /> {pool.count} candidates{" "}
              <ArrowRight size={14} />
            </strong>
          </Link>
        ))}
      </div>
    </main>
  );
}
