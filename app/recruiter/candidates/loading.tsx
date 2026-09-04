/** Streamed while the ranking loads. `fetch` is uncached in Next 16 and blocks
 *  rendering, so without this the whole route waits on the API. */
export default function LoadingCandidates() {
  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">EVIDENCE RANKING</span>
          <h1>Candidates</h1>
          <p>Loading the ranking…</p>
        </div>
      </div>
      <div className="skeleton-list">
        {[0, 1, 2, 3, 4].map((row) => (
          <div className="skeleton-row" key={row} />
        ))}
      </div>
    </main>
  );
}
