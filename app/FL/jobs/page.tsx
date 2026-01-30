'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import ExpandableFilter from '@/components/ui/ExpandableFilter';
import { mockJobs } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

interface FilterState {
  searchTerm: string;
  selectedSkills: string[];
}

// Calculate job progress based on milestones - memoized
function calculateJobProgress(job: typeof mockJobs[0]): number {
  if (!job.milestones || job.milestones.length === 0) return 0;
  const completedMilestones = job.milestones.filter(m => m.status === 'completed').length;
  return Math.round((completedMilestones / job.milestones.length) * 100);
}

// Memoized job card component
const JobCard = memo(({
  job,
  progress,
}: {
  job: typeof mockJobs[0];
  progress: number;
}) => {
  return (
    <Link href={`/FL/jobs/${job.id}`} prefetch={false}>
      <Card className="p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
          <Badge
            variant={job.status === 'hiring' ? 'pending' : 'default'}
            className="shrink-0"
          >
            {job.status === 'hiring' ? 'Hiring' : job.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {job.description}
        </p>

        {/* Timeline (Estimated Duration) */}
        {job.duration && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Estimated: {job.duration}</span>
          </div>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Progress */}
        {job.milestones && job.milestones.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600">
                {job.milestones.length} milestone{job.milestones.length > 1 ? 's' : ''}
              </span>
              <span className="font-medium text-slate-900">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Budget & Applicants */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {job.postedByEns || job.postedBy.slice(0, 8)}
            </span>
          </div>
          <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
            <CurrencyDisplay amount={formatCurrency(job.budget, job.currency)} currency={job.currency} />
          </span>
        </div>

        {job.createdAt && (
          <div className="mt-2 text-xs text-slate-500">
            Posted {job.createdAt}
          </div>
        )}
      </Card>
    </Link>
  );
});
JobCard.displayName = 'JobCard';

export default function FLJobsPage() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedSkills: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized skills
  const allSkills = useMemo(() => {
    return Array.from(new Set(mockJobs.flatMap(job => job.skills))).sort();
  }, []);

  // Filter jobs based on search and skills - memoized
  const filteredJobs = useMemo(() => {
    return mockJobs.filter(job => {
      const matchesSearch = filters.searchTerm === '' ||
        job.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesSkills = filters.selectedSkills.length === 0 ||
        filters.selectedSkills.some(skill => job.skills.includes(skill));

      return matchesSearch && matchesSkills;
    });
  }, [filters]);

  // Memoized callback
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header - No Post Job button for FL users */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Browse Jobs</h1>
          <p className="text-slate-600 text-sm mt-0.5 sm:mt-1 hidden sm:block">
            Find your next opportunity
          </p>
        </div>
      </div>

      {/* Expandable Filter Component */}
      <ExpandableFilter
        allSkills={allSkills}
        onFilterChange={handleFilterChange}
        resultCount={filteredJobs.length}
        totalCount={mockJobs.length}
      />

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={() => handleFilterChange({ searchTerm: '', selectedSkills: [] })}>
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} progress={calculateJobProgress(job)} />
          ))}
        </div>
      )}
    </div>
  );
}
