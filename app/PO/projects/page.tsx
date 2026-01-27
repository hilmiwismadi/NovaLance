'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockPOProjects, mockUser, calculateProjectProgress, formatCurrency } from '@/lib/mockData';

// Get projects owned by current user
const ownerProjects = mockPOProjects.filter(
  p => p.owner.toLowerCase() === mockUser.address.toLowerCase()
);

type FilterType = 'all' | 'hiring' | 'in-progress' | 'completed';

interface FilterConfig {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const filters: FilterConfig[] = [
  {
    key: 'all',
    label: 'All Projects',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    key: 'hiring',
    label: 'Hiring',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>`,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
    color: 'text-brand-700',
    bgColor: 'bg-brand-100',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
];

export default function POProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProjects = ownerProjects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const stats = {
    all: ownerProjects.length,
    hiring: ownerProjects.filter(p => p.status === 'hiring').length,
    inProgress: ownerProjects.filter(p => p.status === 'in-progress').length,
    completed: ownerProjects.filter(p => p.status === 'completed').length,
  };

  // Debug logging
  console.log('=== Projects Stats Debug ===');
  console.log('Owner projects:', ownerProjects.map(p => ({ id: p.id, title: p.title, status: p.status })));
  console.log('Stats:', stats);

  // Calculate overall progress across all projects
  const totalProgress = ownerProjects.reduce((sum, p) => sum + calculateProjectProgress(p), 0);
  const overallProgress = ownerProjects.length > 0 ? Math.round(totalProgress / ownerProjects.length) : 0;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 text-sm mt-0.5 sm:mt-1 hidden sm:block">Manage your projects and teams</p>
        </div>
        <Link href="/PO/create-project">
          <Button variant="primary" size="sm" className="gap-2 sm:text-sm">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Create Project</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </Link>
      </div>

      {/* Overview Card */}
      <Card className="p-5 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Portfolio Overview</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.all} Project{stats.all !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {filters.map((f) => {
            // Map filter key to stats property
            const countMap: Record<FilterType, number> = {
              'all': stats.all,
              'hiring': stats.hiring,
              'in-progress': stats.inProgress,
              'completed': stats.completed,
            };
            const count = countMap[f.key];
            const isActive = filter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  group flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? `${f.bgColor} ${f.color} shadow-sm ring-2 ring-offset-1 ring-opacity-50`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }
                  ${f.key === 'all' && isActive ? 'ring-slate-300' : ''}
                  ${f.key === 'hiring' && isActive ? 'ring-amber-300' : ''}
                  ${f.key === 'in-progress' && isActive ? 'ring-brand-300' : ''}
                  ${f.key === 'completed' && isActive ? 'ring-emerald-300' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: f.icon }} />
                  <span className="text-xs sm:text-sm leading-tight">{f.label}</span>
                </div>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                  ${isActive ? 'bg-white/80' : f.bgColor + ' ' + f.color}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
          <p className="text-slate-600 mb-6">
            {filter === 'all' ? "You haven't created any projects yet" : `No ${filter} projects`}
          </p>
          <Link href="/PO/create-project">
            <Button variant="primary">Create Your First Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const progress = calculateProjectProgress(project);
            const hiredRoles = project.roles.filter(r => r.assignedTo).length;
            const hiringRoles = project.roles.filter(r => r.status === 'hiring').length;

            return (
              <Link key={project.id} href={`/PO/projects/${project.id}`}>
                <Card className="p-5 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-brand-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                    <Badge
                      variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : project.status === 'hiring' ? 'pending' : 'default'}
                      className="shrink-0"
                    >
                      {project.status === 'in-progress' ? 'Active' : project.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Timeline */}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {project.startDate && <span>{new Date(project.startDate).toLocaleDateString()}</span>}
                      {project.startDate && project.endDate && <span>→</span>}
                      {project.endDate && <span>{new Date(project.endDate).toLocaleDateString()}</span>}
                    </div>
                  )}

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

                  {/* Roles & Budget */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        {project.roles.length} role{project.roles.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-600">
                        {hiredRoles} hired, {hiringRoles} hiring
                      </span>
                    </div>
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
  );
}
