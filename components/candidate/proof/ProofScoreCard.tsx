import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ProofScoreCard() {
  return (
    <section className="proof-card">
      <div className="proof-card-copy">
        <span className="mini-label">
          <Sparkles size={13} /> YOUR PROOF STATUS
        </span>
        <div className="score-line">
          <strong>78</strong>
          <span>/100</span>
        </div>
        <p>Good foundation. 3 skills verified.</p>
        <Link href="/candidate/proof" className="light-button">
          Improve proof <ArrowRight size={15} />
        </Link>
      </div>
      <div className="score-ring" aria-label="Proof score 78 out of 100">
        <span>78</span>
      </div>
    </section>
  );
}
