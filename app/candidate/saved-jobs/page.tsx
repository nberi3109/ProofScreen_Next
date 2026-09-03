import JobCard from "@/components/candidate/jobs/JobCard";
import { jobs } from "@/lib/data";

const savedJobs = jobs.slice(1, 4);

export default function SavedJobs() {
  return (
    <main className="page">
      <div className="hero">
        <div>
          <h1>Saved for later</h1>
          <p>Good opportunities worth another look.</p>
        </div>
      </div>

      <div className="jobs-grid">
        {savedJobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </div>
    </main>
  );
}
