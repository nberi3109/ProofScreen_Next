import { AlertTriangle, ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import { claimKeyLabel } from "@/lib/api/openings";
import { familyLabel } from "@/lib/api/format";
import { getAllTaxonomy, getRankedCandidates } from "@/lib/api/recruiter";

/**
 * Talent pools, which in this product are job families.
 *
 * A pool is "a group of candidates who belong together for the roles ahead",
 * and ProofScreen already has exactly one such grouping that means something:
 * the job family a resume routed to. It is not a label somebody applied by
 * hand — it decides which claim types the candidate was asked about and which
 * rubric weights scored them, so two people in the same pool were genuinely
 * assessed on the same terms.
 *
 * Every count here is a count of rows. The descriptions are the family's own
 * claim types from the taxonomy, so a pool describes itself in terms of what
 * its members had to prove rather than in marketing copy.
 */
export default async function TalentPools() {
  const [ranked, taxonomy] = await Promise.all([
    getRankedCandidates(null),
    getAllTaxonomy(),
  ]);

  if (!ranked.ok) {
    return (
      <main className="recruiter-page">
        <div className="recruiter-heading">
          <div>
            <span className="eyebrow">ORGANIZE TALENT</span>
            <h1>Talent pools</h1>
          </div>
        </div>
        <ApiNotice error={ranked.error} what="the talent pools" />
      </main>
    );
  }

  const families = taxonomy.ok ? taxonomy.data.families : {};

  // Only families that actually hold somebody. An empty pool for each of the
  // nine declared families would be a wall of zeroes.
  const pools = Object.entries(
    ranked.data.candidates.reduce<Record<string, typeof ranked.data.candidates>>(
      (acc, candidate) => {
        (acc[candidate.job_family] ??= []).push(candidate);
        return acc;
      },
      {},
    ),
  )
    .map(([key, members]) => ({
      key,
      label: familyLabel(key, families[key]?.label),
      claimTypes: Object.values(families[key]?.claim_types ?? {})
        .map((claim) => claim.label)
        .slice(0, 4),
      members,
      qualified: members.filter((m) => m.badge !== "unverified").length,
      flagged: members.filter((m) => m.contradiction_count > 0).length,
    }))
    .sort((a, b) => b.members.length - a.members.length);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">ORGANIZE TALENT</span>
          <h1>Talent pools</h1>
          <p>
            Grouped by the job family their resume routed to — the group that
            was assessed on the same claim types.
          </p>
        </div>
        <Link href="/recruiter/jobs/new" className="primary-button">
          <Plus size={16} /> New opening
        </Link>
      </div>

      {!taxonomy.ok && (
        <ApiNotice error={taxonomy.error} what="the claim taxonomy" />
      )}

      {pools.length === 0 ? (
        <EmptyNotice title="No pools yet.">
          <p>
            A pool appears as soon as a candidate&apos;s resume routes to its job
            family.
          </p>
        </EmptyNotice>
      ) : (
        <div className="pool-grid">
          {pools.map((pool) => (
            <Link
              href={`/recruiter/candidates?family=${encodeURIComponent(pool.key)}`}
              className="pool-card"
              key={pool.key}
            >
              <span>
                <FolderKanban size={18} />
              </span>
              <h2>{pool.label}</h2>
              <p>
                {pool.claimTypes.length > 0
                  ? `Assessed on ${pool.claimTypes.join(", ").toLowerCase()}.`
                  : `Assessed on the ${claimKeyLabel(pool.key)} claim types.`}
              </p>
              <div className="pool-figures">
                <span>
                  <b>{pool.qualified}</b> evidence-qualified
                </span>
                {pool.flagged > 0 && (
                  <span className="pool-flag">
                    <AlertTriangle size={12} /> {pool.flagged} flagged
                  </span>
                )}
              </div>
              <strong>
                <Users size={14} /> {pool.members.length}{" "}
                {pool.members.length === 1 ? "candidate" : "candidates"}{" "}
                <ArrowRight size={14} />
              </strong>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
