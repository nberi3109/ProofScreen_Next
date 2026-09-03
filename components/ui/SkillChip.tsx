import { Check, Circle, CircleDot } from "lucide-react";

import { evidenceLabel, type EvidenceState } from "@/lib/data";

const stateIcons = {
  verified: Check,
  resume: CircleDot,
  needs: Circle,
} as const;

export default function SkillChip({
  name,
  state = "resume",
}: {
  name: string;
  state?: EvidenceState;
}) {
  const Icon = stateIcons[state];

  return (
    <span className={`skill-chip ${state}`}>
      <Icon size={13} />
      {name}
      <small>{evidenceLabel[state]}</small>
    </span>
  );
}
