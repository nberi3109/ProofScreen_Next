"use client";

import { Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import RecruiterJobTable from "@/components/recruiter/jobs/RecruiterJobTable";
import { recruiterJobs } from "@/data/recruiter/jobs";

const statusFilters = ["All jobs", "Published", "Draft", "Closed"];

export default function RecruiterJobs() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(statusFilters[0]);

  const search = query.toLowerCase();
  const visibleJobs = recruiterJobs.filter((job) => {
    const searchable =
      `${job.title} ${job.department} ${job.location}`.toLowerCase();
    const matchesSearch = searchable.includes(search);
    const matchesStatus = status === "All jobs" || job.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">WORKSPACE / JOBS</span>
          <h1>Your jobs</h1>
          <p>
            Create roles, monitor applicants, and find proof-qualified talent.
          </p>
        </div>
        <Link href="/recruiter/jobs/new" className="primary-button">
          <Plus size={16} /> Create a job
        </Link>
      </div>

      <div className="jobs-toolbar">
        <label className="recruiter-search jobs-search">
          <Search size={16} />
          <input
            placeholder="Search by title, team, or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="jobs-filters">
          {statusFilters.map((item) => (
            <button
              className={status === item ? "selected" : ""}
              key={item}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
          <button aria-label="More filters">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="jobs-summary">
        <span>
          <b>{visibleJobs.length}</b> roles shown
        </span>
        <span>Last updated just now</span>
      </div>

      <RecruiterJobTable jobs={visibleJobs} />
    </main>
  );
}
