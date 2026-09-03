export type CandidateEvidence = "Verified" | "Resume evidence" | "Needs proof";
export type RecruiterCandidate = {
  id: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  score: number;
  experience: string;
  availability: string;
  shineVerified?: boolean;
  skills: { name: string; evidence: CandidateEvidence; score?: number }[];
  appliedJob?: string;
  status?: string;
};
