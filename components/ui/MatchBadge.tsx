/**
 * The circular figure on a job card.
 *
 * `label` exists because this used to say "Match" over a number the mock data
 * made up. It now shows `role_coverage` — the backend's own measure of how
 * much of an opening's weighted claim types a candidate's resume even speaks
 * to — and calling that a "match" would overstate it. Coverage says the
 * candidate is in the conversation; the competence score says how well they
 * argued it.
 */
export default function MatchBadge({
  score,
  label = "Coverage",
}: {
  score: number | null;
  label?: string;
}) {
  if (score === null) {
    return (
      <div className="match-badge match-unknown">
        <strong>—</strong>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="match-badge">
      <strong>{score}%</strong>
      <span>{label}</span>
    </div>
  );
}
