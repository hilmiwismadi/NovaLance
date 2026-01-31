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
  status: number; // 0=Active, 1=Assigned, 2=Completed, 3=Cancelled
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
}

// Custom hook to fetch multiple projects
function usePOProjects(maxProjects: number = 20) {
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

        const userProjects: ContractProject[] = [];
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

          // Only include projects created by this user
          if (creator.toLowerCase() === address.toLowerCase()) {
            userProjects.push({
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
        }

        setProjects(userProjects);
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

export default function PODashboard() {
  const [mounted, setMounted] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [yieldExpanded, setYieldExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smart Contract Data
  const { count: projectCount } = usePLProjectCount();
  const { projects: userProjects, isLoading: isProjectsLoading } = usePOProjects(50);

  // Active projects (not cancelled or completed)
  const activeProjects = userProjects.filter(p =>
    p.status === 0 || p.status === 1 // Active or Assigned
  );

  // Calculate overall progress based on milestones
  const calculateProjectProgress = (project: ContractProject): number => {
    // For now, return 0 - milestones will be fetched on project detail page
    return 0;
  };

  // Calculate overall KPI progress across all active projects
  const totalMilestones = activeProjects.reduce((sum, p) =>
    sum + Number(p.milestoneCount), 0
  );
  const completedMilestones = 0; // Will be calculated from milestones data
  const overallProgress = totalMilestones > 0 ? 0 : 0;

  // Calculate yield totals from active projects
  const calculateYieldTotals = () => {
    let totalDeposited = BigInt(0);
    let totalLP = BigInt(0);
    let totalYield = BigInt(0);

    activeProjects.forEach(project => {
      totalDeposited += project.vaultAmount || BigInt(0);
      totalLP += project.lendingAmount || BigInt(0);
    });

    // Yield is calculated as the growth in lending amount
    const estimatedYield = (totalLP * BigInt(5)) / BigInt(100); // Assume 5% yield for demo
    totalYield = estimatedYield;

    return { totalDeposited, totalLP, totalYield };
  };

  const { totalDeposited, totalLP, totalYield } = calculateYieldTotals();

  if (!mounted) return null;

  if (isProjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Get status badge variant based on project status
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return 'default'; // Active (hiring)
      case 1: return 'warning'; // Assigned (in progress)
      case 2: return 'success'; // Completed
      case 3: return 'error'; // Cancelled
      default: return 'default';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Hiring';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of your active projects</p>
        </div>
        <Link href="/PO/create-project">
          <Button variant="primary" size="sm" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        </Link>
      </div>

      {/* Two Main Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KPI Progress Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">KPI Progress</h3>
                <p className="text-xs text-slate-500">Track team milestones</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-600">{overallProgress}%</p>
              <p className="text-xs text-slate-500">{completedMilestones}/{totalMilestones} completed</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </Card>

        {/* Yield Performance Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Yield Performance</h3>
                <p className="text-xs text-slate-500">Your deposits generating returns</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">
                {activeProjects.length}
              </p>
              <p className="text-xs text-slate-500">Active Projects</p>
            </div>
          </div>

          {/* Current Progress Summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-800">
                {formatCurrency(totalDeposited, 'IDRX')}
              </p>
              <p className="text-xs text-slate-600">Deposited</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-blue-700">
                {formatCurrency(totalLP, 'IDRX')}
              </p>
              <p className="text-xs text-blue-600">LP (10%)</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-emerald-700">
                {formatCurrency(totalYield, 'IDRX')}
              </p>
              <p className="text-xs text-emerald-600">Est. Yield</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Projects</h2>
          <Link href="/PO/projects" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {userProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6">Create your first project to start building your team</p>
            <Link href="/PO/create-project">
              <Button variant="primary">Create Your First Project</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProjects.slice(0, 6).map((project) => {
              const progress = calculateProjectProgress(project);
              const milestoneCount = Number(project.milestoneCount);

              return (
                <Link key={project.id.toString()} href={`/PO/projects/${project.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">Project #{project.id.toString()}</h3>
                      <Badge
                        variant={getStatusBadge(project.status)}
                        className="shrink-0 text-xs"
                      >
                        {getStatusText(project.status)}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">
                      {project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000'
                        ? `Freelancer: ${project.freelancer.slice(0, 6)}...${project.freelancer.slice(-4)}`
                        : 'Not assigned yet'
                      }
                    </p>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones info */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-brand-600">
                        {formatCurrency(project.totalDeposited, 'IDRX')} deposited
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
