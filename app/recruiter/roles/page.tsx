import { redirect } from "next/navigation";

/**
 * Folded into the openings screen.
 *
 * A role lens and a job opening turned out to be the same object viewed twice,
 * and two screens for one concept is how a dashboard starts disagreeing with
 * itself. `/recruiter/jobs` lists them with live applicant counts;
 * `/recruiter/jobs/new` creates them. This path stays only so existing links
 * and bookmarks keep working.
 */
export default function RolesRedirect() {
  redirect("/recruiter/jobs");
}
