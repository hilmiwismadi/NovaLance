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

export default function POProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hiring' | 'in-progress' | 'completed'>('all');

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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage your projects and teams</p>
        </div>
        <Link href="/PO/create-project">
          <Button variant="primary" className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
          <p className="text-xs text-slate-600">Total Projects</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.hiring}</p>
          <p className="text-xs text-slate-600">Hiring</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-brand-600">{stats.inProgress}</p>
          <p className="text-xs text-slate-600">In Progress</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="text-xs text-slate-600">Completed</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({stats.all})
        </button>
        <button
          onClick={() => setFilter('hiring')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'hiring'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Hiring ({stats.hiring})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'in-progress'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress ({stats.inProgress})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'completed'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({stats.completed})
        </button>
      </div>

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
                <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                    <Badge
                      variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : project.status === 'hiring' ? 'primary' : 'default'}
                      className="shrink-0"
                    >
                      {project.status}
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
  );
}
