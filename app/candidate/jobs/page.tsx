import { redirect } from "next/navigation";

// The job list lives on the candidate home screen.
export default function CandidateJobs() {
  redirect("/candidate");
}
