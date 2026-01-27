'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { POProject, mockPOProjects, calculateProjectProgress as calculateProjectProgressUtil, formatCurrency } from '@/lib/mockData';

// Track expansion state for each project, role, and KPI
interface ExpansionState {
  [key: string]: boolean;
}

// Simulated realistic yield rates for each KPI (-5% to 15%)
const mockYieldRates: { [key: string]: number } = {
  'kpi-3-1': 11.44,   // Setup & Wallet Connection
  'kpi-4-1': -2.35,   // Contract Architecture (negative yield)
  'kpi-4-2': 8.72,    // Core Automation Logic
};

export default function PODashboard() {
  const [mounted, setMounted] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [yieldExpanded, setYieldExpanded] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<ExpansionState>({});
  const [expandedRoles, setExpandedRoles] = useState<ExpansionState>({});
  const [expandedYieldProjects, setExpandedYieldProjects] = useState<ExpansionState>({});
  const [expandedYieldRoles, setExpandedYieldRoles] = useState<ExpansionState>({});
  const [liveYieldRates, setLiveYieldRates] = useState<{ [key: string]: number }>(mockYieldRates);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address } = useAccount();

  // Get projects from mock data
  const ownerProjects = address
    ? mockPOProjects.filter(p => p.owner.toLowerCase() === address.toLowerCase())
    : mockPOProjects;

  const activeProjects = ownerProjects.filter(p =>
    p.status === 'in-progress' || p.status === 'hiring'
  );

  // Local helper to calculate project progress
  const calculateProjectProgress = (project: POProject): number => {
    return calculateProjectProgressUtil(project);
  };

  // Simulate live yield fluctuations for in-progress KPIs
  useEffect(() => {
    if (!yieldExpanded) return;

    const interval = setInterval(() => {
      setLiveYieldRates(prev => {
        const updated = { ...prev };
        // Fluctuate yields for in-progress KPIs
        activeProjects.forEach(p => {
          p.roles.forEach(r => {
            r.kpis.forEach(k => {
              if (k.status === 'in-progress') {
                const baseRate = updated[k.id] || 5;
                // Random fluctuation between -0.5% and +0.5%
                const fluctuation = (Math.random() - 0.5) * 1;
                const newRate = Math.max(-5, Math.min(15, baseRate + fluctuation));
                updated[k.id] = parseFloat(newRate.toFixed(2));
              }
            });
          });
        });
        return updated;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [yieldExpanded]);

  if (!mounted) return null;

  // Calculate overall KPI progress
  const totalKPIs = activeProjects.reduce((sum, p) => sum + p.roles.reduce((s, r) => s + r.kpis.length, 0), 0);
  const completedKPIs = activeProjects.reduce((sum, p) => sum + p.roles.reduce((s, r) => s + r.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length, 0), 0);
  const overallProgress = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;

  // Calculate yield with realistic rates
  let totalDeposited = 0;
  let totalLP = 0;
  let totalYield = 0;

  activeProjects.forEach(p => {
    p.roles.forEach(r => {
      if (r.assignedTo) {
        const approvedKPIs = r.kpis.filter(k => k.status === 'approved');
        approvedKPIs.forEach(k => {
          const kpiAmount = r.budget * (k.percentage / 100);
          const lpKpiDeposit = kpiAmount * 0.1;
          const yieldRate = (liveYieldRates[k.id] || 5) / 100;
          const kpiYield = lpKpiDeposit * yieldRate;

          totalDeposited += kpiAmount;
          totalLP += lpKpiDeposit;
          totalYield += kpiYield;
        });
      }
    });
  });

  const getYieldRate = (kpiId: string): number => {
    if (liveYieldRates[kpiId] !== undefined) {
      return liveYieldRates[kpiId];
    }
    // Default rate for KPIs without mock data
    return parseFloat((Math.random() * 10 + 2).toFixed(2)); // 2% to 12%
  };

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

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleRole = (roleId: string) => {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const toggleYieldProject = (projectId: string) => {
    setExpandedYieldProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleYieldRole = (roleId: string) => {
    setExpandedYieldRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
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
              <p className="text-xs text-slate-500">{completedKPIs}/{totalKPIs} completed</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          {/* Expanded Content - 3-Level Hierarchy */}
          {kpiExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {activeProjects.map((project) => {
                const projectProgress = calculateProjectProgress(project);
                const isProjectExpanded = expandedProjects[project.id];

                return (
                  <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Level 1: Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleProject(project.id)}
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
                        <span className="font-semibold text-slate-900">{project.title}</span>
                        <Badge variant={project.status === 'in-progress' ? 'warning' : 'primary'} className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-brand-600">{projectProgress}%</span>
                    </div>

                    {/* Level 2: Roles */}
                    {isProjectExpanded && (
                      <div className="p-2 space-y-2">
                        {project.roles.map((role) => {
                          const roleCompletedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
                          const roleProgress = (roleCompletedKPIs / role.kpis.length) * 100;
                          const isRoleExpanded = expandedRoles[role.id];

                          return (
                            <div key={role.id} className="border border-slate-200 rounded-lg overflow-hidden">
                              {/* Role Header */}
                              <div
                                className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleRole(role.id)}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <svg
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRoleExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="text-sm font-medium text-slate-800">{role.title}</span>
                                  {role.assignedToEns && (
                                    <span className="text-xs text-slate-500">({role.assignedToEns})</span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-brand-600">{roleCompletedKPIs}/{role.kpis.length}</span>
                              </div>

                              {/* Level 3: KPIs */}
                              {isRoleExpanded && (
                                <div className="p-2 bg-slate-50/50 space-y-2">
                                  {role.kpis.map((kpi) => {
                                    const isCompleted = kpi.status === 'completed' || kpi.status === 'approved';
                                    const isInProgress = kpi.status === 'in-progress';

                                    return (
                                      <div key={kpi.id} className="flex items-center gap-2 text-xs p-2 bg-white rounded-lg border border-slate-200">
                                        <span className="flex-shrink-0">
                                          {isCompleted ? (
                                            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          ) : isInProgress ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                          )}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className={`font-medium truncate ${isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>
                                              {kpi.name}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                              {kpi.percentage}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full transition-all ${
                                                isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-brand-500' : 'bg-slate-300'
                                              }`}
                                              style={{ width: `${kpi.percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="text-center text-slate-500 py-4">No active projects</p>
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
                {activeProjects.reduce((count, p) =>
                  count + p.roles.filter(r => r.assignedTo).reduce((c, r) =>
                    c + r.kpis.filter(k => k.status === 'approved' || k.status === 'in-progress').length, 0), 0)
                }
              </p>
              <p className="text-xs text-slate-500">Active KPIs</p>
            </div>
          </div>

          {/* Current Progress Summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-800">{formatCurrency(totalDeposited, 'IDRX')}</p>
              <p className="text-xs text-slate-600">Deposited</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-blue-700">{formatCurrency(totalLP, 'IDRX')}</p>
              <p className="text-xs text-blue-600">LP (10%)</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(totalYield, 'IDRX')}</p>
              <p className="text-xs text-emerald-600">Total Yield</p>
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

          {/* Expanded Content - Project → Role → KPI with 3-box breakdown */}
          {yieldExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {activeProjects.map((project) => {
                const hasActiveKPIs = project.roles.some(r =>
                  r.assignedTo && r.kpis.some(k => k.status === 'approved' || k.status === 'in-progress')
                );

                if (!hasActiveKPIs) return null;

                const isYieldProjectExpanded = expandedYieldProjects[project.id];

                return (
                  <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Level 1: Project Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleYieldProject(project.id)}
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
                        <span className="font-semibold text-slate-900">{project.title}</span>
                      </div>
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </div>

                    {/* Level 2: Roles */}
                    {isYieldProjectExpanded && (
                      <div className="p-2 space-y-2">
                        {project.roles.map((role) => {
                          if (!role.assignedTo) return null;

                          const activeKPIs = role.kpis.filter(k => k.status === 'approved' || k.status === 'in-progress');
                          if (activeKPIs.length === 0) return null;

                          const isYieldRoleExpanded = expandedYieldRoles[role.id];

                          return (
                            <div key={role.id} className="border border-slate-200 rounded-lg overflow-hidden">
                              {/* Role Header */}
                              <div
                                className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleYieldRole(role.id)}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <svg
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isYieldRoleExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="text-sm font-medium text-slate-800">{role.title}</span>
                                  <span className="text-xs text-slate-500">({role.assignedToEns})</span>
                                </div>
                                <span className="text-xs text-slate-500">{activeKPIs.length} KPI{activeKPIs.length > 1 ? 's' : ''}</span>
                              </div>

                              {/* Level 3: KPIs with 3-box breakdown */}
                              {isYieldRoleExpanded && (
                                <div className="p-2 bg-slate-50/50 space-y-2">
                                  {role.kpis.map((kpi) => {
                                    // Show both approved and in-progress KPIs
                                    if (kpi.status !== 'approved' && kpi.status !== 'in-progress') return null;

                                    const kpiAmount = role.budget * (kpi.percentage / 100);
                                    const lpKpiDeposit = kpiAmount * 0.1;
                                    const yieldRate = getYieldRate(kpi.id) / 100;
                                    const kpiYield = lpKpiDeposit * yieldRate;
                                    const isWithdrawable = kpi.status === 'approved';
                                    const isOnGoing = kpi.status === 'in-progress';

                                    return (
                                      <div key={kpi.id} className="bg-white rounded-lg p-2.5 border border-slate-200">
                                        <div className="flex items-start justify-between mb-2">
                                          {/* KPI Name */}
                                          <div className="text-xs font-semibold text-slate-900">
                                            {kpi.name}
                                          </div>

                                          {/* Status Tag + Yield Rate */}
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-bold ${getYieldColor(yieldRate * 100)} bg-white px-2 py-0.5 rounded-full border border-slate-200`}>
                                              {yieldRate < 0 ? '' : '+'}{formatYieldRate(yieldRate * 100)}%
                                            </span>
                                            {isWithdrawable && (
                                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                Withdrawable
                                              </span>
                                            )}
                                            {isOnGoing && (
                                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                                On Going
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* 3-Box Breakdown */}
                                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                                          <div className={`rounded-lg p-2 text-center ${isOnGoing ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                            <p className={`text-xs font-bold truncate ${isOnGoing ? 'text-amber-800' : 'text-slate-800'}`}>
                                              {formatCurrency(kpiAmount, 'IDRX')}
                                            </p>
                                            <p className={`text-[10px] ${isOnGoing ? 'text-amber-600' : 'text-slate-600'}`}>Deposited</p>
                                          </div>
                                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                                            <p className="text-xs font-bold text-blue-700 truncate">
                                              {formatCurrency(lpKpiDeposit, 'IDRX')}
                                            </p>
                                            <p className="text-[10px] text-blue-600">LP (10%)</p>
                                          </div>
                                          <div className={`rounded-lg p-2 text-center ${getYieldBgColor(yieldRate * 100)}`}>
                                            <p className={`text-xs font-bold truncate ${getYieldColor(yieldRate * 100)}`}>
                                              {formatCurrency(kpiYield, 'IDRX')}
                                            </p>
                                            <p className={`text-[10px] ${getYieldColor(yieldRate * 100)}`}>Yield</p>
                                          </div>
                                        </div>

                                        {/* Status indicator */}
                                        {isOnGoing && (
                                          <div className="flex items-center gap-1.5 text-amber-600">
                                            <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                            <span className="text-xs">Live yield: {yieldRate < 0 ? '' : '+'}{formatYieldRate(yieldRate * 100)}%</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="text-center text-slate-500 py-4">No active projects generating yield</p>
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
              const hiredRoles = project.roles.filter(r => r.assignedTo).length;
              const hiringRoles = project.roles.filter(r => r.status === 'hiring').length;

              return (
                <Link key={project.id} href={`/PO/projects/${project.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{project.title}</h3>
                      <Badge
                        variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'primary'}
                        className="shrink-0 text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {project.description}
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

                    {/* Roles info */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        {project.roles.length} role{project.roles.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-600">
                        {hiredRoles} hired, {hiringRoles} open
                      </span>
                      <span className="font-semibold text-brand-600">
                        {formatCurrency(project.totalBudget, 'IDRX')}
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
