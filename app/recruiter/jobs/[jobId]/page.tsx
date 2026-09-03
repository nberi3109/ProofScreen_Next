import { ArrowLeft, ArrowRight, Edit3, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { recruiterJobs } from "@/data/recruiter/jobs";

export default async function RecruiterJobDetail({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job =
    recruiterJobs.find((item) => item.id === jobId) ?? recruiterJobs[0];
  const qualifiedShare = job.applicants
    ? Math.round((job.qualified / job.applicants) * 100)
    : 0;

  return (
    <main className="recruiter-page narrow-recruiter-page">
      <Link href="/recruiter/jobs" className="recruiter-back">
        <ArrowLeft size={15} /> Back to jobs
      </Link>

      <section className="recruiter-detail-hero">
        <div className="detail-title-row">
          <div>
            <span className="eyebrow">{job.department}</span>
            <h1>{job.title}</h1>
            <p>
              <MapPin size={15} /> {job.location} <span>·</span> {job.type}{" "}
              <span>·</span> {job.salary}
            </p>
          </div>
          <span className={`status-pill ${job.status.toLowerCase()}`}>
            {job.status}
          </span>
        </div>

        <div className="detail-actions">
          <Link
            href={`/recruiter/jobs/${job.id}/applicants`}
            className="primary-button"
          >
            <Users size={16} /> View applicants <ArrowRight size={16} />
          </Link>
          <button className="outline-button">
            <Edit3 size={15} /> Edit job
          </button>
        </div>
      </section>

      <div className="recruiter-stat-grid detail-stats">
        <div className="recruiter-stat">
          <small>Total applicants</small>
          <b>{job.applicants}</b>
          <em>Since publishing</em>
        </div>
        <div className="recruiter-stat">
          <small>Proof-qualified</small>
          <b>{job.qualified}</b>
          <em>{qualifiedShare}% of applicants</em>
        </div>
        <div className="recruiter-stat">
          <small>Role views</small>
          <b>386</b>
          <em>+12% this week</em>
        </div>
      </div>

      <div className="recruiter-detail-grid">
        <section className="recruiter-panel">
          <h2>Role overview</h2>
          <p>{job.description}</p>
          <h3>What you will work on</h3>
          <p>
            Partner with product and design to ship high-quality outcomes, make
            decisions with context, and raise the bar for the team.
          </p>
        </section>

        <section className="recruiter-panel">
          <h2>Skills to verify</h2>
          <div className="recruiter-skill-list">
            {job.skills.map((skill) => (
              <span key={skill}>✓ {skill}</span>
            ))}
          </div>

          <h2 style={{ marginTop: 30 }}>Hiring signal</h2>
          <div className="signal-line">
            <span>Proof-qualified applicants</span>
            <b>{qualifiedShare}%</b>
          </div>
          <div className="progress">
            <i style={{ width: `${qualifiedShare}%` }} />
          </div>
        </section>
      </div>
    </main>
  );
}
