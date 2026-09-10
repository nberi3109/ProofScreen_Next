import {
  DIMENSION_LABEL,
  DIMENSION_MEANING,
  scoreBand,
} from "@/lib/api/format";
import type { DimensionScore } from "@/lib/api/types";

/**
 * THE PROFILE, AS A SHAPE.
 *
 * The bars below this chart are the precise reading — six numbers you can
 * quote. This is the other half: the silhouette, which is what a recruiter
 * actually remembers and compares between two candidates. `graph.py` calls
 * this reading "the radar chart on the dashboard"; it just never had one.
 *
 * Four decisions worth defending:
 *
 *   1. THE AXES ARE FIXED BY DIMENSION ORDER, never by which ones were
 *      probed. Two candidates' charts are only comparable if Knowledge is at
 *      the same o'clock on both.
 *   2. AN UNPROBED DIMENSION IS NOT A ZERO. Plotting it at the centre would
 *      say the candidate failed a question nobody asked — the exact conflation
 *      this product refuses everywhere else. So the polygon spans the probed
 *      axes only, and an unprobed axis gets a dashed spoke and an italic label.
 *   3. ONE SERIES, SO NO LEGEND. The heading names it. Colour carries no
 *      identity here, only the band, which the bars repeat in text.
 *   4. LABELS ONLY ON THE EXTREMES. A number on all six points is noise when
 *      all six numbers are listed immediately underneath; the strongest and
 *      weakest axes are the finding.
 *
 * Server-rendered inline SVG — no charting library, no client JavaScript.
 * Hover text is a native SVG <title>.
 */

// The plot itself must be square — a radar in a non-square box misreports
// every angle. The BOX around it is wider than tall because the side labels
// ("Knowledge adaptability") are long and sit horizontally; sized so the
// widest of them lands inside the viewBox instead of painting outside it.
const VB_W = 560;
const VB_H = 344;
const CX = 280;
const CY = 168;
const R = 118;
const LABEL_R = R + 28;
const RINGS = [25, 50, 75, 100];

function point(index: number, count: number, value: number) {
  // -90deg so the first dimension sits at twelve o'clock.
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const radius = (Math.max(0, Math.min(100, value)) / 100) * R;
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle), angle };
}

export default function DimensionRadar({ dims }: { dims: DimensionScore[] }) {
  if (dims.length < 3) return null;

  const probed = dims.filter((d) => d.probed);
  // A polygon needs three vertices. Below that the bars carry it alone rather
  // than a shape drawn from one or two readings.
  if (probed.length < 3) return null;

  const hull = dims
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.probed)
    .map(({ d, i }) => point(i, dims.length, d.score));

  const best = probed.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = probed.reduce((a, b) => (b.score < a.score ? b : a));
  const unprobed = dims.filter((d) => !d.probed);
  const mean = Math.round(probed.reduce((n, d) => n + d.score, 0) / probed.length);

  return (
    <figure className="dim-radar-figure">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="dim-radar"
        role="img"
        aria-label={
          `Radar chart of ${probed.length} probed competence dimensions. ` +
          probed.map((d) => `${DIMENSION_LABEL[d.dimension]} ${d.score}`).join(", ") +
          (unprobed.length
            ? `. Not probed: ${unprobed.map((d) => DIMENSION_LABEL[d.dimension]).join(", ")}.`
            : ".")
        }
      >
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            className={ring === 100 ? "radar-ring radar-ring-edge" : "radar-ring"}
            points={dims
              .map((_, i) => {
                const p = point(i, dims.length, ring);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(" ")}
          />
        ))}

        {/* spokes: dashed where nothing was asked */}
        {dims.map((d, i) => {
          const edge = point(i, dims.length, 100);
          return (
            <line
              key={`spoke-${d.dimension}`}
              x1={CX}
              y1={CY}
              x2={edge.x}
              y2={edge.y}
              className={d.probed ? "radar-spoke" : "radar-spoke radar-spoke-unprobed"}
            />
          );
        })}

        <text x={CX - 7} y={CY - R + 11} className="radar-ring-label">
          100
        </text>
        <text x={CX - 7} y={CY - R / 2 + 11} className="radar-ring-label">
          50
        </text>

        <polygon
          className={`radar-area score-${scoreBand(mean)}`}
          points={hull.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        />

        {dims.map((d, i) => {
          if (!d.probed) return null;
          const p = point(i, dims.length, d.score);
          return (
            <g className="radar-vertex" key={`v-${d.dimension}`}>
              <title>{`${DIMENSION_LABEL[d.dimension]} — ${d.score} of 100. ${DIMENSION_MEANING[d.dimension]}`}</title>
              <circle cx={p.x} cy={p.y} r={4.5} />
            </g>
          );
        })}

        {dims.map((d, i) => {
          const p = point(i, dims.length, 100);
          const angle = p.angle;
          const lx = CX + LABEL_R * Math.cos(angle);
          const ly = CY + LABEL_R * Math.sin(angle);
          const cos = Math.cos(angle);
          const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
          const isExtreme =
            d.probed &&
            (d.dimension === best.dimension || d.dimension === worst.dimension);
          return (
            <g key={`l-${d.dimension}`}>
              <text
                x={lx}
                y={ly + 3}
                textAnchor={anchor}
                className={`radar-axis-label ${d.probed ? "" : "radar-axis-unprobed"}`}
              >
                {DIMENSION_LABEL[d.dimension]}
              </text>
              {/* Only the strongest and weakest carry a number — the rest are
                  listed in full immediately below the chart. */}
              {isExtreme && (
                <text
                  x={lx}
                  y={ly + 17}
                  textAnchor={anchor}
                  className={`radar-axis-value score-${scoreBand(d.score)}`}
                >
                  {d.score}
                </text>
              )}
              {!d.probed && (
                <text
                  x={lx}
                  y={ly + 16}
                  textAnchor={anchor}
                  className="radar-axis-note"
                >
                  not probed
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <figcaption className="dim-radar-caption">
        Strongest on <b>{DIMENSION_LABEL[best.dimension]}</b> ({best.score}),
        weakest on <b>{DIMENSION_LABEL[worst.dimension]}</b> ({worst.score}).
        {unprobed.length > 0 && (
          <>
            {" "}
            {unprobed.length} of {dims.length}{" "}
            {unprobed.length === 1 ? "dimension was" : "dimensions were"} never
            probed, so the shape covers the {probed.length} that were — an
            unasked question is not a failed one.
          </>
        )}
      </figcaption>
    </figure>
  );
}
