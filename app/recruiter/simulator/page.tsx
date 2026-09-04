import { notFound } from "next/navigation";

import SimulatorForm from "@/components/dev/SimulatorForm";

/**
 * The whole pipeline in one call, for demos and for eyeballing the rubric.
 *
 * 404s unless PROOFSCREEN_ENABLE_DEV_ACTIONS is on, so a deployed frontend
 * does not carry a route that writes simulated candidates into a database
 * recruiters are reading from. The backend gates the same routes independently
 * with ENABLE_DEV_ENDPOINTS — two switches, because either one being on alone
 * should not be enough.
 */
export default function SimulatorPage() {
  if (process.env.PROOFSCREEN_ENABLE_DEV_ACTIONS !== "true") notFound();

  return (
    <main className="recruiter-page narrow-recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">DEVELOPER TOOL</span>
          <h1>Interview simulator</h1>
          <p>
            Drive the full pipeline — claims, questions, signals, scores —
            without a handset.
          </p>
        </div>
      </div>

      <SimulatorForm />
    </main>
  );
}
