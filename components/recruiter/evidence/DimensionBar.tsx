import { Quote } from "lucide-react";

import { DIMENSION_LABEL, DIMENSION_MEANING, scoreBand } from "@/lib/api/format";
import DimensionBasis from "./DimensionBasis";
import type { DimensionScore } from "@/lib/api/types";

/**
 * One dimension, with the counts the number came from and the quotes those
 * counts point at.
 *
 * The `basis` line is not decoration. It is the answer to the only question
 * that matters about an AI-produced score — "how do you know?" — and the
 * quotes underneath it are the verbatim spans the backend refused to score
 * without. Rendering the bar and hiding the basis would turn a defensible
 * number back into an opinion, so `basis` is always visible and quotes are one
 * click away in a plain <details> that needs no JavaScript.
 *
 * `probed: false` is shown as "not probed" rather than as a zero. A dimension
 * nobody asked about is not a dimension the candidate failed.
 */
export default function DimensionBar({ dim }: { dim: DimensionScore }) {
  const label = DIMENSION_LABEL[dim.dimension];

  if (!dim.probed) {
    return (
      <div className="dim-row dim-unprobed">
        <div className="dim-head">
          <span title={DIMENSION_MEANING[dim.dimension]}>{label}</span>
          <em>not probed</em>
        </div>
        <div className="dim-track">
          <i style={{ width: "0%" }} />
        </div>
        <p className="dim-basis">
          No question in this session targeted this dimension, so there is no
          evidence either way.
        </p>
      </div>
    );
  }

  return (
    <div className={`dim-row dim-${scoreBand(dim.score)}`}>
      <div className="dim-head">
        <span title={DIMENSION_MEANING[dim.dimension]}>{label}</span>
        <b>{dim.score}</b>
      </div>
      <div className="dim-track">
        <i style={{ width: `${dim.score}%` }} />
      </div>
      {dim.basis && <DimensionBasis basis={dim.basis} />}
      {dim.quotes.length > 0 && (
        <details className="dim-quotes">
          <summary>
            <Quote size={12} /> {dim.quotes.length}{" "}
            {dim.quotes.length === 1 ? "quote" : "quotes"} from the answers
          </summary>
          <ul>
            {dim.quotes.map((quote, index) => (
              <li key={`${index}-${quote.slice(0, 24)}`}>&ldquo;{quote}&rdquo;</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
