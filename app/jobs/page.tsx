'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import { mockJobs } from '@/lib/mockData';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Browse Jobs</h1>
          <p className="text-slate-600 mt-1">Find your next freelance opportunity</p>
        </div>
        <Link href="/create-job">
          <Button className="w-full sm:w-auto">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <JobFilters onFilterChange={() => {}} />

      {/* Job Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Button variant="outline" size="lg">
          Load More Jobs
        </Button>
      </div>
    </div>
  );
}
