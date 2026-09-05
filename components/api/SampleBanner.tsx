import { FlaskConical } from "lucide-react";

/**
 * Says, unmissably, that what is on screen did not come from a candidate.
 *
 * Not a subtle chip. This product's argument is that every recruiter-facing
 * number is arithmetic over counted, quoted evidence, and a sample score
 * indistinguishable from a real one would quietly falsify that — someone
 * would read a competence figure off a screen, repeat it in a meeting, and be
 * wrong. So the strip is full width, sits above the header, and stays there
 * for as long as fixture data is being served.
 *
 * It renders only when a read actually returned a fixture, not merely when
 * fixtures are enabled — so the moment the API comes up, it disappears on its
 * own with no configuration change.
 */
export default function SampleBanner({ reason }: { reason?: string }) {
  return (
    <div className="sample-banner" role="status">
      <FlaskConical size={15} />
      <p>
        <b>SAMPLE DATA</b> — the API is not reachable, so these are illustrative
        figures from <code>lib/api/fixtures.ts</code>. No candidate produced
        them. They disappear the moment the backend answers.
        {reason ? ` (${reason})` : ""}
      </p>
    </div>
  );
}
