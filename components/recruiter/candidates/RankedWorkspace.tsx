"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  MessageCircleOff,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  BADGE_LABEL,
  SESSION_STATE_LABEL,
  familyLabel,
  initials,
  scoreBand,
} from "@/lib/api/format";
import type { Badge, CandidateSummary, RankedCandidates } from "@/lib/api/types";

/**
 * The ranked list, filtered in the browser.
 *
 * Filtering happens here rather than as query params because the backend has
 * no filter parameters — and adding client-side controls that pretend to be
 * server filters would show a "142 results" count that no query produced. The
 * count below is the length of the list the API returned, nothing else.
 *
 * Every control here maps to a field the API actually sends. There is no
 * notice-period or salary filter, because ProofScreen stores neither, and a
 * dropdown that silently does nothing is worse than an absent one.
 */

const BADGES: Badge[] = ["verified", "partial", "unverified"];

export default function RankedWorkspace({ ranked }: { ranked: RankedCandidates }) {
  const [query, setQuery] = useState("");
  const [badge, setBadge] = useState<Badge | "">("");
  const [family, setFamily] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

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

  const clear = () => {
    setQuery("");
    setBadge("");
    setFamily("");
    setFlaggedOnly(false);
  };

  const filtering = Boolean(query || badge || family || flaggedOnly);

  return (
    <div className="ranked-workspace">
      <aside className="candidate-filters">
        <div className="filter-title">
          <b>Filter this ranking</b>
          <button onClick={clear} disabled={!filtering}>
            Clear all
          </button>
        </div>

        <p className="filter-hint">
          Filters narrow the list the API returned. They never change the
          ranking — only the role lens above does that.
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
          <select value={badge} onChange={(event) => setBadge(event.target.value as Badge | "")}>
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
          <ol className="ranked-list">
            {visible.map((candidate, index) => (
              <RankedRow
                candidate={candidate}
                rank={index + 1}
                roleId={ranked.scored_for?.id ?? ""}
                key={candidate.id}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function RankedRow({
  candidate,
  rank,
  roleId,
}: {
  candidate: CandidateSummary;
  rank: number;
  roleId: string;
}) {
  const href = roleId
    ? `/recruiter/candidates/${candidate.id}?role_id=${encodeURIComponent(roleId)}`
    : `/recruiter/candidates/${candidate.id}`;

  return (
    <li className="ranked-row">
      <Link href={href}>
        <span className="ranked-position">{rank}</span>
        <span className="avatar candidate-avatar">{initials(candidate.name)}</span>

        <span className="candidate-main">
          <b>
            {candidate.name}
            <em className={`badge-chip badge-${candidate.badge}`}>
              {candidate.badge === "verified" && <ShieldCheck size={11} />}
              {BADGE_LABEL[candidate.badge]}
            </em>
            {candidate.contradiction_count > 0 && (
              <em className="badge-chip badge-flag">
                <AlertTriangle size={11} />
                {candidate.contradiction_count}{" "}
                {candidate.contradiction_count === 1
                  ? "contradiction"
                  : "contradictions"}
              </em>
            )}
          </b>
          <small>
            {candidate.role ?? "Role not stated"} ·{" "}
            {familyLabel(candidate.job_family, candidate.job_family_label)}
            {candidate.state ? ` · ${SESSION_STATE_LABEL[candidate.state]}` : ""}
          </small>
          {/* Generated from stored rows by the backend. No model call, ever. */}
          {candidate.why_ranked ? (
            <span className="why-ranked">{candidate.why_ranked}</span>
          ) : (
            <span className="why-ranked why-missing">
              <MessageCircleOff size={11} /> No ranking rationale on record
            </span>
          )}
        </span>

        <span className="score-pair">
          <span className={`score-cell score-${scoreBand(candidate.competence_score)}`}>
            <b>{candidate.competence_score}</b>
            <small>competence</small>
          </span>
          <span className="score-cell muted">
            <b>{candidate.resume_score}</b>
            <small>resume only</small>
          </span>
          <span className="score-cell muted">
            <b>{candidate.role_coverage}%</b>
            <small>role coverage</small>
          </span>
        </span>

        <ArrowUpRight size={17} className="row-arrow" />
      </Link>
    </li>
  );
}
