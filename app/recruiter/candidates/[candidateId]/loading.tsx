/** The evidence graph is one uncached read of a fairly large payload; streaming
 *  the shell keeps the back link usable while it lands. */
export default function LoadingEvidence() {
  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">EVIDENCE GRAPH</span>
          <h1>Loading the evidence…</h1>
        </div>
      </div>
      <div className="skeleton-list">
        {[0, 1, 2].map((row) => (
          <div className="skeleton-row" key={row} />
        ))}
      </div>
    </main>
  );
}
