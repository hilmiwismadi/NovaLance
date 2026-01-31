'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import { usePLProjectCount } from '@/lib/hooks';

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
  hasApplied?: boolean; // Whether user has applied (for Active projects)
}

// Custom hook to fetch projects where user is the freelancer
function useFLProjects(maxProjects: number = 50) {
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

        // Fetch all projects in parallel
        const projectPromises = [];
        for (let i = 0; i < maxProjects; i++) {
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

        // Check which projects the user has applied to (for Active projects where they're not yet hired)
        const applicationPromises = [];
        for (let i = 0; i < maxProjects; i++) {
          applicationPromises.push(
            publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'hasApplied',
              args: [BigInt(i), address]
            }).catch(() => false)
          );
        }

        const applicationResults = await Promise.all(applicationPromises);

        const freelancerProjects: ContractProject[] = [];
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
          const hasApplied = applicationResults[i] as boolean;

          const isHired = freelancer && freelancer.toLowerCase() === address.toLowerCase();

          // Include projects where:
          // 1. User is hired as freelancer (any status)
          // 2. Project is Active (status 0) AND user has applied but not yet hired
          if (isHired || (status === 0 && hasApplied && !isHired && creator.toLowerCase() !== address.toLowerCase())) {
            freelancerProjects.push({
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

        setProjects(freelancerProjects);
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

export default function FLDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get wallet address for contract calls
  const { address, chain } = useAccount();

  // ProjectLance contract hooks
  const { count: projectCount } = usePLProjectCount();
  const { projects: freelancerProjects, isLoading: isProjectsLoading } = useFLProjects(50);

  // Active projects (assigned and in progress - status 1)
  // Also show projects that are Active (status 0) if user has applied
  const activeProjects = freelancerProjects.filter(p =>
    p.status === 1 || p.status === 0 // Assigned or Active (applied)
  );

  // Display projects where user is hired as freelancer (regardless of status)
  // A project can be Active (0) but still have a hired freelancer
  const assignedProjects = freelancerProjects.filter(p =>
    p.freelancer && address && p.freelancer.toLowerCase() === address.toLowerCase()
  );
  const appliedProjects = freelancerProjects.filter(p =>
    p.hasApplied && (!p.freelancer || p.freelancer === '0x0000000000000000000000000000000000000000')
  );

  // Stats
  const stats = {
    activeJobs: assignedProjects.filter(p => p.status !== 2).length,  // Hired projects that aren't completed
    completedJobs: freelancerProjects.filter(p => p.status === 2).length,
    pendingApplications: appliedProjects.length, // Projects applied but not hired
  };

  if (!mounted) return null;

  if (isProjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Get status badge variant based on project status
  const getStatusBadge = (project: ContractProject) => {
    // If applied but not hired
    if (project.hasApplied && (!project.freelancer || project.freelancer === '0x0000000000000000000000000000000000000000')) {
      return 'warning'; // Applied
    }
    // If hired (freelancer assigned)
    if (project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000' && project.status === 0) {
      return 'info'; // Hired
    }
    switch (project.status) {
      case 0: return 'default'; // Active (hiring)
      case 2: return 'success'; // Completed
      case 3: return 'error'; // Cancelled
      default: return 'default';
    }
  };

  const getStatusText = (project: ContractProject) => {
    // If applied but not hired
    if (project.hasApplied && (!project.freelancer || project.freelancer === '0x0000000000000000000000000000000000000000')) {
      return 'Applied';
    }
    // If hired (freelancer assigned)
    if (project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000' && project.status === 0) {
      return 'Hired';
    }
    switch (project.status) {
      case 0: return 'Active';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const toggleActivity = () => {
    setActivityExpanded(prev => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of your active jobs and applications
          </p>
        </div>
        <Link href="/FL/projects" prefetch={false}>
          <Button variant="primary" size="sm" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Main Cards - Job Activity & Earnings Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Job Activity Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Job Activity</h3>
                <p className="text-xs text-slate-500">Track your progress</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-600">{stats.activeJobs + stats.completedJobs}</p>
              <p className="text-xs text-slate-500">{stats.activeJobs} active, {stats.completedJobs} completed</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all"
                style={{ width: `${stats.activeJobs + stats.completedJobs > 0 ? ((stats.completedJobs) / (stats.activeJobs + stats.completedJobs)) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Earnings Overview Card */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Your Projects</h3>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-slate-600">Active Jobs</p>
              <p className="text-[10px] font-bold text-slate-900">{stats.activeJobs}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-emerald-600">Completed</p>
              <p className="text-[10px] font-bold text-emerald-700">{stats.completedJobs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Active Jobs</h2>
          <Link href="/FL/projects" prefetch={false} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Browse More Jobs →
          </Link>
        </div>

        {assignedProjects.length === 0 && appliedProjects.length === 0 ? (
          <Card className="p-12 text-center border-2 border-transparent">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs yet</h3>
            <p className="text-slate-600 mb-6">Browse available jobs and submit your applications</p>
            <Link href="/FL/projects" prefetch={false}>
              <Button variant="primary">Browse Projects</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...assignedProjects, ...appliedProjects].map((project) => {
              const milestoneCount = Number(project.milestoneCount);
              const isAppliedOnly = project.hasApplied && (!project.freelancer || project.freelancer === '0x0000000000000000000000000000000000000000');

              return (
                <Link key={project.id.toString()} href={`/FL/projects/${project.id}`}>
                  <Card className="p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer h-full border-2 border-transparent">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Project #{project.id.toString()}</h3>
                      <Badge
                        variant={getStatusBadge(project) as any}
                      >
                        {getStatusText(project)}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      {isAppliedOnly
                        ? `Applied - awaiting approval from ${project.creator.slice(0, 6)}...${project.creator.slice(-4)}`
                        : `Project Owner: ${project.creator.slice(0, 6)}...${project.creator.slice(-4)}`
                      }
                    </p>

                    {/* Milestones Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Milestones</span>
                        <span className="font-medium text-slate-900">
                          {milestoneCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.status === 2 ? 100 : isAppliedOnly ? 0 : 50}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-sm text-slate-600">
                        Budget: <span className="font-semibold text-brand-600">
                          <CurrencyDisplay amount={formatCurrency(BigInt(project.totalDeposited), 'IDRX')} currency="IDRX" />
                        </span>
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
