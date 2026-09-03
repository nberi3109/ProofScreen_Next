import { jobs } from "@/lib/data";
import JobCard from "@/components/JobCard";
export default function Saved() { return <main className="page"><div className="hero"><div><h1>Saved for later</h1><p>Good opportunities worth another look.</p></div></div><div className="jobs-grid">{jobs.slice(1,4).map(job=><JobCard job={job} key={job.id}/>)}</div></main>; }
