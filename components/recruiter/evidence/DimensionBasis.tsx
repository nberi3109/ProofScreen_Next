/**
 * The `basis` string, rendered so it stays readable in both shapes the backend
 * produces.
 *
 * The scoring engine builds `basis` by joining bullet lines with newlines
 * ("• Explained concept: queue theory\n• Defined metric: CSAT (post-call
 * survey average)"). Dropped into a <p>, HTML collapses those newlines and the
 * whole thing becomes one run-on line — which is exactly how the most
 * important sentence on the page ("how do you know?") turns into noise.
 *
 * So: bullet-shaped input becomes a real list with a hanging indent, which is
 * what makes a wrapped line legible at 360px. Anything else is left as the
 * single paragraph it already was, because a summary line is not a list and
 * should not grow a bullet.
 */
export default function DimensionBasis({
  basis,
  className = "dim-basis",
}: {
  basis: string;
  className?: string;
}) {
  const lines = basis
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulleted = lines.length > 1 && lines.every((line) => line.startsWith("•"));

  if (!bulleted) {
    return className ? <p className={className}>{basis}</p> : <p>{basis}</p>;
  }

  return (
    <ul className={["basis-list", className].filter(Boolean).join(" ")}>
      {lines.map((line, index) => (
        <li key={`${index}-${line.slice(0, 24)}`}>{line.replace(/^•\s*/, "")}</li>
      ))}
    </ul>
  );
}
