import type { ReactNode } from "react";

import SampleBanner from "@/components/api/SampleBanner";
import CandidateShell from "@/components/candidate/layout/CandidateShell";
import { getHealth } from "@/lib/api/client";

/**
 * A Server Component so the sample-data banner can be decided on the server.
 *
 * Same caution as the recruiter layout: in Next 16 a layout that reads
 * uncached data blocks navigation into every route beneath it and does not
 * fall back to a same-segment loading.js. The health read is capped at five
 * seconds and degrades to an error result, so a slow API costs the banner and
 * nothing else.
 */
export default async function CandidateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const health = await getHealth();

  return (
    <>
      {health.ok && health.sample && <SampleBanner />}
      <CandidateShell>{children}</CandidateShell>
    </>
  );
}
