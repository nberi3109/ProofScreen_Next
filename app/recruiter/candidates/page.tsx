import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import RankedWorkspace from "@/components/recruiter/candidates/RankedWorkspace";
import RoleLens from "@/components/recruiter/candidates/RoleLens";
import { getRankedCandidates, getRoles } from "@/lib/api/recruiter";

/**
 * GET /api/recruiter/candidates — the ranked list.
 *
 * The `role_id` in the URL is the point of this screen. The same stored
 * evidence, re-weighted: nobody is re-interviewed, no model call is made, and
 * the ORDER changes, not just the numbers. Keeping the lens in the URL means a
 * particular ranking is a link a recruiter can send to a colleague.
 *
 * A Server Component, so the API address never reaches the browser and there
 * is no CORS relationship between the two deployments. `fetch` is uncached in
 * Next 16, which is what a live score board wants — this page shows what the
 * database says right now.
 */
export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ role_id?: string }>;
}) {
  const { role_id: roleId = "" } = await searchParams;

  // Independent calls, so they go together rather than one after the other.
  const [ranked, roles] = await Promise.all([
    getRankedCandidates(roleId || null),
    getRoles(),
  ]);

  return (
    <main className="recruiter-page candidates-workspace">
      <div className="recruiter-heading candidates-heading">
        <div>
          <span className="eyebrow">EVIDENCE RANKING</span>
          <h1>Candidates</h1>
          <p>
            Ranked by evidence a candidate actually produced — not by what their
            resume asserts.
          </p>
        </div>
        {roles.ok && (
          <RoleLens
            roles={roles.data}
            activeRoleId={roleId}
            basePath="/recruiter/candidates"
          />
        )}
      </div>

      {!roles.ok && <ApiNotice error={roles.error} what="the role weight profiles" />}

      {ranked.ok ? (
        <>
          {ranked.data.scored_for ? (
            <p className="lens-explainer">
              Scored for <b>{ranked.data.scored_for.title}</b> (
              {ranked.data.scored_for.job_family}). Switch the lens and the order
              changes — the evidence does not.{" "}
              <Link href="/recruiter/roles">Manage lenses</Link>
            </p>
          ) : (
            <p className="lens-explainer">
              Scored with each candidate&apos;s job-family default weights.{" "}
              <Link href="/recruiter/roles">Create a role lens</Link> to rank the
              same evidence for a specific opening.
            </p>
          )}
          <RankedWorkspace ranked={ranked.data} />
        </>
      ) : (
        <ApiNotice error={ranked.error} what="the candidate ranking" />
      )}
    </main>
  );
}
