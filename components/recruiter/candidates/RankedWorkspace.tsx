"use client";

import { MessageCircleOff, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import CandidatePreview from "@/components/recruiter/candidates/CandidatePreview";
import CandidateRow from "@/components/recruiter/candidates/CandidateRow";
import { BADGE_LABEL, familyLabel, scoreBand } from "@/lib/api/format";
import type { Badge, CandidateSummary, RankedCandidates } from "@/lib/api/types";

/**
 * The ranked list: filters, rows, and a preview pane.
 *
 * Filtering happens in the browser because the backend has no filter
 * parameters — and client-side controls dressed up as server filters would
 * report a result count no query produced. The count below is the length of
 * the list the API returned, nothing else.
 *
 * Every control maps to a field the API actually sends. There is no
 * notice-period, salary or availability filter, because Evident stores
 * none of those, and a dropdown that silently does nothing is worse than an
 * absent one.
 *
 * Sorting is deliberately NOT offered. The order is the backend's ranking
 * under the chosen lens; a "sort by resume score" control would quietly
 * replace an evidence ranking with the thing the product exists to beat. To
 * reorder, change the lens.
 */

const BADGES: Badge[] = ["verified", "partial", "unverified"];

export default function RankedWorkspace({
  ranked,
  initialFamily = "",
}: {
  ranked: RankedCandidates;
  /** Seeded from `?family=` so a talent pool links straight into its cohort. */
  initialFamily?: string;
}) {
  const [query, setQuery] = useState("");
  const [badge, setBadge] = useState<Badge | "">("");
  const [family, setFamily] = useState(initialFamily);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(ranked.candidates[0]?.id ?? "");

  const families = useMemo(() => {
    const seen = new Map<string, string>();
    for (const candidate of ranked.candidates) {
      if (!seen.has(candidate.job_family)) {
        seen.set(
          candidate.job_family,
          familyLabel(candidate.job_family, candidate.job_family_label),
        );
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [ranked.candidates]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ranked.candidates.filter((candidate) => {
      if (badge && candidate.badge !== badge) return false;
      if (family && candidate.job_family !== family) return false;
      if (flaggedOnly && candidate.contradiction_count === 0) return false;
      if (!needle) return true;
      const haystack = `${candidate.name} ${candidate.role ?? ""} ${candidate.job_family_label} ${candidate.why_ranked ?? ""}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [ranked.candidates, query, badge, family, flaggedOnly]);

  // Fall back to the first result whenever the picked candidate is filtered out.
  const selected =
    visible.find((candidate) => candidate.id === selectedId) ?? visible[0] ?? null;

  const clear = () => {
    setQuery("");
    setBadge("");
    setFamily("");
    setFlaggedOnly(false);
  };

  const filtering = Boolean(query || badge || family || flaggedOnly);
  const roleId = ranked.scored_for?.id ?? "";

  return (
    <div className="candidate-workspace-grid">
      <aside className="candidate-filters">
        <div className="filter-title">
          <b>Filter this ranking</b>
          <button onClick={clear} disabled={!filtering}>
            Clear all
          </button>
        </div>

        <p className="filter-hint">
          Filters narrow the list the API returned. They never change the
          ranking — only the lens above does that.
        </p>

        <label>
          Search
          <input
            placeholder="Name, role, or reason"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label>
          Evidence badge
          <select
            value={badge}
            onChange={(event) => setBadge(event.target.value as Badge | "")}
          >
            <option value="">Any badge</option>
            {BADGES.map((value) => (
              <option value={value} key={value}>
                {BADGE_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Job family
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            <option value="">All families</option>
            {families.map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-check">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(event) => setFlaggedOnly(event.target.checked)}
          />
          Only candidates with a contradiction
        </label>
      </aside>

      <section className="candidate-results">
        <div className="results-head">
          <div>
            <b>
              {visible.length} of {ranked.candidates.length}{" "}
              {ranked.candidates.length === 1 ? "candidate" : "candidates"}
            </b>
            <span>
              Ordered by competence score under{" "}
              {ranked.scored_for
                ? `the “${ranked.scored_for.title}” lens`
                : "job-family default weights"}
            </span>
          </div>
          <label className="recruiter-search">
            <Search size={16} />
            <input
              placeholder="Search candidates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="results-empty">
            {ranked.candidates.length === 0
              ? "No candidates scored yet. Onboard one and the ranking appears here."
              : "No candidate in this ranking matches those filters."}
          </p>
        ) : (
          <ol className="candidate-list ranked-list">
            {visible.map((candidate, index) => (
              <li
                className={`candidate-select-row ${selected?.id === candidate.id ? "selected" : ""}`}
                onClick={() => setSelectedId(candidate.id)}
                key={candidate.id}
              >
                <span className="ranked-position">{index + 1}</span>
                <Link
                  href={
                    roleId
                      ? `/recruiter/candidates/${candidate.id}?role_id=${encodeURIComponent(roleId)}`
                      : `/recruiter/candidates/${candidate.id}`
                  }
                  className="candidate-row-link"
                >
                  <CandidateRow candidate={candidate} />
                </Link>
                <WhyRanked candidate={candidate} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <CandidatePreview
        candidate={selected}
        roleId={roleId}
        onClose={() => setSelectedId("__none__")}
      />
    </div>
  );
}

/** Generated by the backend from stored rows. No model call, ever — which is
 *  why it can be shown next to the number it explains. */
function WhyRanked({ candidate }: { candidate: CandidateSummary }) {
  if (!candidate.why_ranked) {
    return (
      <span className="why-ranked why-missing">
        <MessageCircleOff size={11} /> No ranking rationale on record
      </span>
    );
  }
  return (
    <span className={`why-ranked why-${scoreBand(candidate.competence_score)}`}>
      {candidate.why_ranked}
    </span>
  );
}
