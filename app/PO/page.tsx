'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import {
  usePLProjectCount,
  usePLProject,
  usePLYield,
  usePLAllMilestones,
  usePLVaultBalance,
  usePLLendingBalance,
} from '@/lib/hooks';

// Track expansion state for each project
interface ExpansionState {
  [key: string]: boolean;
}

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
  milestones?: any[];
}

export default function PODashboard() {
  const [mounted, setMounted] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [yieldExpanded, setYieldExpanded] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<ExpansionState>({});
  const [expandedYieldProjects, setExpandedYieldProjects] = useState<ExpansionState>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, chain } = useAccount();

  // Smart Contract Data
  const { count: projectCount, isLoading: isProjectCountLoading } = usePLProjectCount();

  // Fetch all projects from contract
  // Since there's no getProjectsByCreator function, we iterate through all projects
  const userProjects = useMemo(() => {
    if (!projectCount || !address) return [];
    const projects: ContractProject[] = [];
    const count = Number(projectCount);

    // We'll fetch project details for each ID to check if user is the creator
    // For now, return empty array - actual fetching will be done with individual hooks
    return [];
  }, [projectCount, address]);

  // State to hold loaded project details
  const [loadedProjects, setLoadedProjects] = useState<ContractProject[]>([]);

  // Load project details for all projects
  useEffect(() => {
    if (!projectCount || !address) return;

    const loadProjects = async () => {
      const count = Number(projectCount);
      const projects: ContractProject[] = [];

      // We need to use the contract read function directly
      // For now, we'll load a fixed number of projects for demo purposes
      for (let i = 0; i < Math.min(count, 10); i++) {
        const projectId = BigInt(i);
        // Note: In production, we would use publicClient.readContract here
        // For now, we'll skip this and let the user create projects first
      }

      setLoadedProjects(projects);
    };

    loadProjects();
  }, [projectCount, address]);

  // Filter projects by current user as creator
  const ownerProjects = loadedProjects.filter(p =>
    p.creator.toLowerCase() === address?.toLowerCase()
  );

  // Active projects (not cancelled or completed)
  const activeProjects = ownerProjects.filter(p =>
    p.status === 0 || p.status === 1 // Active or Assigned
  );

  // Calculate overall progress based on milestones
  const calculateProjectProgress = (project: ContractProject): number => {
    if (!project.milestones || project.milestones.length === 0) return 0;

    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter((m: any) => m.released || m.accepted).length;

    return Math.round((completedMilestones / totalMilestones) * 100);
  };

  // Calculate overall KPI progress across all active projects
  const totalMilestones = activeProjects.reduce((sum, p) =>
    sum + (p.milestones?.length || Number(p.milestoneCount)), 0
  );
  const completedMilestones = activeProjects.reduce((sum, p) =>
    sum + (p.milestones?.filter((m: any) => m.released || m.accepted).length || 0), 0
  );
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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
    // Since we can't track the exact principal per project in this view,
    // we'll estimate yield as a percentage of the lending amount
    const estimatedYield = (totalLP * BigInt(5)) / BigInt(100); // Assume 5% yield for demo
    totalYield = estimatedYield;

    return { totalDeposited, totalLP, totalYield };
  };

  const { totalDeposited, totalLP, totalYield } = calculateYieldTotals();

  if (!mounted) return null;

  // Helper functions for yield display
  const getYieldColor = (rate: number): string => {
    if (rate < 0) return 'text-red-600';
    if (rate < 5) return 'text-slate-600';
    if (rate < 10) return 'text-emerald-600';
    return 'text-emerald-700';
  };

  const getYieldBgColor = (rate: number): string => {
    if (rate < 0) return 'bg-red-50';
    if (rate < 5) return 'bg-slate-50';
    if (rate < 10) return 'bg-emerald-50';
    return 'bg-emerald-100';
  };

  const formatYieldRate = (rate: number): string => {
    return rate.toFixed(2);
  };

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

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleYieldProject = (projectId: string) => {
    setExpandedYieldProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
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
        <Card
          className={`p-5 cursor-pointer hover:shadow-lg transition-all ${kpiExpanded ? 'ring-2 ring-brand-500' : ''}`}
          onClick={() => setKpiExpanded(!kpiExpanded)}
        >
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

          {/* Expanded Content - Project → Milestones */}
          {kpiExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {activeProjects.map((project) => {
                const projectProgress = calculateProjectProgress(project);
                const isProjectExpanded = expandedProjects[project.id.toString()];
                const projectMilestones = project.milestones || [];
                const completedMilestones = projectMilestones.filter((m: any) => m.released || m.accepted).length;

                return (
                  <div key={project.id.toString()} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleProject(project.id.toString())}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform ${isProjectExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-slate-900">Project #{project.id.toString()}</span>
                        <Badge variant={getStatusBadge(project.status)} className="text-xs">
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-brand-600">{projectProgress}%</span>
                    </div>

                    {/* Milestones */}
                    {isProjectExpanded && (
                      <div className="p-3 space-y-2">
                        {projectMilestones.map((milestone: any, index: number) => {
                          const isCompleted = milestone.released;
                          const isAccepted = milestone.accepted && !milestone.released;
                          const isPending = !milestone.accepted && !milestone.released;

                          return (
                            <div key={index} className="flex items-center gap-2 text-xs p-2 bg-white rounded-lg border border-slate-200">
                              <span className="flex-shrink-0">
                                {isCompleted ? (
                                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : isAccepted ? (
                                  <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-medium truncate ${isCompleted ? 'text-emerald-700' : isAccepted ? 'text-amber-700' : 'text-slate-700'}`}>
                                    Milestone {index + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {Number(milestone.percentage) / 100}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      isCompleted ? 'bg-emerald-500' : isAccepted ? 'bg-amber-500' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${isCompleted ? 100 : isAccepted ? 75 : 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {projectMilestones.length === 0 && (
                          <p className="text-center text-slate-500 py-2">No milestones</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="text-center text-slate-500 py-4">No active projects. Create your first project to get started!</p>
              )}
            </div>
          )}

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${kpiExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Card>

        {/* Yield Performance Card */}
        <Card
          className={`p-5 cursor-pointer hover:shadow-lg transition-all ${yieldExpanded ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => setYieldExpanded(!yieldExpanded)}
        >
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
                {activeProjects.reduce((count, p) => {
                  const projectMilestones = p.milestones || [];
                  const activeMilestones = projectMilestones.filter((m: any) => m.accepted || m.submissionTime > 0).length;
                  return count + activeMilestones;
                }, 0)}
              </p>
              <p className="text-xs text-slate-500">Active Milestones</p>
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

          {/* Rate Info */}
          <div className="flex justify-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">10% LP Allocation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Variable Yield</span>
            </div>
          </div>

          {/* Expanded Content - Projects with yield info */}
          {yieldExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {activeProjects.map((project) => {
                const hasDeposits = project.totalDeposited > BigInt(0);
                if (!hasDeposits) return null;

                const isYieldProjectExpanded = expandedYieldProjects[project.id.toString()];
                const projectMilestones = project.milestones || [];
                const acceptedMilestones = projectMilestones.filter((m: any) => m.accepted);

                return (
                  <div key={project.id.toString()} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleYieldProject(project.id.toString())}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform ${isYieldProjectExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-slate-900">Project #{project.id.toString()}</span>
                      </div>
                      <Badge variant="success" className="text-xs">
                        {acceptedMilestones.length} Active
                      </Badge>
                    </div>

                    {/* Milestones with yield */}
                    {isYieldProjectExpanded && (
                      <div className="p-3 space-y-2">
                        {projectMilestones.map((milestone: any, index: number) => {
                          const isAccepted = milestone.accepted && !milestone.released;
                          const isReleased = milestone.released;

                          // Show only accepted/released milestones (those with yield)
                          if (!isAccepted && !isReleased) return null;

                          const milestoneAmount = (project.totalDeposited * BigInt(milestone.percentage)) / BigInt(10000);
                          const lpAmount = milestoneAmount / BigInt(10); // 10% goes to LP
                          const yieldRate = 5.0; // Assume 5% for demo
                          const yieldAmount = (lpAmount * BigInt(Math.round(yieldRate * 100))) / BigInt(10000);

                          return (
                            <div key={index} className="bg-white rounded-lg p-2.5 border border-slate-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-xs font-semibold text-slate-900">
                                  Milestone {index + 1}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-bold ${getYieldColor(yieldRate)} bg-white px-2 py-0.5 rounded-full border border-slate-200`}>
                                    +{formatYieldRate(yieldRate)}%
                                  </span>
                                  {isReleased && (
                                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                      Released
                                    </span>
                                  )}
                                  {isAccepted && !isReleased && (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                      Withdrawable
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 3-Box Breakdown */}
                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {formatCurrency(milestoneAmount, 'IDRX')}
                                  </p>
                                  <p className="text-[10px] text-slate-600">Vault (90%)</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2 text-center">
                                  <p className="text-xs font-bold text-blue-700 truncate">
                                    {formatCurrency(lpAmount, 'IDRX')}
                                  </p>
                                  <p className="text-[10px] text-blue-600">LP (10%)</p>
                                </div>
                                <div className={`${getYieldBgColor(yieldRate)} rounded-lg p-2 text-center`}>
                                  <p className={`text-xs font-bold truncate ${getYieldColor(yieldRate)}`}>
                                    {formatCurrency(yieldAmount, 'IDRX')}
                                  </p>
                                  <p className={`text-[10px] ${getYieldColor(yieldRate)}`}>Yield</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {acceptedMilestones.length === 0 && (
                          <p className="text-center text-slate-500 py-2 text-sm">No active milestones with yield</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.filter(p => p.totalDeposited > BigInt(0)).length === 0 && (
                <p className="text-center text-slate-500 py-4">No projects with deposits yet. Deposit funds to start earning yield!</p>
              )}
            </div>
          )}

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${yieldExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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

        {ownerProjects.length === 0 ? (
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
            {ownerProjects.slice(0, 6).map((project) => {
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
