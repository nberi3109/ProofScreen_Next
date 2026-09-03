import type { ReactNode } from "react";

import CandidateShell from "@/components/candidate/layout/CandidateShell";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return <CandidateShell>{children}</CandidateShell>;
}
