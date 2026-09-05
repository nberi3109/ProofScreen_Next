"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Save an opening for later.
 *
 * ProofScreen has no "saved" table and adding one is a backend change nobody
 * asked for, so this keeps the list in `localStorage`. Being honest about what
 * that means: it is per-browser and per-device, it is not visible to a
 * recruiter, and clearing site data clears it. That is a real feature with
 * real limits, which beats a button that toggles a colour and forgets.
 *
 * Every read and write is wrapped, because `localStorage` throws outright in
 * some contexts (private windows with site data blocked, embedded previews)
 * rather than merely returning null.
 */
export const SAVED_KEY = "proofscreen.saved-openings";

export function readSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(ids: string[]): void {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the toggle still works for this render, it just
    // will not survive a reload. Silently degrading beats throwing here.
  }
}

export default function SaveButton({ openingId }: { openingId: string }) {
  // Starts false on the server and syncs after mount: localStorage does not
  // exist during SSR, and guessing would mean a hydration mismatch.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readSaved().includes(openingId));
  }, [openingId]);

  const toggle = () => {
    const next = saved
      ? readSaved().filter((id) => id !== openingId)
      : [...new Set([...readSaved(), openingId])];
    writeSaved(next);
    setSaved(!saved);
  };

  const label = saved ? "Remove from saved" : "Save for later";

  return (
    <button
      className={`icon-button ${saved ? "saved" : ""}`}
      onClick={toggle}
      aria-label={label}
      title={`${label} — kept in this browser only`}
    >
      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
