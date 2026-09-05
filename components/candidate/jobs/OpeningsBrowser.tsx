"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import JobCard from "@/components/candidate/jobs/JobCard";
import { claimKeyLabel, type CandidateOpening } from "@/lib/api/openings";
import { familyLabel } from "@/lib/api/format";

/**
 * Search and filter over the openings the API returned.
 *
 * The old chips were "For you / High match / Remote / New / Needs proof" —
 * three of which had nothing behind them. These filter on what the API
 * reports: whether this candidate has evidenced any of the claim types the
 * opening weights, and whether it weights something they have not claimed.
 */
const FILTERS = [
  { key: "all", label: "All roles" },
  { key: "covered", label: "My evidence fits" },
  { key: "gaps", label: "Has gaps I could close" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function OpeningsBrowser({
  openings,
}: {
  openings: CandidateOpening[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return openings.filter((opening) => {
      if (filter === "covered" && !opening.matched.some((m) => m.evidenced)) {
        return false;
      }
      if (filter === "gaps" && opening.missing.length === 0) return false;
      if (!needle) return true;
      const haystack = [
        opening.role.title,
        familyLabel(opening.role.job_family, opening.role.job_family_label),
        ...opening.topClaims.map((claim) => claimKeyLabel(claim.key)),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [openings, query, filter]);

  return (
    <>
      <div className="search-row">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search openings"
            placeholder="Search roles, families, or claim types"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="chips">
        {FILTERS.map((item) => (
          <button
            className={`filter-chip ${filter === item.key ? "active" : ""}`}
            key={item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="results-empty">No open role matches that.</p>
      ) : (
        <div className="jobs-grid" style={{ marginTop: 18 }}>
          {visible.map((opening) => (
            <JobCard opening={opening} key={opening.role.id} />
          ))}
        </div>
      )}
    </>
  );
}
