import { redirect } from "next/navigation";

// Individual applications are not detailed yet; show the list instead.
export default function CandidateApplicationDetails() {
  redirect("/candidate/applications");
}
