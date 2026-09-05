import ApiNotice from "@/components/api/ApiNotice";
import SavedOpenings from "@/components/candidate/jobs/SavedOpenings";
import { getOpeningsForViewer, getViewer } from "@/lib/api/viewer";

/**
 * Saved roles.
 *
 * ProofScreen has no saved-jobs table, so the set of ids is kept in the
 * browser and the openings behind them are fetched live. The page says so
 * rather than implying a server-side bookmark list exists.
 */
export default async function SavedJobs({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: override } = await searchParams;
  const viewer = await getViewer(override);
  const openings = await getOpeningsForViewer(viewer);

  return (
    <main className="page">
      <div className="hero">
        <div>
          <h1>Saved for later</h1>
          <p>Roles worth another look.</p>
        </div>
      </div>

      {!openings.ok ? (
        <ApiNotice error={openings.error} what="your saved roles" />
      ) : (
        <SavedOpenings openings={openings.data} />
      )}
    </main>
  );
}
