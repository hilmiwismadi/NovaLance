'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useMyApplications } from '@/lib/api-hooks';
import { formatCurrency } from '@/lib/contract';
import KPIDetailModal from '@/components/fl/KPIDetailModal';

type FilterType = 'all' | 'in-progress' | 'completed';

export default function FLProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // KPI Detail Modal state
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<{
    projectId: string;
    roleId: string;
    roleTitle: string;
    roleBudget: number;
    kpi: any;
  } | null>(null);

  // Wallet address
  const { address } = useAccount();

  // API hook for applications (shows projects where user is assigned)
  const { data: applications, isLoading } = useMyApplications();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter accepted applications (active work)
  const assignedApplications = applications?.filter(a => a.status === 'accepted') || [];

  // Map applications to project + role structure
  const assignedRoles = assignedApplications.map(app => ({
    project: app.projectRole.project,
    role: app.projectRole,
  }));

  // Filter projects
  const filteredRoles = assignedRoles.filter(({ role }) => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return role.project.status === 'in_progress' || role.project.status === 'open';
    if (filter === 'completed') return role.project.status === 'completed';
    return true;
  });

  const stats = {
    all: assignedRoles.length,
    inProgress: assignedRoles.filter(({ role }) => role.project.status === 'in_progress' || role.project.status === 'open').length,
    completed: assignedRoles.filter(({ role }) => role.project.status === 'completed').length,
  };

  // Calculate overall progress across all projects
  const calculateProjectProgress = (role: any) => {
    // Use kpiCount as indicator of progress
    const totalKpis = role.kpiCount || 0;
    // We don't have individual KPI status in the application, so estimate progress
    return totalKpis > 0 ? 50 : 0; // Default to 50% for assigned roles
  };

  const totalProgress = assignedRoles.reduce((sum, { role }) => sum + calculateProjectProgress(role), 0);
  const overallProgress = assignedRoles.length > 0 ? Math.round(totalProgress / assignedRoles.length) : 0;

  if (!mounted) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Overview Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-brand-50/50 border-brand-200/40 shadow-sm">
        <div className="mb-3 sm:mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Project Overview
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {stats.all} Project{stats.all !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-2">
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
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'in-progress'
                ? 'bg-brand-100 text-brand-700 shadow-sm ring-2 ring-offset-1 ring-brand-300'
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
      {filteredRoles.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50/50 to-white">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
            {filter === 'all' ? "You haven't started any projects yet" : `No ${filter} projects`}
          </p>
          <Link href="/FL/jobs">
            <Button variant="primary" className="w-full sm:w-auto">Browse Jobs</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredRoles.map(({ project, role }) => {
            const progress = calculateProjectProgress(role);
            const totalKPIs = role.kpiCount || 0;
            const roleBudget = BigInt(role.paymentPerKpi || 0) * BigInt(totalKPIs);

            return (
              <div
                key={`${project.id}-${role.id}`}
                onClick={() => {
                  // Set up a placeholder KPI for the modal
                  // In production, this would fetch actual KPIs from the API
                  setSelectedKPI({
                    projectId: project.id,
                    roleId: role.id,
                    roleTitle: role.name,
                    roleBudget: Number(roleBudget) / 1e6, // Convert from IDRX (6 decimals)
                    kpi: {
                      id: 'placeholder',
                      name: 'Key Performance Indicator',
                      percentage: 100 / Math.max(totalKPIs, 1),
                      status: 'pending' as const,
                      description: role.description,
                    },
                  });
                  setKpiModalOpen(true);
                }}
                className="cursor-pointer"
              >
                <Card className="p-4 sm:p-5 hover:shadow-lg transition-all h-full border-2 border-transparent hover:border-brand-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{project.title}</h3>
                      <p className="text-xs text-slate-500">{role.name}</p>
                    </div>
                    <Badge variant={project.status === 'in_progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
                      {project.status === 'open' ? 'Hiring' : project.status === 'in_progress' ? 'Active' : project.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* KPIs Progress */}
                  {totalKPIs > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600">KPIs</span>
                        <span className="font-medium text-slate-900">
                          {totalKPIs} KPI{totalKPIs > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs sm:text-sm text-slate-600">
                      Budget: <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                        <CurrencyDisplay amount={formatCurrency(roleBudget, 'IDRX')} currency="IDRX" />
                      </span>
                    </span>
                    <span className="text-xs sm:text-sm text-slate-600">
                      {role.project.ownerAddress?.slice(0, 8)}
                    </span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI Detail Modal */}
      {selectedKPI && (
        <KPIDetailModal
          isOpen={kpiModalOpen}
          onClose={() => {
            setKpiModalOpen(false);
            setSelectedKPI(null);
          }}
          projectId={selectedKPI.projectId}
          roleId={selectedKPI.roleId}
          roleTitle={selectedKPI.roleTitle}
          roleBudget={selectedKPI.roleBudget}
          kpi={selectedKPI.kpi}
          currency="IDRX"
          onSuccess={() => {
            // Refresh logic could go here
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
