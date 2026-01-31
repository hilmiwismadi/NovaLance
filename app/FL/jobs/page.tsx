'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import ExpandableFilter from '@/components/ui/ExpandableFilter';
import { formatCurrency } from '@/lib/contract';

// Project data interface for contract data
interface ContractProject {
  id: bigint;
  creator: string;
  freelancer: string;
  status: number; // 0=Active, 2=Completed, 3=Cancelled (Assigned status is never set by contract)
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
  hasApplied: boolean; // Whether current user has applied
}

interface FilterState {
  searchTerm: string;
  selectedSkills: string[];
}

// Custom hook to fetch all active projects from contract
function useActiveProjects(maxProjects: number = 50) {
  const { address, chain } = useAccount();
  const [projects, setProjects] = useState<ContractProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !chain) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { getContractAddresses } = await import('@/lib/contract-adapter');
        const { PROJECTLANCE_ABI } = await import('@/lib/abi');
        const { createPublicClient, http } = await import('viem');

        const publicClient = createPublicClient({
          chain: chain,
          transport: http()
        });

        const addresses = getContractAddresses(chain.id);
        const projectLanceAddress = addresses.projectLance;

        // Get total project count first
        const countResult = await publicClient.readContract({
          address: projectLanceAddress as `0x${string}`,
          abi: PROJECTLANCE_ABI,
          functionName: 'projectCount',
        }) as bigint;

        const totalProjects = Number(countResult);
        const limit = Math.min(totalProjects, maxProjects);

        // Fetch all projects in parallel
        const projectPromises = [];
        for (let i = 0; i < limit; i++) {
          projectPromises.push(
            publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'getProject',
              args: [BigInt(i)]
            }).catch(() => null)
          );
        }

        const results = await Promise.all(projectPromises);

        // Also check which projects the user has applied to
        const applicantPromises = [];
        for (let i = 0; i < limit; i++) {
          applicantPromises.push(
            publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'hasApplied',
              args: [BigInt(i), address]
            }).catch(() => false)
          );
        }

        const applicantResults = await Promise.all(applicantPromises);

        const activeProjects: ContractProject[] = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i] as any[] | null;
          if (!result) continue;

          const creator = result[0] as string;
          const freelancer = result[1] as string;
          const status = result[2] as number;
          const totalDeposited = result[3] as bigint;
          const vaultAmount = result[4] as bigint;
          const lendingAmount = result[5] as bigint;
          const milestoneCount = result[6] as bigint;
          const hasApplied = applicantResults[i] as boolean;

          // Only include Active projects (status 0) - these are "hiring"
          // Also exclude projects where user is the creator
          // Include projects where user has applied (to show application status)
          if (status === 0 && creator.toLowerCase() !== address.toLowerCase()) {
            activeProjects.push({
              id: BigInt(i),
              creator,
              freelancer,
              status,
              totalDeposited,
              vaultAmount,
              lendingAmount,
              milestoneCount,
              hasApplied,
            });
          }
        }

        setProjects(activeProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [address, chain, maxProjects]);

  return { projects, isLoading };
}

// Get status badge variant
function getStatusBadge(status: number): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 0: return 'default'; // Active
    case 2: return 'success'; // Completed
    case 3: return 'error'; // Cancelled
    default: return 'default';
  }
}

// Get status text
function getStatusText(status: number): string {
  switch (status) {
    case 0: return 'Active';
    case 2: return 'Completed';
    case 3: return 'Cancelled';
    default: return 'Unknown';
  }
}

// Memoized job card component
const JobCard = memo(({
  project,
}: {
  project: ContractProject;
}) => {
  const totalBudget = Number(project.totalDeposited) / 1e18;
  const canApply = !project.freelancer || project.freelancer === '0x0000000000000000000000000000000000000000';

  return (
    <Link href={`/FL/projects/${project.id}`} prefetch={false}>
      <Card className="p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-lg">Project #{project.id.toString()}</h3>
          <div className="flex items-center gap-2">
            {project.hasApplied && (
              <Badge variant="warning" className="text-xs">Applied</Badge>
            )}
            <Badge variant={getStatusBadge(project.status)} className="shrink-0">
              {getStatusText(project.status)}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {project.hasApplied
            ? 'You have applied to this project'
            : canApply
              ? 'Open for applications'
              : 'Position filled'}
        </p>

        {/* Milestones */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600">
              {project.milestoneCount} milestone{project.milestoneCount > 1n ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Budget & Creator */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
            </span>
          </div>
          <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
            <CurrencyDisplay amount={formatCurrency(project.totalDeposited, 'IDRX')} currency="IDRX" />
          </span>
        </div>
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

  const { projects: activeProjects, isLoading } = useActiveProjects(50);

  useEffect(() => {
    setMounted(true);
  }, []);

  // For now, use empty skills array since contract doesn't have skills
  const allSkills = useMemo(() => {
    return ['React', 'TypeScript', 'Solidity', 'Node.js', 'Python', 'Design'];
  }, []);

  // Filter jobs based on search - memoized
  const filteredJobs = useMemo(() => {
    return activeProjects.filter(job => {
      const matchesSearch = filters.searchTerm === '' ||
        job.id.toString().includes(filters.searchTerm) ||
        job.creator.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [activeProjects, filters]);

  // Memoized callback
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
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
        totalCount={activeProjects.length}
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
            {activeProjects.length === 0
              ? "There are no active projects yet. Switch to PO role to create one!"
              : "Try adjusting your search or filters"}
          </p>
          <Button variant="outline" onClick={() => handleFilterChange({ searchTerm: '', selectedSkills: [] })}>
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((project) => (
            <JobCard key={project.id.toString()} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
