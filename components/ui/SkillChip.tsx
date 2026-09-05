import { Check, Circle, CircleDot } from "lucide-react";

import { evidenceLabel, type EvidenceState } from "@/lib/api/format";

const stateIcons = {
  verified: Check,
  resume: CircleDot,
  needs: Circle,
} as const;

/**
 * A claim type with its evidence state.
 *
 * The state is derived from what the API reports about the claim — probed and
 * scored, extracted but never probed, or probed and unscored — not from a
 * threshold on a number. See `claimEvidenceState` in lib/api/format.ts.
 */
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
