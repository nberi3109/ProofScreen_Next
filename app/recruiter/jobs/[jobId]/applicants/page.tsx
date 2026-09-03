import { ArrowLeft, Filter, Search } from "lucide-react";
import Link from "next/link";

import { applicants } from "@/data/recruiter/applicants";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <main className="recruiter-page">
      <Link href={`/recruiter/jobs/${jobId}`} className="recruiter-back">
        <ArrowLeft size={15} /> Back to job
      </Link>

      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">APPLICANTS / FRONTEND DEVELOPER</span>
          <h1>Applicant review</h1>
          <p>Ranked by proof strength and role fit.</p>
        </div>
        <button className="outline-button">
          <Filter size={15} /> Filters
        </button>
      </div>

      <div className="applicants-toolbar">
        <label className="recruiter-search jobs-search">
          <Search size={16} />
          <input placeholder="Search applicants" />
        </label>
        <span className="applicant-count">{applicants.length} applicants</span>
      </div>

      <div className="applicant-table">
        {applicants.map((applicant) => (
          <Link
            href={`/recruiter/candidates/${applicant.candidateId}`}
            className="applicant-row"
            key={applicant.id}
          >
            <span className="avatar candidate-avatar">
              {applicant.initials}
            </span>
            <span className="candidate-main">
              <b>{applicant.name}</b>
              <small>Applied {applicant.applied}</small>
            </span>
            <span className="applicant-skill-list">
              {applicant.topSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </span>
            <span className="candidate-score">
              <b>{applicant.score}</b>
              <small>Proof score</small>
            </span>
            <span className={`status-pill ${applicant.status.toLowerCase()}`}>
              {applicant.status}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
