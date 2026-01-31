'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import ExpandableFilter from '@/components/ui/ExpandableFilter';
import { useProjects } from '@/lib/api-hooks';
import { formatCurrency } from '@/lib/contract';

interface FilterState {
  searchTerm: string;
  selectedSkills: string[];
}

// Mapped project type for display
interface DisplayProject {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  currency: string;
  status: string;
  kpiCount: number;
  roles: Array<{
    status: string;
  }>;
  ownerAddress: string;
  ownerEns?: string;
  createdAt?: string;
}

// Map API Project to DisplayProject
function mapProjectToDisplay(project: any): DisplayProject {
  // Get all skills from all roles
  const allSkills = project.roles
    ?.flatMap((role: any) => {
      try {
        return role.skills ? JSON.parse(role.skills) : [];
      } catch {
        return role.skills || [];
      }
    })
    .filter((skill: string) => skill) || [];

  // Count total KPIs across all roles
  const kpiCount = project.roles
    ?.reduce((sum: number, role: any) => sum + (role.kpiCount || 0), 0) || 0;

  // Calculate budget from roles
  const budget = project.roles
    ?.reduce((sum: string, role: any) => {
      const roleBudget = BigInt(role.paymentPerKpi || 0) * BigInt(role.kpiCount || 0);
      return (BigInt(sum) + roleBudget).toString();
    }, '0') || '0';

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    skills: allSkills,
    budget: budget,
    currency: 'IDRX',
    status: project.status,
    kpiCount: kpiCount,
    roles: project.roles || [],
    ownerAddress: project.ownerAddress,
    ownerEns: project.owner?.ens,
    createdAt: project.createdAt,
  };
}

// Calculate job progress based on KPIs - memoized
function calculateJobProgress(job: DisplayProject): number {
  if (job.kpiCount === 0) return 0;
  // Count assigned roles as progress indicator
  const assignedRoles = job.roles.filter(r => r.status === 'assigned').length;
  return Math.round((assignedRoles / Math.max(job.roles.length, 1)) * 100);
}

// Memoized job card component
const JobCard = memo(({
  job,
  progress,
}: {
  job: DisplayProject;
  progress: number;
}) => {
  return (
    <Link href={`/FL/projects/${job.id}`} prefetch={false}>
      <Card className="p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
          <Badge
            variant={job.status === 'open' ? 'pending' : 'default'}
            className="shrink-0"
          >
            {job.status === 'open' ? 'Hiring' : job.status === 'in_progress' ? 'Active' : job.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {job.description}
        </p>

        {/* Progress - based on KPIs */}
        {job.kpiCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600">
                {job.kpiCount} KPI{job.kpiCount > 1 ? 's' : ''}
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

        {/* Budget & Owner */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              {job.roles.length} role{job.roles.length !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {job.ownerEns || job.ownerAddress.slice(0, 8)}
            </span>
          </div>
          <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
            <CurrencyDisplay amount={formatCurrency(BigInt(job.budget || '0'), job.currency)} currency={job.currency} />
          </span>
        </div>

        {job.createdAt && (
          <div className="mt-2 text-xs text-slate-500">
            Posted {new Date(job.createdAt).toLocaleDateString()}
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

  // API hook for projects
  const { data: projects, isLoading } = useProjects();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map projects to display format
  const displayProjects = useMemo(() => {
    return projects?.map(mapProjectToDisplay) || [];
  }, [projects]);

  // Memoized skills
  const allSkills = useMemo(() => {
    return Array.from(new Set(displayProjects.flatMap(job => job.skills))).sort();
  }, [displayProjects]);

  // Filter jobs based on search - memoized
  const filteredJobs = useMemo(() => {
    return displayProjects.filter(job => {
      const matchesSearch = filters.searchTerm === '' ||
        job.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const matchesSkills = filters.selectedSkills.length === 0 ||
        filters.selectedSkills.some(skill => job.skills.includes(skill));

      return matchesSearch && matchesSkills;
    });
  }, [displayProjects, filters]);

  // Memoized callback
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!mounted) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Browse Jobs</h1>
          <p className="text-slate-600 text-sm mt-0.5 sm:mt-1">
            Find your next opportunity
          </p>
        </div>
        <Card className="p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading jobs...</p>
        </Card>
      </div>
    );
  }

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
        totalCount={displayProjects.length}
      />

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-600 mb-6">
            {displayProjects.length === 0
              ? "There are no active projects yet. Switch to PO role to create one!"
              : "Try adjusting your search or filters"}
          </p>
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
