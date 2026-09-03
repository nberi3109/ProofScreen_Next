import { ArrowRight, BriefcaseBusiness, Plus, Users, Zap } from "lucide-react";
import Link from "next/link";

import { recruiterJobs } from "@/data/recruiter/jobs";

const stats = [
  {
    Icon: BriefcaseBusiness,
    label: "Active jobs",
    value: "8",
    note: "+2 this month",
  },
  {
    Icon: Users,
    label: "Total applicants",
    value: "142",
    note: "+18% this week",
  },
  {
    Icon: Zap,
    label: "Proof-qualified",
    value: "64",
    note: "45% of applicants",
  },
];

const pipelineStages = [
  { label: "New", count: 67 },
  { label: "Proof-qualified", count: 32 },
  { label: "Shortlisted", count: 19 },
  { label: "Interview", count: 8 },
];

const recentJobs = recruiterJobs.slice(0, 3);

export default function RecruiterHome() {
  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">TUESDAY, SEPTEMBER 3</span>
          <h1>Good morning, Priya</h1>
          <p>Here is what is moving across your hiring pipeline.</p>
        </div>
        <Link href="/recruiter/jobs/new" className="primary-button">
          <Plus size={16} /> Create a job
        </Link>
      </div>

      <div className="recruiter-stat-grid">
        {stats.map(({ Icon, label, value, note }) => (
          <div className="recruiter-stat" key={label}>
            <span>
              <Icon size={17} />
            </span>
            <small>{label}</small>
            <b>{value}</b>
            <em>{note}</em>
          </div>
        ))}
      </div>

      <div className="recruiter-section-head">
        <h2>Hiring pulse</h2>
        <Link href="/recruiter/jobs">
          View all jobs <ArrowRight size={15} />
        </Link>
      </div>

      <div className="pulse-grid">
        <div className="pipeline-card">
          <div className="pipeline-title">
            <div>
              <b>Candidate pipeline</b>
              <small>Across all published roles</small>
            </div>
            <strong>142</strong>
          </div>

          <div className="pipeline-bar">
            {pipelineStages.map((stage) => (
              <i key={stage.label} />
            ))}
          </div>

          <div className="pipeline-legend">
            {pipelineStages.map((stage) => (
              <span key={stage.label}>
                <i />
                {stage.label} <b>{stage.count}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="focus-card">
          <span className="mini-label">RECRUITER INSIGHT</span>
          <h3>Proof-first hiring is moving faster.</h3>
          <p>
            Candidates with verified skills reach shortlist 2.4× more often on
            your open roles.
          </p>
          <Link href="/recruiter/candidates">
            Explore candidates <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="recruiter-section-head">
        <h2>Recent jobs</h2>
        <Link href="/recruiter/jobs">
          Manage jobs <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mini-jobs">
        {recentJobs.map((job) => (
          <Link href={`/recruiter/jobs/${job.id}`} key={job.id}>
            <span className="job-table-icon">{job.title[0]}</span>
            <span>
              <b>{job.title}</b>
              <small>
                {job.applicants} applicants · {job.posted}
              </small>
            </span>
            <strong>{job.qualified} qualified</strong>
            <ArrowRight size={15} />
          </Link>
        ))}
      </div>
    </main>
  );
}
