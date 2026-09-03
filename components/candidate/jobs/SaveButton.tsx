"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

export default function SaveButton({ initial = false }: { initial?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const label = saved ? "Unsave job" : "Save job";

  return (
    <button
      className={`icon-button ${saved ? "saved" : ""}`}
      onClick={() => setSaved(!saved)}
      aria-label={label}
      title={label}
    >
      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
