import { redirect } from "next/navigation";

// The interview shows its result inline, then links back to the proof summary.
export default function ProofResult() {
  redirect("/candidate/proof");
}
