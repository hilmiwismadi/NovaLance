'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import { mockPOProjects } from '@/lib/mockData';

// Track expansion state for each project
interface ExpansionState {
  [key: string]: boolean;
}

export default function PODashboard() {
  const [mounted, setMounted] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [yieldExpanded, setYieldExpanded] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<ExpansionState>({});
  const [expandedYieldProjects, setExpandedYieldProjects] = useState<ExpansionState>({});
  const [animateKPI, setAnimateKPI] = useState(false);
  const [animateYield, setAnimateYield] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger animations in sequence for smooth opening effect
    setTimeout(() => setAnimateCards(true), 100);
    setTimeout(() => setAnimateKPI(true), 600);
    setTimeout(() => setAnimateYield(true), 900);
  }, []);

  const { address } = useAccount();

  // Use mock data for demo - get projects owned by user
  const userProjects = useMemo(() => {
    return mockPOProjects;
  }, []);

  // Active projects (not cancelled or completed)
  const activeProjects = userProjects.filter(p =>
    p.status === 'hiring' || p.status === 'in-progress'
  );

  // Calculate overall progress based on KPIs across all active projects
  const calculateOverallProgress = (): { progress: number; completed: number; total: number } => {
    let totalKPIs = 0;
    let completedKPIs = 0;

    activeProjects.forEach(project => {
      project.roles.forEach(role => {
        role.kpis.forEach(kpi => {
          totalKPIs++;
          if (kpi.status === 'approved' || kpi.status === 'completed') {
            completedKPIs++;
          }
        });
      });
    });

    return {
      progress: totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 46,
      completed: completedKPIs,
      total: totalKPIs
    };
  };

  const { progress: overallProgress, completed: completedKPIs, total: totalKPIs } = calculateOverallProgress();

  // Calculate yield totals from active projects
  const calculateYieldTotals = () => {
    let totalDeposited = 0;
    let totalLP = 0;
    let totalYield = 0;
    let activeMilestones = 0;

    activeProjects.forEach(project => {
      project.roles.forEach(role => {
        role.kpis.forEach(kpi => {
          if (kpi.status === 'approved' || kpi.status === 'pending-approval' || kpi.status === 'in-progress') {
            activeMilestones++;
            const roleBudget = role.budget || 0;
            const kpiBudget = (roleBudget * kpi.percentage) / 100;
            totalDeposited += kpiBudget;

            // 10% goes to LP
            const lpAmount = kpiBudget * 0.1;
            totalLP += lpAmount;

            // Add yield if available
            if (kpi.yield) {
              totalYield += (lpAmount * kpi.yield) / 100;
            }
          }
        });
      });
    });

    // Estimate yield for demo
    if (totalYield === 0 && totalLP > 0) {
      totalYield = totalLP * 0.05; // 5% estimated yield
    }

    return { totalDeposited, totalLP, totalYield, activeMilestones };
  };

  const { totalDeposited, totalLP, totalYield, activeMilestones } = calculateYieldTotals();

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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hiring': return 'default';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hiring': return 'Hiring';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getKPIStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending-approval': return 'warning';
      case 'in-progress': return 'default';
      case 'pending': return 'default';
      default: return 'default';
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
          className={`p-5 cursor-pointer hover:shadow-xl transition-all duration-1000 ease-out ${kpiExpanded ? 'ring-2 ring-brand-500 shadow-lg' : 'hover:scale-[1.02]'} ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          onClick={() => setKpiExpanded(!kpiExpanded)}
          style={{ transitionProperty: 'opacity, transform', transitionTimingFunction: 'ease-out' }}
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
              <p className="text-3xl font-bold text-brand-600 transition-all duration-1000 ease-out">{animateKPI ? overallProgress : 0}%</p>
              <p className="text-xs text-slate-500">{completedKPIs}/{totalKPIs} completed</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animateKPI ? `${overallProgress}%` : '0%' }}
              />
            </div>
          </div>

          {/* Expanded Content - Project → Roles → KPIs */}
          <div
            className={`border-t border-slate-200 overflow-hidden transition-all duration-400 ease-out ${
              kpiExpanded ? 'pt-4 opacity-100' : 'pt-0 opacity-0 max-h-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
              {activeProjects.map((project) => {
                const isProjectExpanded = expandedProjects[project.id];

                return (
                  <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-1000">
                    {/* Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors duration-1000"
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform duration-1000 ${isProjectExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-slate-900">{project.title}</span>
                        <Badge variant={getStatusBadge(project.status)} className="text-xs">
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">{project.roles.length} role{project.roles.length > 1 ? 's' : ''}</span>
                    </div>

                    {/* Roles with KPIs */}
                    {isProjectExpanded && (
                      <div className="p-3 space-y-2 animate-in fade-in duration-1000">
                        {project.roles.map((role, roleIndex) => {
                          const roleKPIs = role.kpis;
                          const completedRoleKPIs = roleKPIs.filter(k => k.status === 'approved' || k.status === 'completed').length;
                          const roleProgress = roleKPIs.length > 0 ? Math.round((completedRoleKPIs / roleKPIs.length) * 100) : 0;

                          return (
                            <div key={role.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              {/* Role Header */}
                              <div className="flex items-center justify-between p-2.5 bg-slate-50/80">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-medium text-slate-900 text-sm truncate">{role.title}</span>
                                  {role.assignedToEns && (
                                    <span className="text-xs text-slate-500">by {role.assignedToEns}</span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-brand-600">{roleProgress}%</span>
                              </div>

                              {/* KPIs */}
                              <div className="p-2.5 space-y-2">
                                {roleKPIs.map((kpi, kpiIndex) => {
                                  const isCompleted = kpi.status === 'approved' || kpi.status === 'completed';
                                  const isPendingApproval = kpi.status === 'pending-approval';
                                  const isInProgress = kpi.status === 'in-progress';
                                  const isPending = kpi.status === 'pending';

                                  return (
                                    <div key={kpi.id} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-1000 hover:border-brand-200">
                                      <span className="flex-shrink-0">
                                        {isCompleted ? (
                                          <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        ) : isPendingApproval ? (
                                          <svg className="w-4 h-4 text-amber-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                          </svg>
                                        ) : isInProgress ? (
                                          <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                        )}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className={`font-medium truncate ${isCompleted ? 'text-emerald-700' : isPendingApproval ? 'text-amber-700' : isInProgress ? 'text-brand-700' : 'text-slate-700'}`}>
                                            {kpi.name}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded">
                                              {kpi.percentage}%
                                            </span>
                                            <Badge variant={getKPIStatusVariant(kpi.status)} className="text-xs py-0 px-1.5">
                                              {kpi.status === 'pending-approval' ? 'Review' : kpi.status}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-1.5 rounded-full transition-all duration-1000 ${
                                              isCompleted ? 'bg-emerald-500' : isPendingApproval ? 'bg-amber-500' : isInProgress ? 'bg-brand-400' : 'bg-slate-300'
                                            }`}
                                            style={{ width: isCompleted ? '100%' : isPendingApproval ? '75%' : isInProgress ? '40%' : '0%' }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="text-center text-slate-500 py-4">No active projects. Create your first project to get started!</p>
              )}
          </div>

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-400 ease-out ${kpiExpanded ? 'rotate-180' : ''}`}
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
          className={`p-5 cursor-pointer hover:shadow-xl transition-all duration-1000 ease-out ${yieldExpanded ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:scale-[1.02]'} ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          onClick={() => setYieldExpanded(!yieldExpanded)}
          style={{ transitionProperty: 'opacity, transform', transitionTimingFunction: 'ease-out' }}
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
              <p className="text-3xl font-bold text-emerald-600">{activeMilestones}</p>
              <p className="text-xs text-slate-500">Active Milestones</p>
            </div>
          </div>

          {/* Current Progress Summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center transition-all duration-1000 hover:scale-105">
              <p className="text-sm font-bold text-slate-800">
                <CurrencyDisplay amount={totalDeposited} currency="IDRX" />
              </p>
              <p className="text-xs text-slate-600">Deposited</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center transition-all duration-1000 hover:scale-105">
              <p className="text-sm font-bold text-blue-700">
                <CurrencyDisplay amount={totalLP} currency="IDRX" />
              </p>
              <p className="text-xs text-blue-600">LP (10%)</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center transition-all duration-1000 hover:scale-105">
              <p className="text-sm font-bold text-emerald-700">
                <CurrencyDisplay amount={totalYield} currency="IDRX" />
              </p>
              <p className="text-xs text-emerald-600">Est. Yield</p>
            </div>
          </div>

          {/* Rate Info */}
          <div className="flex justify-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-slate-600">10% LP Allocation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-600">Variable Yield</span>
            </div>
          </div>

          {/* Expanded Content - Projects with yield info */}
          <div
            className={`border-t border-slate-200 overflow-hidden transition-all duration-400 ease-out ${
              yieldExpanded ? 'pt-4 opacity-100' : 'pt-0 opacity-0 max-h-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
              {activeProjects.map((project) => {
                const hasKPIsWithYield = project.roles.some(r => r.kpis.some(k => k.status === 'approved' || k.status === 'pending-approval' || k.status === 'in-progress'));
                if (!hasKPIsWithYield) return null;

                const isYieldProjectExpanded = expandedYieldProjects[project.id];

                return (
                  <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-1000">
                    {/* Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors duration-1000"
                      onClick={() => toggleYieldProject(project.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform duration-1000 ${isYieldProjectExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-slate-900 truncate">{project.title}</span>
                      </div>
                      <Badge variant="success" className="text-xs">
                        {project.roles.reduce((sum, r) => sum + r.kpis.filter(k => k.status === 'approved' || k.status === 'pending-approval' || k.status === 'in-progress').length, 0)} Active
                      </Badge>
                    </div>

                    {/* Roles with KPIs and yield */}
                    {isYieldProjectExpanded && (
                      <div className="p-3 space-y-2 animate-in fade-in duration-1000">
                        {project.roles.map((role) => {
                          const activeKPIs = role.kpis.filter(k => k.status === 'approved' || k.status === 'pending-approval' || k.status === 'in-progress');

                          if (activeKPIs.length === 0) return null;

                          return (
                            <div key={role.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <div className="p-2.5 bg-slate-50/80 border-b border-slate-100">
                                <span className="font-medium text-slate-900 text-sm">{role.title}</span>
                              </div>
                              <div className="p-2.5 space-y-2">
                                {activeKPIs.map((kpi) => {
                                  const isReleased = kpi.status === 'approved' || kpi.status === 'completed';
                                  const isPending = kpi.status === 'pending-approval';
                                  const isInProgress = kpi.status === 'in-progress';

                                  const roleBudget = role.budget || 0;
                                  const kpiBudget = (roleBudget * kpi.percentage) / 100;
                                  const lpAmount = kpiBudget * 0.1;
                                  const yieldRate = kpi.yield || 5.2;
                                  const yieldAmount = (lpAmount * yieldRate) / 100;

                                  return (
                                    <div key={kpi.id} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 transition-all duration-1000 hover:border-emerald-200">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="text-xs font-semibold text-slate-900 flex-1 min-w-0">
                                          <span className="truncate">{kpi.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                          <span className={`text-[10px] font-bold ${getYieldColor(yieldRate)} bg-white px-2 py-0.5 rounded-full border border-slate-200`}>
                                            +{formatYieldRate(yieldRate)}%
                                          </span>
                                          {isReleased && (
                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                              Earned
                                            </span>
                                          )}
                                          {isPending && (
                                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                              Pending
                                            </span>
                                          )}
                                          {isInProgress && (
                                            <span className="text-[10px] font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full border border-brand-200">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* 3-Box Breakdown */}
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-white rounded-lg p-2 text-center transition-all duration-1000 hover:scale-105">
                                          <p className="text-xs font-bold text-slate-800 truncate">
                                            <CurrencyDisplay amount={kpiBudget} currency="IDRX" />
                                          </p>
                                          <p className="text-[10px] text-slate-600">Vault (90%)</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-2 text-center transition-all duration-1000 hover:scale-105">
                                          <p className="text-xs font-bold text-blue-700 truncate">
                                            <CurrencyDisplay amount={lpAmount} currency="IDRX" />
                                          </p>
                                          <p className="text-[10px] text-blue-600">LP (10%)</p>
                                        </div>
                                        <div className={`${getYieldBgColor(yieldRate)} rounded-lg p-2 text-center transition-all duration-1000 hover:scale-105`}>
                                          <p className={`text-xs font-bold truncate ${getYieldColor(yieldRate)}`}>
                                            <CurrencyDisplay amount={yieldAmount} currency="IDRX" />
                                          </p>
                                          <p className={`text-[10px] ${getYieldColor(yieldRate)}`}>Yield</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.filter(p => p.roles.some(r => r.kpis.some(k => k.status === 'approved' || k.status === 'pending-approval' || k.status === 'in-progress'))).length === 0 && (
                <p className="text-center text-slate-500 py-4">No projects with active milestones yet. Deposit funds to start earning yield!</p>
              )}
          </div>

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-400 ease-out ${yieldExpanded ? 'rotate-180' : ''}`}
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
          <Link href="/PO/projects" className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors">
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
            {userProjects.slice(0, 6).map((project, index) => {
              // Calculate project progress
              let totalKPIs = 0;
              let completedKPIs = 0;
              project.roles.forEach(role => {
                role.kpis.forEach(kpi => {
                  totalKPIs++;
                  if (kpi.status === 'approved' || kpi.status === 'completed') {
                    completedKPIs++;
                  }
                });
              });
              const progress = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;

              return (
                <Link key={project.id} href={`/PO/projects/${project.id}`}>
                  <Card
                    className={`p-4 hover:shadow-xl transition-all duration-1000 cursor-pointer h-full hover:scale-[1.02] hover:-translate-y-1 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transition: 'opacity 1s ease-out, transform 1s ease-out, box-shadow 0.5s ease-out' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 flex-1 min-w-0">{project.title}</h3>
                      <Badge
                        variant={getStatusBadge(project.status)}
                        className="shrink-0 text-xs ml-2"
                      >
                        {getStatusText(project.status)}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Roles/Freelancer info */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {project.roles.map((role) => (
                        role.assignedToEns ? (
                          <div key={role.id} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {role.assignedToEns}
                          </div>
                        ) : (
                          <span key={role.id} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {role.title}: Hiring
                          </span>
                        )
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* KPIs info */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        {project.roles.reduce((sum, r) => sum + r.kpis.length, 0)} KPI{project.roles.reduce((sum, r) => sum + r.kpis.length, 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-brand-600">
                        <CurrencyDisplay amount={project.totalBudget} currency="IDRX" />
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
