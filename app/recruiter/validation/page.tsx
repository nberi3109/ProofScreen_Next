import { FlaskConical, Info } from "lucide-react";
import Link from "next/link";

import ApiNotice from "@/components/api/ApiNotice";
import {
  familyLabel,
  formatCorrelation,
  formatDateTime,
  formatPercent,
} from "@/lib/api/format";
import { getValidation } from "@/lib/api/recruiter";
import type { ValidationCohort } from "@/lib/api/types";

/**
 * M4 — does evidence outrank resume screening?
 *
 * This is the one screen in the product that can say Evident does not
 * work, which is exactly why it ships. It rank-correlates the competence score
 * against recorded human decisions, and prints the resume score's correlation
 * against the SAME decisions right next to it. If the resume column wins, the
 * product's central claim is false and this table says so.
 *
 * Below the sample-size floor, correlations are WITHHELD and rendered as
 * "withheld" rather than as a number or a dash-that-looks-like-zero. A
 * Spearman coefficient over four candidates looks like evidence and is not.
 * `minimum_n` is adjustable in the URL so a reviewer can inspect the
 * arithmetic on thin data deliberately — and because the response echoes the
 * floor it used, a correlation computed under a lowered one can never be
 * quoted as the real M4a.
 */
export default async function ValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ minimum_n?: string }>;
}) {
  const { minimum_n: raw } = await searchParams;
  const parsed = raw ? Number(raw) : undefined;
  const minimumN =
    parsed !== undefined && Number.isInteger(parsed) && parsed >= 1 && parsed <= 10_000
      ? parsed
      : undefined;

  const result = await getValidation(minimumN);

  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">VALIDATION</span>
          <h1>Evidence vs resume screening</h1>
          <p>
            Both scores, correlated against the same recorded human decisions.
          </p>
        </div>
      </div>

      {!result.ok ? (
        <ApiNotice error={result.error} what="the validation report" />
      ) : (
        <>
          <p className="lens-explainer">
            Generated {formatDateTime(result.data.generated_at)} · sample-size
            floor <b>{result.data.minimum_n}</b>
            {minimumN !== undefined && minimumN !== 30 && (
              <>
                {" "}
                (lowered from the default 30 —{" "}
                <Link href="/recruiter/validation">reset</Link>. A coefficient
                computed under a lowered floor is not M4a.)
              </>
            )}
          </p>

          <section className="recruiter-panel">
            <h2>Overall</h2>
            <CohortTable rows={[result.data.overall]} />
          </section>

          <section className="recruiter-panel">
            <h2>By job family</h2>
            {result.data.cohorts.length === 0 ? (
              <p className="panel-note">
                No cohort has a recorded decision yet.
              </p>
            ) : (
              <CohortTable rows={result.data.cohorts} />
            )}
          </section>

          <div className="method-note">
            <Info size={16} />
            <div>
              <b>How to read this</b>
              <p>
                <b>Correlation</b> is Spearman rank correlation between a score
                and the recruiter&apos;s decision, where decisions are ordered
                rejected → shortlisted → interviewed → offered → hired. The
                claim is supported when the competence column beats the resume
                column.
              </p>
              <p>
                <b>Precision@5</b> asks how many of the top five by each score
                the recruiter actually advanced.
              </p>
              <p>
                <b>Inversions caught</b> counts candidates in the top quartile
                by resume and the bottom quartile by evidence whom the recruiter
                rejected — the case Evident exists to find.
              </p>
              <p className="method-caveat">
                <FlaskConical size={13} /> The same{" "}
                <code>build_report()</code> produces this page and the terminal
                report, so a number on a screen and a number in a log cannot
                disagree.
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function CohortTable({ rows }: { rows: ValidationCohort[] }) {
  return (
    <div className="table-scroll">
      <table className="validation-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Decisions</th>
            <th>Competence r</th>
            <th>Resume r</th>
            <th>Competence P@5</th>
            <th>Resume P@5</th>
            <th>Inversions caught</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const beats =
              row.sufficient &&
              row.competence_correlation !== null &&
              row.resume_correlation !== null &&
              row.competence_correlation > row.resume_correlation;
            return (
              <tr key={row.job_family} className={row.sufficient ? "" : "insufficient"}>
                <td>
                  {familyLabel(row.job_family)}
                  {beats && <em className="beats">evidence ahead</em>}
                </td>
                <td>{row.n_decided}</td>
                <td className={beats ? "winning" : ""}>
                  {formatCorrelation(row.competence_correlation)}
                </td>
                <td>{formatCorrelation(row.resume_correlation)}</td>
                <td>{formatPercent(row.competence_precision_at_5)}</td>
                <td>{formatPercent(row.resume_precision_at_5)}</td>
                <td>{row.inversions_caught}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.some((row) => !row.sufficient) && (
        <p className="panel-note">
          Rows in grey are below the sample-size floor. Their correlations are
          withheld, not zero — the arithmetic is deliberately not performed.
        </p>
      )}
    </div>
  );
}
