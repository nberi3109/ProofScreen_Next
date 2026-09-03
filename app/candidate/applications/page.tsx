import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Application = {
  title: string;
  company: string;
  applied: string;
  status: string;
  needsProof?: boolean;
};

const applications: Application[] = [
  {
    title: "Senior Customer Support Executive",
    company: "Acme Services",
    applied: "Applied 2 days ago",
    status: "Under review",
  },
  {
    title: "Frontend Developer",
    company: "TechNova",
    applied: "Applied yesterday",
    status: "Proof requested",
    needsProof: true,
  },
  {
    title: "Relationship Manager",
    company: "FinEdge Bank",
    applied: "Applied 5 days ago",
    status: "Application viewed",
  },
];

const tabs = ["All", "Applied", "Interview", "Closed"];

export default function Applications() {
  return (
    <main className="page score-page">
      <div className="hero">
        <div>
          <h1>My Applications</h1>
          <p>Keep track of your next opportunities.</p>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 20 }}>
        {tabs.map((tab, index) => (
          <button
            className={`filter-chip ${index === 0 ? "active" : ""}`}
            key={tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="evidence-list">
        {applications.map((application) => (
          <article className="evidence-card" key={application.title}>
            <div>
              <h3>{application.title}</h3>
              <p>
                {application.company} · {application.applied}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                className={`evidence-state ${application.needsProof ? "needs" : ""}`}
              >
                ● {application.status}
              </span>
              {application.needsProof && (
                <Link
                  href="/candidate/proof/interview"
                  className="text-button"
                  style={{ display: "flex", marginTop: 9 }}
                >
                  Complete proof <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
