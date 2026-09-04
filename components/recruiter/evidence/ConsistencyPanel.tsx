import { ShieldAlert, ShieldCheck } from "lucide-react";

import type { ConsistencyReport } from "@/lib/api/types";

/**
 * Consistency is session-level, not per-claim — it only exists BETWEEN
 * answers. The multiplier is applied once to the weighted evidence score,
 * which is how one fabricated area lowers trust globally.
 *
 * Both numbers are shown because the gap is the finding: the recruiter sees
 * exactly what the multiplier cost this candidate, rather than a single score
 * with an invisible penalty baked in.
 */
export default function ConsistencyPanel({
  consistency,
  weighted,
  competence,
}: {
  consistency: ConsistencyReport;
  weighted: number;
  competence: number;
}) {
  const clean = consistency.contradictions.length === 0;
  const cost = weighted - competence;

  return (
    <section className={`recruiter-panel consistency-panel ${clean ? "" : "has-contradictions"}`}>
      <h2>
        {clean ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />} Consistency
      </h2>

      <div className="consistency-figures">
        <div>
          <b>{consistency.score}</b>
          <small>consistency score</small>
        </div>
        <div>
          <b>×{consistency.multiplier.toFixed(2)}</b>
          <small>applied to evidence</small>
        </div>
        <div>
          <b>{consistency.facts_tracked}</b>
          <small>facts tracked</small>
        </div>
      </div>

      <p className="consistency-arithmetic">
        Weighted evidence <b>{weighted}</b> × {consistency.multiplier.toFixed(2)} ={" "}
        competence <b>{competence}</b>
        {cost > 0 && <em> — consistency cost {cost} points</em>}
      </p>

      {consistency.note && <p className="consistency-note">{consistency.note}</p>}

      {clean ? (
        <p className="consistency-clean">
          No contradiction found between answers on any tracked fact.
        </p>
      ) : (
        <ul className="contradiction-list">
          {consistency.contradictions.map((item, index) => (
            <li
              className={`contradiction sev-${item.severity.toLowerCase()}`}
              key={`${item.fact_key}-${index}`}
            >
              <div className="contradiction-head">
                <b>{item.fact_label || item.fact_key}</b>
                <span>{item.severity}</span>
              </div>
              <p>
                said <b>{item.earlier_value}</b> earlier, then{" "}
                <b>{item.later_value}</b>
                {item.delta_pct !== null && ` — ${Math.round(item.delta_pct)}% apart`}
              </p>
              {item.note && <em>{item.note}</em>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
