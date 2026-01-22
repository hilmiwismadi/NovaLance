import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockJobs, getJobsByOwner, mockUser } from '@/lib/mockData';

export default function OwnerSection() {
  const postedJobs = getJobsByOwner(mockUser.address);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          As Project Owner
        </h2>
        <Link href="/create-job">
          <Button size="sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-300">{postedJobs.length}</p>
          <p className="text-sm text-white/60 mt-1">Posted Jobs</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-400">2</p>
          <p className="text-sm text-white/60 mt-1">Active Projects</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-400">$2,150</p>
          <p className="text-sm text-white/60 mt-1">Total Budget Locked</p>
        </Card>
      </div>

      {postedJobs.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Your Recent Jobs</h3>
          {postedJobs.slice(0, 2).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card hover className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{job.title}</h4>
                  <p className="text-sm text-white/60 mt-1">
                    ${job.budget} {job.currency} · {job.applicantCount} applicants
                  </p>
                </div>
                <svg className="w-5 h-5 text-white/40 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-white/60 mb-4">No jobs posted yet</p>
          <Link href="/create-job">
            <Button>Post Your First Job</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
