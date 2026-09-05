import { Compass } from "lucide-react";
import Link from "next/link";

import ApiNotice, { EmptyNotice } from "@/components/api/ApiNotice";
import OpeningsBrowser from "@/components/candidate/jobs/OpeningsBrowser";
import ProofScoreCard from "@/components/candidate/proof/ProofScoreCard";
import { getOpeningsForViewer, getViewer } from "@/lib/api/viewer";

/**
 * Discover — openings, and how much of each one this candidate covers.
 *
 * The greeting used to be "Good evening, Rahul" from mock data. It is now the
 * candidate's own name when there is a verification to read it from, and a
 * neutral heading when there is not: a job site that greets an anonymous
 * visitor by somebody else's name is the first thing a demo audience notices.
 */
export default async function CandidateHome({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: override } = await searchParams;
  const viewer = await getViewer(override, true);
  const openings = await getOpeningsForViewer(viewer);

  const name = viewer?.graph?.candidate.name ?? null;

  return (
    <main className="page">
      <div className="hero">
        <div>
          <h1>{name ? `Hello, ${name.split(" ")[0]}` : "Roles worth proving"}</h1>
          <p>
            {viewer
              ? "Openings, and how much of each your evidence already covers."
              : "Every opening here is decided on evidence, not on how the resume was written."}
          </p>
        </div>
      </div>

      <ProofScoreCard viewer={viewer} />

      <div className="section-title">
        <h2>
          <Compass size={17} /> Open roles
        </h2>
      </div>

      {!openings.ok ? (
        <ApiNotice error={openings.error} what="the open roles" />
      ) : openings.data.length === 0 ? (
        <EmptyNotice title="No openings yet.">
          <p>
            A recruiter has not created one. You can still{" "}
            <Link href="/candidate/start">get verified</Link> — your evidence is
            ranked under whichever lens they create later, with no
            re-interviewing.
          </p>
        </EmptyNotice>
      ) : (
        <OpeningsBrowser openings={openings.data} />
      )}
    </main>
  );
}
