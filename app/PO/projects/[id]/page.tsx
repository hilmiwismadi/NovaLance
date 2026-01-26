'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getPOProjectById, formatCurrency } from '@/lib/mockData';

export default function POProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [approveKPIModalOpen, setApproveKPIModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<{ roleIndex: number; kpiIndex: number } | null>(null);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-slate-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/PO/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const handleDeposit = () => {
    // TODO: Implement deposit logic
    setDepositModalOpen(false);
  };

  const handleApproveKPI = () => {
    if (selectedKPI) {
      // TODO: Implement approval logic
      console.log('Approving KPI:', selectedKPI);
      setApproveKPIModalOpen(false);
      setSelectedKPI(null);
    }
  };

  const openApproveModal = (roleIndex: number, kpiIndex: number) => {
    setSelectedKPI({ roleIndex, kpiIndex });
    setApproveKPIModalOpen(true);
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const hiredRoles = project.roles.filter(r => r.assignedTo);
  const hiringRoles = project.roles.filter(r => r.status === 'hiring');
  const visibleFeatures = featuresExpanded ? project.features : project.features?.slice(0, 3);

  const getKPIYield = (kpi: any, role: any) => {
    if (kpi.status === 'approved') {
      const baseAmount = (role.budget * kpi.percentage) / 100;
      // Use the yield from KPI if available, otherwise default to 0
      const yieldPercent = kpi.yield !== undefined ? kpi.yield : 0;
      const yieldAmount = baseAmount * (yieldPercent / 100);
      const totalAmount = baseAmount + yieldAmount;

      return {
        baseAmount,
        yieldPercent,
        yieldAmount,
        totalAmount,
        formattedBase: formatCurrency(baseAmount, project.currency),
        formattedTotal: formatCurrency(totalAmount, project.currency),
      };
    }
    return null;
  };

  const getYieldColor = (yieldPercent: number) => {
    if (yieldPercent < 0) return 'text-red-600';
    if (yieldPercent < 5) return 'text-amber-600';
    if (yieldPercent < 10) return 'text-emerald-600';
    return 'text-emerald-500';
  };

  const getYieldIcon = (yieldPercent: number) => {
    if (yieldPercent < 0) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    if (yieldPercent < 5) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Back button, Status, Currency */}
      <div className="flex items-center gap-3">
        <Link
          href="/PO/projects"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <Badge
          variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
          className="text-sm px-3 py-1"
        >
          {project.status === 'in-progress' ? 'Active' : project.status}
        </Badge>

        {project.currency && (
          <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {project.currency}
          </span>
        )}
      </div>

      {/* Hero Header Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-slate-50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6 md:p-8">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            {project.title}
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl">
            {project.description}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-200/60">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Budget</p>
              <p className="text-lg font-bold text-brand-600">
                {formatCurrency(project.totalBudget, project.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Team Roles</p>
              <p className="text-lg font-bold text-slate-900">{project.roles.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Hired</p>
              <p className="text-lg font-bold text-emerald-600">{hiredRoles.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline Card with animated arrow */}
      <Card className="p-5 bg-gradient-to-r from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Project Timeline</p>
              <div className="flex items-center gap-2 mt-0.5">
                {project.startDate && (
                  <span className="text-sm font-semibold text-slate-900">
                    {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {project.endDate && (
                  <>
                    <div className="flex items-center gap-1 overflow-hidden">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-brand-400 to-brand-300 rounded" />
                      <svg className="w-4 h-4 text-brand-500 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="w-8 h-0.5 bg-gradient-to-r from-brand-300 to-brand-200 rounded" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Duration badge */}
          {project.startDate && project.endDate && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-slate-700">
                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Features Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Features</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {project.features?.length || 0}
            </span>
          </div>

          {project.features && project.features.length > 3 && (
            <button
              onClick={() => setFeaturesExpanded(!featuresExpanded)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              {featuresExpanded ? (
                <>
                  Show less
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Show {project.features.length - 3} more
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visibleFeatures?.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm bg-slate-50 hover:bg-brand-50/50 transition-colors px-3 py-2 rounded-lg border border-slate-200/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              <span className="text-slate-700 truncate">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Roles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Team Roles</h2>
            <span className="text-sm text-slate-500">({project.roles.length})</span>
          </div>

          {project.roles.map((role, roleIndex) => {
            const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
            const totalKPIs = role.kpis.length;
            const progress = totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0;
            const isExpanded = expandedRoles.has(role.id);

            return (
              <Card key={role.id} className="overflow-hidden">
                {/* Brief View - Always Visible */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Title and status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{role.title}</h3>
                        <Badge
                          variant={role.status === 'in-progress' ? 'warning' : role.status === 'hiring' ? 'pending' : 'success'}
                          className="text-xs flex-shrink-0"
                        >
                          {role.status === 'in-progress' ? 'Active' : role.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-1 sm:line-clamp-2">{role.description}</p>

                      {/* Skills - Mobile friendly */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {role.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md border border-brand-100">
                            {skill}
                          </span>
                        ))}
                        {role.skills.length > 3 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            +{role.skills.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Assigned freelancer or hiring status */}
                      {role.assignedToEns ? (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{role.assignedToEns[0]}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-900 font-medium truncate">{role.assignedToEns}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-3 text-amber-600">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs">Looking for freelancer...</span>
                        </div>
                      )}
                    </div>

                    {/* Budget */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="text-base sm:text-lg font-bold text-brand-600">
                        {formatCurrency(role.budget, 'IDRX')}
                      </p>
                    </div>
                  </div>

                  {/* Expand/Collapse Button - Full width at bottom */}
                  <button
                    onClick={() => toggleRoleExpanded(role.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all border border-brand-200 hover:border-brand-300"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Progress & KPIs</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View Progress & KPIs</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Section - Progress & KPIs */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/30">
                    {/* KPIs Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-slate-900">Progress</span>
                        <span className="text-sm font-semibold text-brand-600">{completedKPIs}/{totalKPIs} KPIs</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* KPIs List */}
                    <div className="space-y-2">
                  {role.kpis.map((kpi, kpiIndex) => {
                    const yieldAmount = getKPIYield(kpi, role);
                    const isInProgress = kpi.status === 'in-progress';

                    return (
                      <div
                        key={kpi.id}
                        className={`border rounded-lg p-3 transition-all ${
                          kpi.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200'
                            : kpi.status === 'completed'
                            ? 'bg-amber-50 border-amber-200'
                            : kpi.status === 'in-progress'
                            ? 'bg-brand-50 border-brand-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-slate-900 text-sm truncate">{kpi.name}</h4>

                              {/* Status icon - no text */}
                              {kpi.status === 'approved' ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : kpi.status === 'completed' ? (
                                <Badge variant="warning" className="text-xs">
                                  Ready for Review
                                </Badge>
                              ) : isInProgress ? (
                                <div className="flex items-center gap-1.5 text-brand-600">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                </div>
                              ) : (
                                <Badge variant="default" className="text-xs">
                                  {kpi.status}
                                </Badge>
                              )}

                              <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full">
                                {kpi.percentage}%
                              </span>
                            </div>

                            {kpi.description && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-1">{kpi.description}</p>
                            )}

                            {/* Yield info for approved KPIs */}
                            {yieldAmount && (
                              <div className={`flex items-center gap-2 ${getYieldColor(yieldAmount.yieldPercent)}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-semibold">
                                  {yieldAmount.yieldPercent.toFixed(2)}% yield • {yieldAmount.formattedTotal}
                                </span>
                              </div>
                            )}

                            {/* Deadline for in-progress KPIs */}
                            {isInProgress && kpi.deadline && (
                              <div className="flex items-center gap-1.5 text-brand-600 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs">
                                  Due: {new Date(kpi.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          {kpi.status === 'completed' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openApproveModal(roleIndex, kpiIndex)}
                              className="flex-shrink-0"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </Button>
                          )}
                        </div>

                        {/* Animated progress bar for in-progress KPIs */}
                        {isInProgress && (
                          <div className="mt-2 pt-2 border-t border-brand-200/50">
                            <div className="w-full bg-brand-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Budget</h3>
            <div className="space-y-3 mb-4">
              {project.roles.map((role, i) => (
                <div key={role.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{role.title || `Role ${i + 1}`}</span>
                  <span className="font-medium text-slate-900 flex-shrink-0">
                    {formatCurrency(role.budget, 'IDRX')}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-brand-600">
                {formatCurrency(project.totalBudget, 'IDRX')}
              </span>
            </div>

            <Button variant="primary" className="w-full mt-4" onClick={() => setDepositModalOpen(true)}>
              Deposit to Escrow
            </Button>
          </Card>

          {/* Team Status */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Team Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Roles</span>
                <span className="font-medium text-slate-900">{project.roles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hired</span>
                <span className="font-medium text-emerald-600">{hiredRoles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hiring</span>
                <span className="font-medium text-amber-600">{hiringRoles.length}</span>
              </div>
            </div>

            {hiringRoles.length > 0 && (
              <Link href={`/PO/projects/${project.id}/applications`} className="block mt-4">
                <Button variant="default" className="w-full">
                  View Applications
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit to Escrow">
        <div className="space-y-4">
          <p className="text-slate-600">
            Funds will be held in escrow and released as KPIs are approved.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Total project budget: <strong>{formatCurrency(project.totalBudget, 'IDRX')}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDepositModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeposit} className="flex-1">
              Deposit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve KPI Modal */}
      <Modal isOpen={approveKPIModalOpen} onClose={() => setApproveKPIModalOpen(false)} title="Approve KPI">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to approve this KPI and release the payment to the freelancer?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. Payment will be released from escrow.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApproveKPIModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={handleApproveKPI} className="flex-1">
              Approve & Release
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes slideRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        .animate-slide-right {
          animation: slideRight 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
