export default function MatchBadge({ score }: { score: number }) {
  return <div className="match-badge"><strong>{score}%</strong><span>Match</span></div>;
}
