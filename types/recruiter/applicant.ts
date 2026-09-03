export type ApplicantStatus = "New" | "Shortlisted" | "Interview" | "Rejected";
export type Applicant = { id: string; candidateId: string; name: string; initials: string; score: number; applied: string; status: ApplicantStatus; topSkills: string[]; };
