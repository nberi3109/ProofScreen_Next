import { ShieldCheck } from "lucide-react";

import ApiNotice from "@/components/api/ApiNotice";
import { ApiError } from "@/lib/api/client";
import IntakeForm from "@/components/candidate/intake/IntakeForm";
import { getRoles } from "@/lib/api/recruiter";

/**
 * POST /api/candidates — candidate intake.
 *
 * Two paths into the same pipeline: a resume file (multipart) or pasted text.
 * Both come back with extracted claims and a WhatsApp opt-in code, which is
 * where the candidate journey leaves this app for good — every question and
 * answer after this point happens on WhatsApp.
 */
export default async function CandidateStartPage({
  searchParams,
}: {
  searchParams: Promise<{ role_id?: string }>;
}) {
  // Arrives from an opening's "Get considered" button, so the resulting
  // evidence graph is scored under that role's weights from the start.
  const [{ role_id: roleId = "" }, roles] = await Promise.all([
    searchParams,
    getRoles(),
  ]);

  return (
    <main className="page intake-page">
      <div className="hero">
        <div>
          <span className="mini-label">
            <ShieldCheck size={13} /> EVIDENT
          </span>
          <h1>Turn a resume into evidence.</h1>
          <p>
            We pull out the claims worth checking, then verify them one by one
            over WhatsApp — in your own words, at your own pace.
          </p>
        </div>
      </div>

      {/* Role lenses are optional here, so a 404 or a mis-set env var should
          not interrupt intake. A dead API should, because nothing on this page
          will work. */}
      {!roles.ok && roles.error instanceof ApiError && roles.error.isUnreachable && (
        <ApiNotice error={roles.error} what="the role lenses" />
      )}

      <IntakeForm
        roles={roles.ok ? roles.data : []}
        defaultRoleId={roleId}
        showDiagnostics={process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS === "true"}
      />
    </main>
  );
}
