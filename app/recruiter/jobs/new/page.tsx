import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import RoleProfileForm from "@/components/recruiter/roles/RoleProfileForm";
import { familyLabel } from "@/lib/api/format";
import { getAllTaxonomy, getTaxonomy } from "@/lib/api/recruiter";

/**
 * Create an opening — which in this product means creating a role lens.
 *
 * ONE FORM, NOT TWO. This renders the same `RoleProfileForm` that the lens
 * editor used, rather than a second component posting to the same endpoint.
 * Two forms for one mutation is two places for validation to drift, and the
 * backend applies the same rule to itself: the validation report and the
 * terminal script share one `build_report()` so their numbers cannot disagree.
 *
 * WHAT THE OLD FORM ASKED FOR AND THIS ONE DOES NOT: location, experience
 * band, salary range, a free-text description and a comma-separated skills
 * list. `JobRole` stores none of them. Keeping the inputs would mean a
 * recruiter typing a salary band into a box that throws it away — so the
 * fields are gone rather than decorative, and what replaces them is the thing
 * a lens actually is: which claim types and which dimensions this opening
 * cares about.
 *
 * The job family is a URL parameter because the claim types on the form come
 * from that family's taxonomy — one server fetch per choice, and a shareable
 * link to a half-configured opening.
 */
export default async function NewOpening({
  searchParams,
}: {
  searchParams: Promise<{ job_family?: string }>;
}) {
  const { job_family: requested } = await searchParams;
  const all = await getAllTaxonomy();

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
    <main className="recruiter-page narrow-recruiter-page">
      <Link href="/recruiter/jobs" className="recruiter-back">
        <ArrowLeft size={15} /> Back to openings
      </Link>

      <div className="recruiter-heading compact-heading">
        <div>
          <span className="eyebrow">NEW OPENING</span>
          <h1>Create an opening</h1>
          <p>
            Say what this role wants proved. Every candidate already scored is
            re-ranked under it the moment you save — nobody is re-interviewed.
          </p>
        </div>
      </div>

      {!all.ok && <ApiNotice error={all.error} what="the claim taxonomy" />}

      <div className="job-form">
        {families.length > 0 && (
          <div className="family-switch">
            <span>Job family</span>
            <div>
              {families.map((family) => (
                <Link
                  href={`/recruiter/jobs/new?job_family=${encodeURIComponent(family.key)}`}
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
          <ApiNotice error={taxonomy.error} what={`the ${activeFamily} taxonomy`} />
        )}
      </div>
    </main>
  );
}
