export type EvidenceState = "verified" | "resume" | "needs";

export type SkillEvidence = {
  name: string;
  state: EvidenceState;
  note?: string;
  score?: number;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  logoColor: string;
  location: string;
  salary: string;
  experience: string;
  matchScore: number;
  requiredSkills: string[];
  candidateEvidence: string[];
  missingProof: string[];
  description: string;
  type: string;
  posted: string;
};

export const jobs: Job[] = [
  {
    id: "frontend",
    title: "Frontend Developer",
    company: "TechNova",
    logo: "T",
    logoColor: "#3724d5",
    location: "Bengaluru",
    salary: "₹8–12 LPA",
    experience: "3–5 years",
    matchScore: 92,
    requiredSkills: ["React", "JavaScript", "TypeScript"],
    candidateEvidence: [
      "React experience",
      "Similar project experience",
      "3 relevant skills",
    ],
    missingProof: ["System Design"],
    description:
      "Build thoughtful, accessible product experiences with a collaborative design and engineering team.",
    type: "Full-time",
    posted: "Posted 2 hours ago",
  },
  {
    id: "support",
    title: "Senior Customer Support Executive",
    company: "Acme Services",
    logo: "A",
    logoColor: "#ef6b4a",
    location: "Gurgaon",
    salary: "₹6–8 LPA",
    experience: "2–4 years",
    matchScore: 89,
    requiredSkills: ["Customer Handling", "CRM", "Conflict Resolution"],
    candidateEvidence: [
      "3 yrs customer handling",
      "CRM experience",
      "Communication skills",
    ],
    missingProof: ["Conflict resolution"],
    description:
      "Help customers succeed through thoughtful support, clear communication, and fast problem solving.",
    type: "Full-time",
    posted: "Posted yesterday",
  },
  {
    id: "relationship",
    title: "Relationship Manager",
    company: "FinEdge Bank",
    logo: "F",
    logoColor: "#147d6b",
    location: "Mumbai",
    salary: "₹6–9 LPA",
    experience: "2–5 years",
    matchScore: 84,
    requiredSkills: ["Sales", "Customer Handling", "Banking"],
    candidateEvidence: [
      "Client relationship experience",
      "Strong communication",
      "Finance interest",
    ],
    missingProof: ["Banking products"],
    description:
      "Build lasting relationships with customers and guide them toward smarter financial decisions.",
    type: "Full-time",
    posted: "Posted 3 days ago",
  },
  {
    id: "growth",
    title: "Business Development Executive",
    company: "GrowthHub",
    logo: "G",
    logoColor: "#d14c85",
    location: "Delhi NCR",
    salary: "₹5–8 LPA",
    experience: "1–3 years",
    matchScore: 81,
    requiredSkills: ["Lead Generation", "Communication", "Negotiation"],
    candidateEvidence: ["Sales experience", "Clear communicator"],
    missingProof: ["Negotiation"],
    description:
      "Own the first conversation with future customers and help a growing team expand its reach.",
    type: "Full-time",
    posted: "Posted 4 days ago",
  },
  {
    id: "data",
    title: "Data Analyst",
    company: "Amazonia",
    logo: "A",
    logoColor: "#171717",
    location: "Hyderabad",
    salary: "₹7–11 LPA",
    experience: "2–4 years",
    matchScore: 78,
    requiredSkills: ["SQL", "Excel", "Power BI"],
    candidateEvidence: ["Data projects", "Analytical thinking"],
    missingProof: ["SQL"],
    description:
      "Turn business questions into clear insights for teams making decisions at scale.",
    type: "Full-time",
    posted: "Posted 1 week ago",
  },
  {
    id: "operations",
    title: "Branch Operations Executive",
    company: "FinEdge Bank",
    logo: "F",
    logoColor: "#147d6b",
    location: "Pune",
    salary: "₹4–7 LPA",
    experience: "1–3 years",
    matchScore: 76,
    requiredSkills: ["Operations", "Customer Handling", "Compliance"],
    candidateEvidence: ["Process ownership"],
    missingProof: ["Compliance"],
    description:
      "Keep branch operations smooth, accurate, and welcoming for every customer.",
    type: "Full-time",
    posted: "Posted 1 week ago",
  },
];

export const allSkills: SkillEvidence[] = [
  { name: "React", state: "verified", score: 92 },
  { name: "Communication", state: "verified", score: 87 },
  { name: "Problem Solving", state: "verified", score: 84 },
  { name: "Customer Handling", state: "verified", score: 81 },
  { name: "JavaScript", state: "resume" },
  { name: "TypeScript", state: "resume" },
  { name: "Conflict Resolution", state: "needs" },
  { name: "Negotiation", state: "needs" },
];

export const evidenceLabel: Record<EvidenceState, string> = {
  verified: "Verified",
  resume: "Resume evidence",
  needs: "Needs proof",
};
