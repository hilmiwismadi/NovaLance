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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Freelancer Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Track your applications and active jobs
          </p>
        </div>
        <Link href="/FL/jobs">
          <Button variant="primary" className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Jobs</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeJobs}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Applications</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingApplications}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completedJobs}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Earnings</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalEarnings}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
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
