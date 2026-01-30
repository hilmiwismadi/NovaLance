'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { mockProjects, mockApplications, mockPOProjects } from '@/lib/mockData';
import { formatCurrency } from '@/lib/mockData';

// Filter projects where user is freelancer
const freelancerProjects = mockProjects.filter(p => p.userRole === 'freelancer');

// Also get PO projects where user is assigned as freelancer
const assignedRoles = mockPOProjects.flatMap(project =>
  project.roles
    .filter(r => r.assignedTo && r.assignedToEns === 'alice.eth')
    .map(role => ({ project, role }))
);

// Calculate stats - moved outside component to avoid recalculation
const stats = {
  activeJobs: freelancerProjects.filter(p => p.status === 'in-progress').length + assignedRoles.filter(r => r.role.status === 'in-progress').length,
  completedJobs: freelancerProjects.filter(p => p.status === 'completed').length,
  pendingApplications: mockApplications.filter(a => a.status === 'pending').length,
  totalEarnings: freelancerProjects
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalBudget, 0),
};

// Mock yield data for earnings
interface EarningWithYield {
  projectId: string;
  projectTitle: string;
  roleTitle?: string;
  totalBudget: number;
  currency: string;
  status: string;
  baseEarnings: number;
  yieldEarnings: number;
  yieldRate: number;
  isWithdrawable: boolean;
  yieldStatus: 'generating' | 'completed' | 'withdrawn';
}

const mockEarnings: EarningWithYield[] = [
  {
    projectId: 'p2',
    projectTitle: 'Smart Contract Audit',
    totalBudget: 2000000,
    currency: 'IDRX',
    status: 'completed',
    baseEarnings: 2000000,
    yieldEarnings: 156000,
    yieldRate: 7.8,
    isWithdrawable: true,
    yieldStatus: 'completed',
  },
  {
    projectId: 'p5',
    projectTitle: 'Yield Farming Interface',
    totalBudget: 1800000,
    currency: 'IDRX',
    status: 'completed',
    baseEarnings: 1800000,
    yieldEarnings: 143100,
    yieldRate: 7.95,
    isWithdrawable: true,
    yieldStatus: 'completed',
  },
  {
    projectId: 'p7',
    projectTitle: 'Governance Dashboard',
    totalBudget: 1600000,
    currency: 'IDRX',
    status: 'completed',
    baseEarnings: 1600000,
    yieldEarnings: 195200,
    yieldRate: 12.2,
    isWithdrawable: true,
    yieldStatus: 'completed',
  },
  {
    projectId: 'p8',
    projectTitle: 'Token Swap DEX',
    totalBudget: 2500000,
    currency: 'IDRX',
    status: 'completed',
    baseEarnings: 2500000,
    yieldEarnings: -287500,
    yieldRate: -11.5,
    isWithdrawable: true,
    yieldStatus: 'completed',
  },
  // Active projects with generating yield
  {
    projectId: 'proj-4',
    projectTitle: 'Web3 Gaming Platform',
    roleTitle: 'Frontend Developer',
    totalBudget: 2500000,
    currency: 'IDRX',
    status: 'in-progress',
    baseEarnings: 500000,
    yieldEarnings: 16250,
    yieldRate: 3.25,
    isWithdrawable: false,
    yieldStatus: 'generating',
  },
  {
    projectId: 'proj-5',
    projectTitle: 'SocialFi DApp',
    roleTitle: 'Full Stack Developer',
    totalBudget: 3500000,
    currency: 'IDRX',
    status: 'in-progress',
    baseEarnings: 700000,
    yieldEarnings: -35000,
    yieldRate: -5.0,
    isWithdrawable: false,
    yieldStatus: 'generating',
  },
];

// Memoized earning card component
const EarningCard = memo(({
  earning,
  liveRate,
}: {
  earning: EarningWithYield;
  liveRate: number;
}) => {
  const isPositive = liveRate >= 0;
  const isActive = earning.yieldStatus === 'generating';

  return (
    <div
      className={`flex-shrink-0 w-80 p-4 rounded-xl border-2 transition-all duration-300 snap-center ${
        isActive
          ? 'bg-amber-50 border-amber-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm truncate">{earning.projectTitle}</h4>
          <p className="text-[10px] text-slate-600 truncate">{earning.roleTitle || 'Completed'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'} ${isActive ? 'transition-colors duration-300' : ''}`}>
            {isPositive ? '+' : ''}{liveRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-white/60 rounded-lg p-1.5 text-center min-w-0">
          <p className="text-[8px] text-slate-600 truncate">Deposited</p>
          <p className="text-[9px] font-bold text-slate-900 truncate">
            <CurrencyDisplay amount={formatCurrency(earning.baseEarnings, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 text-center min-w-0">
          <p className="text-[8px] text-blue-600 truncate">LP</p>
          <p className="text-[9px] font-bold text-blue-700 truncate">
            <CurrencyDisplay amount={formatCurrency(earning.baseEarnings * 0.1, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className={`rounded-lg p-1.5 text-center min-w-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[8px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Yield</p>
          <p className={`text-[9px] font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            <CurrencyDisplay amount={formatCurrency(Math.abs(earning.baseEarnings * liveRate / 100), 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
      </div>

      <Badge
        variant={isActive ? 'warning' : 'success'}
        className="text-[9px] mt-2 w-full justify-center"
      >
        {isActive ? 'In Progress' : 'Withdrawable'}
      </Badge>
    </div>
  );
});
EarningCard.displayName = 'EarningCard';

// Memoized milestone component
const MilestoneItem = memo(({
  milestone,
  index,
}: {
  milestone: { id: string; description?: string; name: string; percentage: number; status: string };
  index: number;
}) => {
  const isCompleted = milestone.status === 'completed' || milestone.status === 'approved';
  const isInProgress = milestone.status === 'in-progress';

  return (
    <div className="flex items-start gap-2 text-xs p-2 bg-slate-50 rounded-lg border border-slate-200">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>
            {milestone.description || milestone.name}
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded">
            {milestone.percentage}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-brand-500' : 'bg-slate-300'
            }`}
            style={{ width: `${milestone.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
});
MilestoneItem.displayName = 'MilestoneItem';

export default function FLDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [liveYields, setLiveYields] = useState<{[key: string]: number}>({
    'proj-4': 3.25,
    'proj-5': -5.0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized toggle callback
  const toggleActivity = useCallback(() => {
    setActivityExpanded(prev => !prev);
  }, []);

  // Live yield updates for in-progress projects - optimized with throttling
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveYields(prev => {
        const newYields = { ...prev };
        (Object.keys(newYields) as Array<keyof typeof newYields>).forEach(projectId => {
          // Random fluctuation between -0.5% and +0.8%
          const fluctuation = (Math.random() - 0.4) * 1.3;
          newYields[projectId] = Math.max(-15, Math.min(20, newYields[projectId] + fluctuation));
        });
        return newYields;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Memoized calculations - only recalculate when liveYields changes
  const earningsCalculations = useMemo(() => {
    const totalBaseEarnings = mockEarnings.reduce((sum, e) => sum + e.baseEarnings, 0);
    const totalYieldEarnings = mockEarnings.reduce((sum, e) => {
      if (e.status === 'in-progress') {
        const liveRate = liveYields[e.projectId] || e.yieldRate;
        return sum + (e.baseEarnings * liveRate / 100);
      }
      return sum + e.yieldEarnings;
    }, 0);
    const totalEarnings = totalBaseEarnings + totalYieldEarnings;
    const avgYieldRate = totalBaseEarnings > 0 ? (totalYieldEarnings / totalBaseEarnings) * 100 : 0;

    return { totalBaseEarnings, totalYieldEarnings, totalEarnings, avgYieldRate };
  }, [liveYields]);

  if (!mounted) return null;

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
        <Link href="/FL/jobs" prefetch={false}>
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
        <Card
          className={`p-5 cursor-pointer hover:shadow-lg transition-all ${activityExpanded ? 'ring-2 ring-brand-500' : ''}`}
          onClick={toggleActivity}
        >
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

          {/* Pending Applications Indicator */}
          <div className="flex items-center justify-between mb-3 p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Pending Applications</p>
                <p className="text-xs text-amber-600">Awaiting response</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-amber-700">{stats.pendingApplications}</span>
          </div>

          {/* Expanded Content - Project Hierarchy */}
          {activityExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {freelancerProjects.length === 0 && assignedRoles.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm">No active jobs to display</p>
              ) : (
                <>
                  {/* Legacy projects */}
                  {freelancerProjects.map((project) => {
                    const completedMilestones = project.milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
                    const progressPercentage = (completedMilestones / project.milestones.length) * 100;

                    return (
                      <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Project Header */}
                        <div className="flex items-center justify-between p-3 bg-slate-50">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-semibold text-slate-900 text-sm">{project.title}</span>
                            <Badge
                              variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                              className="text-xs"
                            >
                              {project.status === 'in-progress' ? 'Active' : project.status}
                            </Badge>
                          </div>
                          <span className="text-sm font-bold text-brand-600">{Math.round(progressPercentage)}%</span>
                        </div>

                        {/* Milestones */}
                        <div className="p-3 bg-white space-y-2">
                          {project.milestones.map((milestone, index) => (
                            <MilestoneItem key={milestone.id} milestone={milestone} index={index} />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* PO Projects where user is assigned */}
                  {assignedRoles.map(({ project, role }) => {
                    const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
                    const totalKPIs = role.kpis.length;
                    const progress = totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0;

                    return (
                      <div key={`${project.id}-${role.id}`} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Project Header */}
                        <div className="flex items-center justify-between p-3 bg-slate-50">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-semibold text-slate-900 text-sm">{project.title}</span>
                            <Badge variant="warning" className="text-xs">Active</Badge>
                          </div>
                          <span className="text-sm font-bold text-brand-600">{Math.round(progress)}%</span>
                        </div>

                        {/* Role Info */}
                        <div className="px-3 py-2 bg-white border-b border-slate-100">
                          <p className="text-xs text-slate-500">Role: {role.title}</p>
                        </div>

                        {/* KPIs */}
                        <div className="p-3 bg-white space-y-2">
                          {role.kpis.map((kpi, index) => (
                            <MilestoneItem key={kpi.id} milestone={kpi} index={index} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${activityExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Card>

        {/* Earnings Overview Card */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Earnings Overview</h3>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-slate-600 truncate">Total Deposited</p>
              <p className="text-[10px] font-bold text-slate-900 truncate">
                <CurrencyDisplay amount={formatCurrency(earningsCalculations.totalBaseEarnings, 'IDRX')} currency="IDRX" className="text-[9px]" />
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-blue-600 truncate">In LP (10%)</p>
              <p className="text-[10px] font-bold text-blue-700 truncate">
                <CurrencyDisplay amount={formatCurrency(earningsCalculations.totalBaseEarnings * 0.1, 'IDRX')} currency="IDRX" className="text-[9px]" />
              </p>
            </div>
            <div className={`rounded-lg p-2 text-center ${earningsCalculations.avgYieldRate >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-[8px] ${earningsCalculations.avgYieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'} truncate`}>Avg Yield</p>
              <p className={`text-[10px] font-bold truncate ${earningsCalculations.avgYieldRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {earningsCalculations.avgYieldRate >= 0 ? '+' : ''}{earningsCalculations.avgYieldRate.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Horizontal scroll cards */}
          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="relative -mx-4 px-4">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth no-scrollbar"
              style={{ scrollPadding: '0 calc(50% - 160px)' }}
            >
              {mockEarnings.map((earning) => (
                <EarningCard
                  key={earning.projectId}
                  earning={earning}
                  liveRate={earning.status === 'in-progress' ? (liveYields[earning.projectId] || earning.yieldRate) : earning.yieldRate}
                />
              ))}
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {mockEarnings.map((_, index) => (
                <button
                  key={index}
                  className="h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 w-1.5 transition-all duration-300"
                  aria-label={`Go to card ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Active Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Active Jobs</h2>
          <Link href="/FL/jobs" prefetch={false} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Browse More Jobs →
          </Link>
        </div>

        {freelancerProjects.length === 0 && assignedRoles.length === 0 ? (
          <Card className="p-12 text-center border-2 border-transparent">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs yet</h3>
            <p className="text-slate-600 mb-6">Browse available jobs and submit your applications</p>
            <Link href="/FL/jobs" prefetch={false}>
              <Button variant="primary">Browse Jobs</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legacy projects */}
            {freelancerProjects.map((project) => {
              const completedMilestones = project.milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
              const progressPercentage = (completedMilestones / project.milestones.length) * 100;

              return (
                <Link key={project.id} href={`/FL/jobs/${project.id}`} prefetch={false}>
                  <Card className="p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer h-full border-2 border-transparent">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{project.title}</h3>
                      <Badge
                        variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                      >
                        {project.status === 'in-progress' ? 'Active' : project.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Milestones Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">
                          {completedMilestones} / {project.milestones.length} milestones
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-sm text-slate-600">
                        Earnings: <span className="font-semibold text-brand-600">
                          <CurrencyDisplay amount={formatCurrency(project.totalBudget, 'IDRX')} currency="IDRX" />
                        </span>
                      </span>
                      <span className="text-sm text-slate-600">
                        {project.ownerEns || project.owner.slice(0, 8)}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}

            {/* PO Projects where user is assigned */}
            {assignedRoles.map(({ project, role }) => {
              const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
              const totalKPIs = role.kpis.length;
              const progress = totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0;

              return (
                <Link key={`${project.id}-${role.id}`} href={`/FL/active-jobs`} prefetch={false}>
                  <Card className="p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer h-full border-2 border-transparent">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{project.title}</h3>
                        <p className="text-xs text-slate-500">{role.title}</p>
                      </div>
                      <Badge variant="warning">Active</Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* KPIs Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">
                          {completedKPIs} / {totalKPIs} KPIs
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-sm text-slate-600">
                        Budget: <span className="font-semibold text-brand-600">
                          <CurrencyDisplay amount={formatCurrency(role.budget, 'IDRX')} currency="IDRX" />
                        </span>
                      </span>
                      <span className="text-sm text-slate-600">
                        {project.ownerEns || project.owner.slice(0, 8)}
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
