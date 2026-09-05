import { Plus } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import OpeningsWorkspace from "@/components/recruiter/jobs/OpeningsWorkspace";
import { buildOpenings } from "@/lib/api/openings";
import { getRankedCandidates, getRoles } from "@/lib/api/recruiter";

/**
 * Openings, backed by `GET /api/recruiter/roles`.
 *
 * Two calls, in parallel, for the whole table: the lenses, and every scored
 * candidate once. Applicant and qualified counts are then counted per lens
 * from that single list rather than fetched per row — a jobs page that issued
 * one request per opening would be slow for no gain, since the ranking of all
 * candidates is identical regardless of which lens you ask for.
 */
export default async function RecruiterJobs() {
  const [roles, ranked] = await Promise.all([
    getRoles(),
    getRankedCandidates(null),
  ]);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">WORKSPACE / OPENINGS</span>
          <h1>Your openings</h1>
          <p>
            Each opening is a lens: what it wants proved, and who has proved it.
          </p>
        </div>
        <Link href="/recruiter/jobs/new" className="primary-button">
          <Plus size={16} /> Create an opening
        </Link>
      </div>

      {!roles.ok ? (
        <ApiNotice error={roles.error} what="your openings" />
      ) : !ranked.ok ? (
        <ApiNotice error={ranked.error} what="the candidate counts" />
      ) : (
        <OpeningsWorkspace openings={buildOpenings(roles.data, ranked.data.candidates)} />
      )}
    </main>
  );
}
