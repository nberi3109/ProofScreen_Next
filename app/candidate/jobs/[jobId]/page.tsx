import JobDetails from "@/app/jobs/[id]/page";
export default async function CandidateJobDetails({ params }: { params: Promise<{jobId:string}> }) { const {jobId}=await params; return <JobDetails params={Promise.resolve({id:jobId})}/>; }
