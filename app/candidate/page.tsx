"use client";

import { Filter, Search } from "lucide-react";
import { useState } from "react";

import JobCard from "@/components/candidate/jobs/JobCard";
import ProofScoreCard from "@/components/candidate/proof/ProofScoreCard";
import { jobs } from "@/lib/data";

const filters = ["For you", "High match", "Remote", "New", "Needs proof"];
const HIGH_MATCH_SCORE = 85;

export default function CandidateHome() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const search = query.toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    const searchable =
      `${job.title} ${job.company} ${job.location} ${job.requiredSkills.join(" ")}`.toLowerCase();
    const matchesSearch = searchable.includes(search);
    const matchesFilter =
      activeFilter !== "High match" || job.matchScore >= HIGH_MATCH_SCORE;

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="page">
      <div className="hero">
        <div>
          <h1>Good evening, Rahul</h1>
          <p>Jobs worth your attention.</p>
        </div>
      </div>

      <ProofScoreCard />

      <div className="section-title">
        <h2>Recommended for you</h2>
      </div>

      <div className="search-row">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search jobs"
            placeholder="Search jobs, skills or companies"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button className="filter-button" aria-label="Filters">
          <Filter size={17} />
        </button>
      </div>

      <div className="chips">
        {filters.map((filter) => (
          <button
            className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
            key={filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="jobs-grid" style={{ marginTop: 18 }}>
        {visibleJobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </div>
    </main>
  );
}
