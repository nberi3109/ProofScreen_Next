import { ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import { DIMENSION_LABEL, familyLabel } from "@/lib/api/format";
import { buildOpenings, claimKeyLabel } from "@/lib/api/openings";
import { getRankedCandidates, getRoles } from "@/lib/api/recruiter";

/**
 * Saved searches, which in this product are role lenses.
 *
 * A saved search is "a set of criteria you re-run to see who matches now". A
 * role lens is a set of weights you re-run to see who ranks now — over
 * evidence already collected, with no model call and nobody re-interviewed.
 * Same idea, and this one is stored server-side rather than in one browser, so
 * a colleague opening the link sees the same ranking.
 *
 * The toggle shows which lens is its family's default: the weights used when a
 * recruiter has not chosen one. The match count is the number of candidates
 * ranked under the lens, counted from one call rather than fetched per row —
 * passing a `role_id` re-orders every scored candidate, so that count is the
 * whole list, and the cohort figure beside it is the subset whose claim types
 * the lens's weights actually apply to.
 */
export default async function SavedSearches() {
  const [roles, ranked] = await Promise.all([
    getRoles(),
    getRankedCandidates(null),
  ]);

  if (!roles.ok) {
    return (
      <main className="recruiter-page">
        <div className="recruiter-heading">
          <div>
            <span className="eyebrow">AUTOMATED DISCOVERY</span>
            <h1>Saved rankings</h1>
          </div>
        </div>
        <ApiNotice error={roles.error} what="your saved rankings" />
      </main>
    );
  }

  const total = ranked.ok ? ranked.data.candidates.length : 0;
  const openings = buildOpenings(roles.data, ranked.ok ? ranked.data.candidates : []);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">AUTOMATED DISCOVERY</span>
          <h1>Saved rankings</h1>
          <p>
            Each one re-ranks every candidate from evidence already collected.
            Open it and the order is current.
          </p>
        </div>
        <Link href="/recruiter/jobs/new" className="primary-button">
          <Plus size={16} /> Save a ranking
        </Link>
      </div>

      {!ranked.ok && (
        <ApiNotice error={ranked.error} what="the candidate counts" />
      )}

      {openings.length === 0 ? (
        <EmptyNotice title="No saved rankings yet.">
          <p>
            Candidates are ranked with their job family&apos;s default weights
            until you save one.
          </p>
        </EmptyNotice>
      ) : (
        <div className="saved-search-list">
          {openings.map(({ role, applicants, topClaims, topDimensions }) => (
            <Link
              className="saved-search-row"
              href={`/recruiter/candidates?role_id=${encodeURIComponent(role.id)}`}
              key={role.id}
            >
              <span className="saved-search-icon">
                <Search size={17} />
              </span>
              <div>
                <h2>{role.title}</h2>
                <p>
                  {familyLabel(role.job_family, role.job_family_label)}
                  {topClaims[0]
                    ? ` · ${claimKeyLabel(topClaims[0].key)} ${topClaims[0].weight.toFixed(0)}%`
                    : ""}
                  {topDimensions[0] && topDimensions[0].weight > 0
                    ? ` · leans on ${DIMENSION_LABEL[topDimensions[0].dimension]}`
                    : ""}
                </p>
              </div>
              <span className="search-match">
                <b>{total}</b>
                <small>ranked</small>
              </span>
              <span className="search-match">
                <b>{applicants}</b>
                <small>in cohort</small>
              </span>
              <span
                className={`toggle ${role.is_default ? "on" : ""}`}
                title={
                  role.is_default
                    ? "Family default — used when no lens is chosen"
                    : "Custom lens"
                }
              >
                <i />
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
