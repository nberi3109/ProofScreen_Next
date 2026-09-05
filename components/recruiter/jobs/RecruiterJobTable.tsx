import { AlertTriangle, ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";

import { claimKeyLabel, type Opening } from "@/lib/api/openings";
import { familyLabel } from "@/lib/api/format";

/**
 * The openings table, backed by role lenses.
 *
 * Every cell carries a `data-label`, which is what lets this render as a real
 * table on a laptop and as stacked rows on a phone from one piece of markup —
 * the CSS reveals the label as a leading column below 720px. The alternative,
 * horizontally scrolling an 800px table inside a 360px screen, technically
 * works and is miserable to use.
 *
 * Same six columns as before. Two changed what they hold, because the backend
 * has no answer for what they held previously:
 *
 *   "Status" was Published/Draft/Closed. A lens has no lifecycle, so it now
 *   shows which lens is the family default — the one candidates are ranked
 *   with when a recruiter has not picked one.
 *
 *   "Posted" was a date. `RoleOut` carries no timestamp, and inventing
 *   "2 days ago" on a screen recruiters make decisions from is exactly the
 *   kind of small lie that costs a demo its credibility. The column now shows
 *   what the opening weights most, which is the useful thing about a lens
 *   anyway.
 */
export default function RecruiterJobTable({ openings }: { openings: Opening[] }) {
  return (
    <div className="recruiter-table-wrap">
      <table className="recruiter-table">
        <thead>
          <tr>
            <th>Opening</th>
            <th>Lens</th>
            <th>Applicants</th>
            <th>Qualified</th>
            <th>Weights most</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {openings.map(({ role, applicants, qualified, flagged, topClaims }) => (
            <tr key={role.id}>
              <td data-label="Opening">
                <Link href={`/recruiter/jobs/${role.id}`} className="table-job">
                  <span className="job-table-icon">{role.title.charAt(0)}</span>
                  <span>
                    <b>{role.title}</b>
                    <small>{familyLabel(role.job_family, role.job_family_label)}</small>
                  </span>
                </Link>
              </td>
              <td data-label="Lens">
                <span className={`status-pill ${role.is_default ? "published" : "draft"}`}>
                  {role.is_default ? "Default" : "Custom"}
                </span>
              </td>
              <td data-label="Applicants">
                <Link
                  href={`/recruiter/jobs/${role.id}/applicants`}
                  className="table-number"
                >
                  <Users size={14} />
                  {applicants}
                </Link>
                {flagged > 0 && (
                  <span className="table-flag" title={`${flagged} with a contradiction`}>
                    <AlertTriangle size={12} /> {flagged}
                  </span>
                )}
              </td>
              <td data-label="Qualified">
                <b>{qualified}</b>
              </td>
              <td className="muted-cell" data-label="Weights most">
                {topClaims.length > 0
                  ? `${claimKeyLabel(topClaims[0].key)} ${topClaims[0].weight.toFixed(0)}%`
                  : "family defaults"}
              </td>
              <td className="row-open">
                <Link
                  href={`/recruiter/jobs/${role.id}`}
                  className="table-action"
                  aria-label={`Open ${role.title}`}
                >
                  <ArrowUpRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
