import type { ReactNode } from "react";

import RecruiterShell from "@/components/recruiter/layout/RecruiterShell";
import { getHealth } from "@/lib/api/client";

/**
 * A Server Component, so the health read happens on the server and the API
 * address never reaches the browser.
 *
 * One caution taken deliberately: this layout awaits a network call, and in
 * Next 16 a layout that reads uncached data blocks navigation into every route
 * beneath it and does NOT fall back to a same-segment loading.js. So the call
 * has a 5-second ceiling and degrades to `null` — a slow or dead API must cost
 * the recruiter the mode chip, never the whole dashboard.
 */
export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const health = await getHealth();

  return (
    <RecruiterShell
      mode={
        health.ok
          ? {
              llm: health.data.llm_mode,
              whatsapp: health.data.whatsapp,
              model: health.data.model,
            }
          : null
      }
      devEnabled={process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS === "true"}
    >
      {children}
    </RecruiterShell>
  );
}
