import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

import ApplyButton from "@/components/candidate/jobs/ApplyButton";
import JobMatchReasons from "@/components/candidate/jobs/JobMatchReasons";
import SaveButton from "@/components/candidate/jobs/SaveButton";
import MatchBadge from "@/components/ui/MatchBadge";
import { jobs } from "@/lib/data";

export default async function CandidateJobDetails({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = jobs.find((item) => item.id === jobId) ?? jobs[0];

  return (
    <main className="page detail-layout">
      <Link className="back-link" href="/candidate">
        <ArrowLeft size={15} /> Back to jobs
      </Link>

      <section className="detail-head">
        <div className="company-mark" style={{ background: job.logoColor }}>
          {job.logo}
        </div>
        <h1>{job.title}</h1>
        <div className="eyebrow">
          {job.company} · {job.location} · {job.type}
        </div>
        <div className="salary-line">
          {job.salary} <span>·</span> {job.experience}
        </div>
        <div className="detail-score">
          <MatchBadge score={job.matchScore} />
          <span>
            Strong fit based on your resume, experience, and existing proof.
          </span>
        </div>
      </section>

      <div className="section-title">
        <h2>Why you match</h2>
        <span className="mini-label" style={{ color: "#716d82" }}>
          EVIDENCE CHECK
        </span>
      </div>

      <JobMatchReasons
        strengths={job.candidateEvidence}
        missing={job.missingProof}
      />

      <div className="section-title">
        <h2>What this job needs</h2>
      </div>

      <div
        className="skill-row"
        style={{ overflow: "visible", flexWrap: "wrap" }}
      >
        {job.requiredSkills.map((skill) => (
          <span className="skill-chip verified" key={skill}>
            <Check size={13} />
            {skill}
          </span>
        ))}
      </div>

      <p
        style={{
          color: "#716d82",
          font: "13px Arial,sans-serif",
          lineHeight: 1.6,
          marginTop: 24,
        }}
      >
        {job.description}
      </p>

      <div className="sticky-actions">
        <SaveButton />
        <ApplyButton />
      </div>
    </main>
  );
}
