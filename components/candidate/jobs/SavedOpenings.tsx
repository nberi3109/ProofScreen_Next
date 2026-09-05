"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import JobCard from "@/components/candidate/jobs/JobCard";
import { readSaved } from "@/components/candidate/jobs/SaveButton";
import type { CandidateOpening } from "@/lib/api/openings";

/**
 * The saved list, read from this browser's own storage.
 *
 * The openings themselves come from the server; only the set of saved ids is
 * local. So the cards show live coverage and live weights, and the page is
 * honest about the one part that is device-bound.
 *
 * `mounted` exists because localStorage does not run on the server: rendering
 * the saved list straight away would mean the server said "nothing saved" and
 * the browser disagreed a moment later, which React reports as a hydration
 * error.
 */
export default function SavedOpenings({
  openings,
}: {
  openings: CandidateOpening[];
}) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSavedIds(readSaved());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!mounted) {
    return (
      <div className="skeleton-list">
        <div className="skeleton-row" />
      </div>
    );
  }

  const saved = openings.filter((opening) => savedIds.includes(opening.role.id));

  if (saved.length === 0) {
    return (
      <div className="api-notice api-notice-empty">
        <div>
          <b>Nothing saved yet.</b>
          <p>
            Tap <Bookmark size={13} /> Save on a role and it appears here. The
            list lives in this browser only — it is not visible to recruiters
            and will not follow you to another device.
          </p>
          <Link href="/candidate" className="primary-button">
            Browse open roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="panel-note">
        {saved.length} saved in this browser. Coverage and weights below are
        live from the API.
      </p>
      <div className="jobs-grid">
        {saved.map((opening) => (
          <JobCard opening={opening} key={opening.role.id} />
        ))}
      </div>
    </>
  );
}
