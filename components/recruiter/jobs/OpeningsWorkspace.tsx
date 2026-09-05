"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import RecruiterJobTable from "@/components/recruiter/jobs/RecruiterJobTable";
import { claimKeyLabel, type Opening } from "@/lib/api/openings";
import { familyLabel } from "@/lib/api/format";

/**
 * Search and filter over the openings the API returned.
 *
 * The old filter chips were Published / Draft / Closed — a lifecycle a role
 * lens does not have. These four filter on things the API actually reports,
 * and the count under them is the number of rows shown rather than a
 * decorative multiple of it.
 */
const FILTERS = [
  { key: "all", label: "All openings" },
  { key: "default", label: "Family default" },
  { key: "staffed", label: "Has applicants" },
  { key: "flagged", label: "Needs attention" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function OpeningsWorkspace({ openings }: { openings: Opening[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return openings.filter((opening) => {
      if (filter === "default" && !opening.role.is_default) return false;
      if (filter === "staffed" && opening.applicants === 0) return false;
      if (filter === "flagged" && opening.flagged === 0) return false;
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
      <div className="jobs-toolbar">
        <label className="recruiter-search jobs-search">
          <Search size={16} />
          <input
            placeholder="Search by title, family, or what it weights"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="jobs-filters">
          {FILTERS.map((item) => (
            <button
              className={filter === item.key ? "selected" : ""}
              key={item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-summary">
        <span>
          <b>{visible.length}</b> of {openings.length}{" "}
          {openings.length === 1 ? "opening" : "openings"}
        </span>
        <span>Applicant counts are live</span>
      </div>

      {visible.length === 0 ? (
        <p className="results-empty">
          {openings.length === 0
            ? "No openings yet. Create one and every scored candidate is ranked under it immediately."
            : "No opening matches those filters."}
        </p>
      ) : (
        <RecruiterJobTable openings={visible} />
      )}
    </>
  );
}
