import Link from "next/link";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { jobs } from "@/lib/data";
import MatchBadge from "@/components/MatchBadge";
import SaveButton from "@/components/SaveButton";
import ApplyButton from "@/components/ApplyButton";
import JobMatchReasons from "@/components/JobMatchReasons";

export default async function JobDetails({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const job = jobs.find(item => item.id === id) ?? jobs[0]; return <main className="page detail-layout"><Link className="back-link" href="/"><ArrowLeft size={15} /> Back to jobs</Link><section className="detail-head"><div className="company-mark" style={{background:job.logoColor}}>{job.logo}</div><h1>{job.title}</h1><div className="eyebrow">{job.company} · {job.location} · {job.type}</div><div className="salary-line">{job.salary} <span>·</span> {job.experience}</div><div className="detail-score"><MatchBadge score={job.matchScore} /><span>Strong fit based on your resume, experience, and existing proof.</span></div></section><div className="section-title"><h2>Why you match</h2><span className="mini-label" style={{color:"#716d82"}}>EVIDENCE CHECK</span></div><JobMatchReasons strengths={job.candidateEvidence} missing={job.missingProof} /><div className="section-title"><h2>What this job needs</h2></div><div className="skill-row" style={{overflow:"visible",flexWrap:"wrap"}}>{job.requiredSkills.map(skill => <span className="skill-chip verified" key={skill}><Check size={13}/>{skill}</span>)}</div><p style={{color:"#716d82",font:"13px Arial,sans-serif",lineHeight:1.6,marginTop:24}}>{job.description}</p><div className="sticky-actions"><SaveButton /><ApplyButton jobId={job.id} /></div></main>; }
