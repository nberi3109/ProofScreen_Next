import { Check, Circle, CircleDot } from "lucide-react";
import { EvidenceState, evidenceLabel } from "@/lib/data";

export default function SkillChip({ name, state = "resume" }: { name: string; state?: EvidenceState }) {
  const Icon = state === "verified" ? Check : state === "resume" ? CircleDot : Circle;
  return <span className={`skill-chip ${state}`}><Icon size={13} />{name}<small>{evidenceLabel[state]}</small></span>;
}
