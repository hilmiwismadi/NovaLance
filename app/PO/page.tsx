'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { mockPOProjects, mockUser, calculateProjectProgress, formatCurrency } from '@/lib/mockData';

// Get projects owned by current user
const ownerProjects = mockPOProjects.filter(
  p => p.owner.toLowerCase() === mockUser.address.toLowerCase()
);

// Calculate stats
const stats = {
  totalProjects: ownerProjects.length,
  activeProjects: ownerProjects.filter(p => p.status === 'in-progress' || p.status === 'hiring').length,
  completedProjects: ownerProjects.filter(p => p.status === 'completed').length,
  totalBudget: ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0),
  openRoles: ownerProjects.reduce((sum, p) => sum + p.roles.filter(r => r.status === 'hiring').length, 0),
};

export default function PODashboard() {
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
            Project Owner Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your projects and track team progress
          </p>
        </div>
        <Link href="/PO/create-project">
          <Button variant="primary" className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalProjects}</p>
              <p className="text-xs text-slate-600">Projects</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.activeProjects}</p>
              <p className="text-xs text-slate-600">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedProjects}</p>
              <p className="text-xs text-slate-600">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 truncate">{formatCurrency(stats.totalBudget, 'IDRX')}</p>
              <p className="text-xs text-slate-600">Total Budget</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.openRoles}</p>
              <p className="text-xs text-slate-600">Open Roles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Projects</h2>
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
            {ownerProjects.map((project) => {
              const progress = calculateProjectProgress(project);
              const hiredRoles = project.roles.filter(r => r.assignedTo).length;
              const hiringRoles = project.roles.filter(r => r.status === 'hiring').length;

              return (
                <Link key={project.id} href={`/PO/projects/${project.id}`}>
                  <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                      <Badge
                        variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                        className="shrink-0"
                      >
                        {project.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Features preview */}
                    {project.features && project.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.features.slice(0, 3).map((feature, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            {feature}
                          </span>
                        ))}
                        {project.features.length > 3 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            +{project.features.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

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
                    </div>

                    {/* Roles info */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                      <span className="text-slate-600">
                        {project.roles.length} role{project.roles.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-600">
                        {hiredRoles} hired, {hiringRoles} hiring
                      </span>
                      <span className="font-semibold text-brand-600">
                        {formatCurrency(project.totalBudget, project.currency)}
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
