'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { mockProjects, mockApplications } from '@/lib/mockData';

// Filter projects where user is freelancer
const freelancerProjects = mockProjects.filter(p => p.userRole === 'freelancer');

// Calculate stats
const stats = {
  activeJobs: freelancerProjects.filter(p => p.status === 'in-progress').length,
  completedJobs: freelancerProjects.filter(p => p.status === 'completed').length,
  pendingApplications: mockApplications.filter(a => a.status === 'pending').length,
  totalEarnings: freelancerProjects
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalBudget, 0),
};

export default function FLDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [earningsExpanded, setEarningsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <Link href="/FL/jobs">
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
          onClick={() => setActivityExpanded(!activityExpanded)}
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
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {freelancerProjects.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm">No active jobs to display</p>
              ) : (
                freelancerProjects.map((project) => {
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
                            {project.status}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold text-brand-600">{Math.round(progressPercentage)}%</span>
                      </div>

                      {/* Milestones */}
                      <div className="p-3 bg-white space-y-2">
                        {project.milestones.map((milestone) => {
                          const isCompleted = milestone.status === 'completed' || milestone.status === 'approved';
                          const isInProgress = milestone.status === 'in-progress';

                          return (
                            <div key={milestone.id} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg border border-slate-200">
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
                                    {milestone.title}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
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
                        })}
                      </div>
                    </div>
                  );
                })
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
        <Card
          className={`p-5 cursor-pointer hover:shadow-lg transition-all ${earningsExpanded ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => setEarningsExpanded(!earningsExpanded)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Earnings Overview</h3>
                <p className="text-xs text-slate-500">Your total income</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">${stats.totalEarnings}</p>
              <p className="text-xs text-slate-500">From {stats.completedJobs} completed job{stats.completedJobs !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-800">{stats.completedJobs}</p>
              <p className="text-xs text-slate-600">Completed</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-brand-700">${stats.activeJobs > 0 ? Math.round(stats.totalEarnings / (stats.completedJobs || 1)) : 0}</p>
              <p className="text-xs text-brand-600">Avg per job</p>
            </div>
          </div>

          {/* Info indicators */}
          <div className="flex justify-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Completed earnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-500"></div>
              <span className="text-slate-600">Potential income</span>
            </div>
          </div>

          {/* Expanded Content - Earnings by Project */}
          {earningsExpanded && (
            <div className="border-t border-slate-200 pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {freelancerProjects.filter(p => p.status === 'completed').length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm">No completed jobs yet</p>
              ) : (
                freelancerProjects
                  .filter(p => p.status === 'completed')
                  .map((project) => (
                    <div key={project.id} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                          <p className="text-xs text-slate-500">{project.ownerEns || project.owner.slice(0, 8)}</p>
                        </div>
                        <span className="text-lg font-bold text-emerald-600">${project.totalBudget}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Completed {project.milestones.filter(m => m.status === 'completed' || m.status === 'approved').length} milestones</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Expand indicator */}
          <div className="flex justify-center mt-4">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${earningsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Active Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Active Jobs</h2>
          <Link href="/FL/jobs" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Browse More Jobs →
          </Link>
        </div>

        {freelancerProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs yet</h3>
            <p className="text-slate-600 mb-6">Browse available jobs and submit your applications</p>
            <Link href="/FL/jobs">
              <Button variant="primary">Browse Jobs</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freelancerProjects.map((project) => {
              const completedMilestones = project.milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
              const progressPercentage = (completedMilestones / project.milestones.length) * 100;

              return (
                <Link key={project.id} href={`/FL/jobs/${project.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{project.title}</h3>
                      <Badge
                        variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                      >
                        {project.status}
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
                          className="bg-brand-500 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-sm text-slate-600">
                        Earnings: <span className="font-semibold text-brand-600">${project.totalBudget} {project.currency}</span>
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
