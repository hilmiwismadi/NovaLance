'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import { usePLProjectCount } from '@/lib/hooks';

// Project data interface for contract data
interface ContractProject {
  id: bigint;
  creator: string;
  freelancer: string;
  status: number; // 0=Active, 1=Assigned, 2=Completed, 3=Cancelled
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
}

// Custom hook to fetch all projects from contract
function useAllProjects(maxProjects: number = 50) {
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

        const allProjects: ContractProject[] = [];
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

          allProjects.push({
            id: BigInt(i),
            creator,
            freelancer,
            status,
            totalDeposited,
            vaultAmount,
            lendingAmount,
            milestoneCount,
          });
        }

        setProjects(allProjects);
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

type FilterType = 'all' | 'hiring' | 'in-progress' | 'completed';

// Get status badge variant
function getStatusBadge(status: number): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 0: return 'default'; // Active (hiring)
    case 1: return 'warning'; // Assigned (in progress)
    case 2: return 'success'; // Completed
    case 3: return 'error'; // Cancelled
    default: return 'default';
  }
}

// Get status text
function getStatusText(status: number): string {
  switch (status) {
    case 0: return 'Hiring';
    case 1: return 'In Progress';
    case 2: return 'Completed';
    case 3: return 'Cancelled';
    default: return 'Unknown';
  }
}

export default function FLProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { address } = useAccount();
  const { projects: allProjects, isLoading } = useAllProjects(50);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter projects based on status
  const filteredProjects = allProjects.filter(project => {
    if (filter === 'all') return project.status !== 3; // Exclude cancelled
    if (filter === 'hiring') return project.status === 0;
    if (filter === 'in-progress') return project.status === 1;
    if (filter === 'completed') return project.status === 2;
    return true;
  });

  const stats = {
    all: allProjects.filter(p => p.status !== 3).length,
    hiring: allProjects.filter(p => p.status === 0).length,
    inProgress: allProjects.filter(p => p.status === 1).length,
    completed: allProjects.filter(p => p.status === 2).length,
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Overview Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-brand-50/50 border-brand-200/40 shadow-sm">
        <div className="mb-3 sm:mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Available Projects
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {stats.all} Project{stats.all !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-slate-100 text-slate-700 shadow-sm ring-2 ring-offset-1 ring-slate-300'
                : 'bg-white/80 backdrop-blur text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200/60'
            }`}
          >
            All ({stats.all})
          </button>
          <button
            onClick={() => setFilter('hiring')}
            className={`px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'hiring'
                ? 'bg-brand-100 text-brand-700 shadow-sm ring-2 ring-offset-1 ring-brand-300'
                : 'bg-white/80 backdrop-blur text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200/60'
            }`}
          >
            Hiring ({stats.hiring})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'in-progress'
                ? 'bg-warning-100 text-warning-700 shadow-sm ring-2 ring-offset-1 ring-warning-300'
                : 'bg-white/80 backdrop-blur text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200/60'
            }`}
          >
            Active ({stats.inProgress})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'completed'
                ? 'bg-emerald-100 text-emerald-700 shadow-sm ring-2 ring-offset-1 ring-emerald-300'
                : 'bg-white/80 backdrop-blur text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200/60'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50/50 to-white">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
            {filter === 'all' ? "There are no projects yet. Switch to PO role to create one!" : `No ${filter} projects`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredProjects.map((project) => {
            const totalBudget = Number(project.totalDeposited) / 1e6;
            const isFreelancer = project.freelancer && address?.toLowerCase() === project.freelancer.toLowerCase();
            const canApply = !project.freelancer || project.freelancer === '0x0000000000000000000000000000000000000000';

            return (
              <Link key={project.id.toString()} href={`/FL/projects/${project.id}`}>
                <Card className="p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-base sm:text-lg">Project #{project.id.toString()}</h3>
                      <p className="text-xs text-slate-500">
                        {canApply ? 'Open for applications' : isFreelancer ? 'You are hired!' : 'Position filled'}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(project.status)} className="shrink-0">
                      {getStatusText(project.status)}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600">Milestones</span>
                      <span className="font-medium text-slate-900">{project.milestoneCount.toString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                    <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                      <CurrencyDisplay amount={formatCurrency(Number(project.totalDeposited), 'IDRX')} currency="IDRX" />
                    </span>
                    <span className="text-slate-600">
                      {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
