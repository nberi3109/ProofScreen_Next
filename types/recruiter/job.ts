export type RecruiterJobStatus = "Published" | "Draft" | "Closed";
export type RecruiterJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  status: RecruiterJobStatus;
  applicants: number;
  qualified: number;
  posted: string;
  description: string;
  skills: string[];
};
