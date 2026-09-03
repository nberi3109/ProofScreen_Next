"use client";

import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import SaveButton from "@/components/candidate/jobs/SaveButton";
import MatchBadge from "@/components/ui/MatchBadge";
import SkillChip from "@/components/ui/SkillChip";
import type { Job } from "@/lib/data";

export default function JobCard({ job }: { job: Job }) {
  const router = useRouter();

  const openJob = () => router.push(`/candidate/jobs/${job.id}`);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const clickedControl = (event.target as HTMLElement).closest("button, a");
    if (!clickedControl) openJob();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openJob();
  };

  return (
    <article
      className="job-card"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${job.title} at ${job.company}`}
    >
      <div className="job-card-top">
        <div className="company-mark" style={{ background: job.logoColor }}>
          {job.logo}
        </div>
        <div className="job-heading">
          <div className="eyebrow">
            {job.company} <span className="verified-dot">✓ Verified</span>
          </div>
          <h3>{job.title}</h3>
          <div className="job-meta">
            <span>
              <MapPin size={13} />
              {job.location}
            </span>
            <span>
              <BriefcaseBusiness size={13} />
              {job.type}
            </span>
          </div>
        </div>
        <MatchBadge score={job.matchScore} />
      </div>

      <div className="salary-line">
        {job.salary} <span>·</span> {job.experience}
      </div>

      <div className="skill-row">
        {job.requiredSkills.map((skill, index) => (
          <SkillChip
            key={skill}
            name={skill}
            state={index === 0 ? "verified" : "resume"}
          />
        ))}
      </div>

      <div className="reasons">
        <strong>Why this matches you</strong>
        {job.candidateEvidence.slice(0, 3).map((reason) => (
          <span key={reason}>✓ {reason}</span>
        ))}
      </div>

      <div
        className="card-actions"
        onClick={(event) => event.stopPropagation()}
      >
        <SaveButton />
        <Link className="text-button" href={`/candidate/jobs/${job.id}`}>
          View job <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
