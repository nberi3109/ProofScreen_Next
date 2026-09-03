import type { ReactNode } from "react";

import RecruiterShell from "@/components/recruiter/layout/RecruiterShell";

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return <RecruiterShell>{children}</RecruiterShell>;
}
