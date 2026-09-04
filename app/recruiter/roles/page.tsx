import { Layers3 } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import RoleProfileForm from "@/components/recruiter/roles/RoleProfileForm";
import { DIMENSION_LABEL, familyLabel } from "@/lib/api/format";
import { getAllTaxonomy, getRoles, getTaxonomy } from "@/lib/api/recruiter";
import { DIMENSIONS } from "@/lib/api/types";

/**
 * Role weight profiles — the recruiter ranking layer.
 *
 * Weights are applied LATE, over evidence that is already stored, which is the
 * whole reason this screen can exist at all: creating a lens here re-ranks
 * every candidate already in the system without asking any of them another
 * question. The evidence is a fact; the ranking is an opinion, and this is
 * where the opinion is edited.
 *
 * The job family is a URL parameter rather than client state because the claim
 * types on the form come from the taxonomy for that family — one server fetch
 * per choice, and a shareable link to a half-configured lens.
 */
export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ job_family?: string }>;
}) {
  const { job_family: requested } = await searchParams;

  const [roles, all] = await Promise.all([getRoles(), getAllTaxonomy()]);

  const families = all.ok
    ? Object.entries(all.data.families)
        .map(([key, value]) => ({ key, label: familyLabel(key, value.label) }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const activeFamily =
    requested && families.some((f) => f.key === requested)
      ? requested
      : (families[0]?.key ?? "general");

  const taxonomy = await getTaxonomy(activeFamily);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">RANKING LAYER</span>
          <h1>Role lenses</h1>
          <p>
            Same evidence, different priorities. A lens changes the order of the
            ranking without re-interviewing anyone.
          </p>
        </div>
      </div>

      {!all.ok && <ApiNotice error={all.error} what="the claim taxonomy" />}

      <div className="roles-layout">
        <section className="recruiter-panel">
          <h2>
            <Layers3 size={17} /> Existing lenses
          </h2>
          {!roles.ok ? (
            <ApiNotice error={roles.error} what="the role profiles" />
          ) : roles.data.length === 0 ? (
            <EmptyNotice title="No lens yet.">
              <p>
                Candidates are ranked with their job-family default weights until
                you create one.
              </p>
            </EmptyNotice>
          ) : (
            <ul className="role-list">
              {roles.data.map((role) => {
                const topClaims = Object.entries(role.claim_weights)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3);
                const topDims = DIMENSIONS.map(
                  (d) => [d, role.dimension_weights[d] ?? 0] as const,
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2);
                return (
                  <li key={role.id}>
                    <div className="role-list-head">
                      <b>{role.title}</b>
                      {role.is_default && <em>default</em>}
                    </div>
                    <small>
                      {familyLabel(role.job_family, role.job_family_label)}
                    </small>
                    {topClaims.length > 0 && (
                      <p>
                        Weights most:{" "}
                        {topClaims
                          .map(([key, weight]) => `${key} ${weight.toFixed(0)}`)
                          .join(" · ")}
                      </p>
                    )}
                    {topDims.length > 0 && (
                      <p>
                        Leans on:{" "}
                        {topDims
                          .map(
                            ([dim, weight]) =>
                              `${DIMENSION_LABEL[dim]} ${weight.toFixed(0)}`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                    <Link
                      href={`/recruiter/candidates?role_id=${encodeURIComponent(role.id)}`}
                    >
                      Rank candidates with this lens
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="recruiter-panel">
          <h2>New lens</h2>

          {families.length > 0 && (
            <div className="family-switch">
              <span>Job family</span>
              <div>
                {families.map((family) => (
                  <Link
                    href={`/recruiter/roles?job_family=${encodeURIComponent(family.key)}`}
                    className={family.key === activeFamily ? "active" : ""}
                    key={family.key}
                  >
                    {family.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {taxonomy.ok ? (
            <RoleProfileForm taxonomy={taxonomy.data} families={families} />
          ) : (
            <ApiNotice
              error={taxonomy.error}
              what={`the ${activeFamily} taxonomy`}
            />
          )}
        </section>
      </div>
    </main>
  );
}
