'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { mockProjects, mockPOProjects, mockApplications, mockUser, getProjectsByRole, formatCurrency, getApplicationStatusColor } from '@/lib/mockData';
import FLPortfolioContent from '@/components/fl/FLPortfolioContent';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected';
type TabType = 'projects' | 'applications' | 'portfolio';

interface FilterConfig {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const applicationFilters: FilterConfig[] = [
  {
    key: 'all',
    label: 'All',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>`,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
];

export default function FLProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get projects where user is freelancer or both
  const freelancerProjects = getProjectsByRole('freelancer').filter(
    p => p.userRole === 'freelancer' || p.userRole === 'both'
  );

  // Also get PO projects where user is assigned as freelancer
  const assignedRoles = mockPOProjects.flatMap(project =>
    project.roles
      .filter(r => r.assignedTo && r.assignedToEns === 'alice.eth')
      .map(role => ({ project, role }))
  );

  // Filter applications
  const filteredApplications = mockApplications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  // Filter projects
  const filteredProjects = freelancerProjects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const stats = {
    all: freelancerProjects.length,
    inProgress: freelancerProjects.filter(p => p.status === 'in-progress').length,
    completed: freelancerProjects.filter(p => p.status === 'completed').length,
  };

  const applicationStats = {
    all: mockApplications.length,
    pending: mockApplications.filter(a => a.status === 'pending').length,
    accepted: mockApplications.filter(a => a.status === 'accepted').length,
    rejected: mockApplications.filter(a => a.status === 'rejected').length,
  };

  // Calculate overall progress across all projects
  const calculateProjectProgress = (project: any) => {
    const completedMilestones = project.milestones.filter((m: any) => m.status === 'approved' || m.status === 'completed').length;
    return (completedMilestones / project.milestones.length) * 100;
  };

  const totalProgress = freelancerProjects.reduce((sum, p) => sum + calculateProjectProgress(p), 0);
  const overallProgress = freelancerProjects.length > 0 ? Math.round(totalProgress / freelancerProjects.length) : 0;

  if (!mounted) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Tabs */}
      <div>
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Projects
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === 'projects'
                ? 'text-brand-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Projects
            {activeTab === 'projects' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === 'applications'
                ? 'text-brand-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applications
            {activeTab === 'applications' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === 'portfolio'
                ? 'text-brand-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portfolio
            {activeTab === 'portfolio' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
            )}
          </button>
        </div>
      </div>

      {/* Projects Tab Content */}
      {activeTab === 'projects' && (
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
          {filteredProjects.length === 0 && assignedRoles.length === 0 ? (
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
              {/* Legacy projects */}
              {filteredProjects.map((project) => {
                const progress = Math.round(calculateProjectProgress(project));
                const completedMilestones = project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length;

                return (
                  <Link key={project.id} href={`/FL/projects/${project.id}`}>
                    <Card className="p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 text-base sm:text-lg line-clamp-1">{project.title}</h3>
                        <Badge
                          variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                          className="shrink-0"
                        >
                          {project.status === 'in-progress' ? 'Active' : project.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {completedMilestones}/{project.milestones.length} milestones completed
                        </p>
                      </div>

                      {/* Budget & Client */}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                        <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                          <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
                        </span>
                        <span className="text-slate-600">
                          {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
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
                  <Link key={`${project.id}-${role.id}`} href={`/FL/active-jobs`}>
                    <Card className="p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{project.title}</h3>
                          <p className="text-xs text-slate-500">{role.title}</p>
                        </div>
                        <Badge variant="warning">Active</Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {/* KPIs Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-900">
                            {completedKPIs}/{totalKPIs} KPIs
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-brand-400 to-brand-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-xs sm:text-sm text-slate-600">
                          Budget: <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                            <CurrencyDisplay amount={formatCurrency(role.budget, 'IDRX')} currency="IDRX" />
                          </span>
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600">
                          {project.ownerEns || project.owner.slice(0, 8)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Applications Tab Content */}
      {activeTab === 'applications' && (
        <>
          {/* Overview Card */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-white to-brand-50/50 border-brand-200/40 shadow-sm">
            <div className="mb-3 sm:mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                Application Overview
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {applicationStats.all} Application{applicationStats.all !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Overall Progress */}
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: applicationStats.all > 0 ? `${(applicationStats.accepted / applicationStats.all) * 100}%` : '0%' }}
              />
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {applicationFilters.map((f) => {
                const countMap: Record<FilterType, number> = {
                  'all': applicationStats.all,
                  'pending': applicationStats.pending,
                  'accepted': applicationStats.accepted,
                  'rejected': applicationStats.rejected,
                };
                const count = countMap[f.key];
                const isActive = filter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`
                      group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? `${f.bgColor} ${f.color} shadow-md ring-2 ring-offset-1 ring-opacity-60 scale-[1.02]`
                        : 'bg-white/80 backdrop-blur text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200/60 hover:border-slate-300'
                      }
                      ${f.key === 'all' && isActive ? 'ring-slate-400' : ''}
                      ${f.key === 'pending' && isActive ? 'ring-amber-400' : ''}
                      ${f.key === 'accepted' && isActive ? 'ring-emerald-400' : ''}
                      ${f.key === 'rejected' && isActive ? 'ring-red-400' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span dangerouslySetInnerHTML={{ __html: f.icon }} />
                      <span className="text-xs sm:text-sm leading-tight font-medium">{f.label}</span>
                    </div>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 self-start sm:self-auto
                      ${isActive ? 'bg-white/90 shadow-sm' : f.bgColor + ' ' + f.color}
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <Card className="p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50/50 to-white">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No applications found</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                {filter === 'all' ? "You haven't applied to any jobs yet" : `No ${filter} applications`}
              </p>
              <Link href="/FL/jobs">
                <Button variant="primary" className="w-full sm:w-auto">Browse Jobs</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredApplications.map((application) => {
                const isPending = application.status === 'pending';
                const isAccepted = application.status === 'accepted';
                const isRejected = application.status === 'rejected';

                return (
                  <Card
                    key={application.id}
                    className={`p-4 sm:p-5 hover:shadow-lg transition-all duration-200 border-2 overflow-hidden relative ${
                      isPending ? 'border-amber-300/60 bg-gradient-to-br from-amber-50/50 to-white hover:from-amber-50/70' : 'border-transparent bg-white'
                    } ${
                      isAccepted ? 'border-emerald-300/60 bg-gradient-to-br from-emerald-50/50 to-white hover:from-emerald-50/70' : ''
                    } ${
                      isRejected ? 'bg-gradient-to-br from-slate-50/50 to-white' : ''
                    }`}
                  >
                    {/* Status indicator bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      isPending ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      isAccepted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                      isRejected ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                      'bg-gradient-to-r from-brand-400 to-brand-500'
                    }`} />

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">{application.jobTitle}</h3>
                          <Badge variant={getApplicationStatusColor(application.status)} className="self-start">
                            {application.status}
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                          {application.coverLetter}
                        </p>

                        <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Applied: <span className="font-medium text-slate-900">{application.appliedAt}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            ID: <span className="font-mono text-slate-900 text-xs">{application.id}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:ml-4 pt-2 sm:pt-0">
                        {isAccepted && (
                          <Link href={`/FL/jobs/${application.jobId}`} className="w-full sm:w-auto">
                            <Button variant="primary" size="sm" className="gap-1.5 w-full sm:w-auto shadow-md shadow-brand-200/50">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="hidden sm:inline">View Project</span>
                              <span className="sm:hidden">Project</span>
                            </Button>
                          </Link>
                        )}
                        {isPending && (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
                            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                            <span className="text-xs sm:text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isRejected && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200/60">
                        <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 leading-relaxed">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Don't worry! Keep browsing and applying to jobs that match your skills.
                        </p>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-emerald-200/60 bg-emerald-50/30 -mx-4 sm:-mx-5 px-4 sm:px-5 -mb-4 sm:-mb-5 pb-4 sm:pb-5 rounded-b-xl">
                        <p className="text-xs sm:text-sm text-emerald-700 font-medium flex items-center gap-2 leading-relaxed">
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Congratulations! You've been hired. Start working on the project now.
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Portfolio Tab Content */}
      {activeTab === 'portfolio' && <FLPortfolioContent />}
    </div>
  );
}
