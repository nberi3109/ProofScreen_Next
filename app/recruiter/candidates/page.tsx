"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import CandidatePreview from "@/components/recruiter/candidates/CandidatePreview";
import CandidateRow from "@/components/recruiter/candidates/CandidateRow";
import { recruiterCandidates } from "@/data/recruiter/candidates";

const noticePeriods = ["Immediate", "Up to 15 days", "Up to 30 days"];

export default function Candidates() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(recruiterCandidates[0].id);
  const [immediateOnly, setImmediateOnly] = useState(false);

  const search = query.toLowerCase();
  const visibleCandidates = recruiterCandidates.filter((candidate) => {
    const skillNames = candidate.skills.map((skill) => skill.name).join(" ");
    const searchable =
      `${candidate.name} ${candidate.role} ${candidate.location} ${skillNames}`.toLowerCase();
    const matchesSearch = searchable.includes(search);
    const matchesAvailability =
      !immediateOnly || candidate.availability.toLowerCase().includes("now");

    return matchesSearch && matchesAvailability;
  });

  // Fall back to the first result whenever the picked candidate is filtered out.
  const selectionVisible = visibleCandidates.some(
    (candidate) => candidate.id === selectedId,
  );
  const activeId = selectionVisible
    ? selectedId
    : (visibleCandidates[0]?.id ?? "");

  const clearFilters = () => {
    setQuery("");
    setImmediateOnly(false);
  };

  return (
    <main className="recruiter-page candidates-workspace">
      <div className="recruiter-heading candidates-heading">
        <div>
          <span className="eyebrow">TALENT DISCOVERY</span>
          <h1>Find candidates</h1>
          <p>Search people by skills, experience, and proof strength.</p>
        </div>
      </div>

      <div className="candidate-workspace-grid">
        <aside className="candidate-filters">
          <div className="filter-title">
            <b>Refine your search</b>
            <button onClick={clearFilters}>Clear all</button>
          </div>

          <label>
            Keywords
            <input placeholder="Search skills, title, or keyword" />
          </label>

          <label>
            Job field
            <select defaultValue="">
              <option value="" disabled>
                Select job field
              </option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>Customer Experience</option>
            </select>
          </label>

          <label>
            Experience (years)
            <div className="range-fields">
              <input placeholder="Min" />
              <span>to</span>
              <input placeholder="Max" />
            </div>
          </label>

          <label>
            Location
            <input placeholder="Select location" />
          </label>

          <label>
            Notice period
            <div className="check-list">
              {noticePeriods.map((period) => (
                <span key={period}>
                  <input type="checkbox" /> {period}
                </span>
              ))}
            </div>
          </label>

          <label>
            Skills
            <input placeholder="Add skills" />
          </label>

          <label>
            Availability
            <select defaultValue="">
              <option value="" disabled>
                Select availability
              </option>
              <option>Available now</option>
              <option>Available in 15 days</option>
            </select>
          </label>

          <button
            className="primary-button apply-filters"
            onClick={() => setImmediateOnly(true)}
          >
            Apply filters
          </button>
        </aside>

        <section className="candidate-results">
          <div className="results-toolbar">
            <label className="recruiter-search jobs-search">
              <Search size={16} />
              <input
                placeholder="Search candidates"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="jobs-filters">
              <button className="selected">Advanced search</button>
              <button>Manage searches</button>
            </div>
          </div>

          <div className="results-head">
            <div>
              <b>Search results</b>
              <span>{visibleCandidates.length * 83} candidates found</span>
            </div>
            <button>
              <SlidersHorizontal size={14} /> Best match
            </button>
          </div>

          <div className="candidate-list">
            {visibleCandidates.map((candidate) => (
              <div
                className={`candidate-select-row ${activeId === candidate.id ? "selected" : ""}`}
                onClick={() => setSelectedId(candidate.id)}
                key={candidate.id}
              >
                <CandidateRow candidate={candidate} />
              </div>
            ))}
          </div>

          <div className="results-footer">
            Showing 1–{visibleCandidates.length * 20} of 248{" "}
            <span>
              ‹　 <b>1</b>　2　3　…　13　›
            </span>
          </div>
        </section>

        <CandidatePreview
          candidateId={activeId}
          onClose={() => setSelectedId("")}
        />
      </div>
    </main>
  );
}
