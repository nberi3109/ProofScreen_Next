import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobForm from "@/components/recruiter/jobs/JobForm";
export default function NewJob() { return <main className="recruiter-page narrow-recruiter-page"><Link href="/recruiter/jobs" className="recruiter-back"><ArrowLeft size={15}/> Back to jobs</Link><div className="recruiter-heading compact-heading"><div><span className="eyebrow">NEW ROLE</span><h1>Create a job</h1><p>Tell candidates what success looks like in this role.</p></div></div><JobForm/></main> }
