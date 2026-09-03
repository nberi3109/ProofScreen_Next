"use client";
import { Bookmark } from "lucide-react";
import { useState } from "react";

export default function SaveButton({ initial = false }: { initial?: boolean }) {
  const [saved, setSaved] = useState(initial);
  return <button className={`icon-button ${saved ? "saved" : ""}`} onClick={() => setSaved(!saved)} aria-label={saved ? "Unsave job" : "Save job"} title={saved ? "Unsave job" : "Save job"}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /><span>{saved ? "Saved" : "Save"}</span></button>;
}
