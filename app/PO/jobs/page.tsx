'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useProjects } from '@/lib/api-hooks';
import { formatCurrency } from '@/lib/contract';

export default function POJobsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Wallet address
  const { address } = useAccount();

  // API hook for projects
  const { data: allProjects, isLoading } = useProjects();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter projects where user is owner
  const ownerProjects = allProjects?.filter(p => p.ownerAddress === address) || [];

  const filteredProjects = ownerProjects.filter(project => {
    if (filter === 'active') return project.status === 'in_progress' || project.status === 'open';
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

  // Calculate project budget from roles
  const getProjectBudget = (project: any) => {
    return project.roles?.reduce((sum: bigint, role: any) => {
      const roleBudget = BigInt(role.paymentPerKpi || 0) * BigInt(role.kpiCount || 0);
      return sum + roleBudget;
    }, 0n) || 0n;
  };

  if (!mounted) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
            <p className="text-slate-600 mt-1">Manage jobs you've posted</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading jobs...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-slate-600 mt-1">Manage jobs you've posted</p>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          All Jobs ({ownerProjects.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'active'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Active ({ownerProjects.filter(p => p.status === 'in_progress' || p.status === 'open').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'completed'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({ownerProjects.filter(p => p.status === 'completed').length})
        </button>
      </div>

      {/* Jobs List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-600 mb-6">
            {filter === 'all' ? "You haven't posted any jobs yet" : `No ${filter} jobs`}
          </p>
          <Link href="/PO/create-project">
            <Button variant="primary">Create Your First Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const projectBudget = getProjectBudget(project);
            const assignedRoles = project.roles?.filter((r: any) => r.status === 'assigned').length || 0;

            return (
              <Link key={project.id} href={`/PO/projects/${project.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                    <Badge
                      variant={project.status === 'in_progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}
                    >
                      {project.status === 'open' ? 'Hiring' : project.status === 'in_progress' ? 'Active' : project.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Roles/KPIs Progress */}
                  {project.roles && project.roles.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Roles Assigned</span>
                        <span className="font-medium text-slate-900">
                          {assignedRoles} / {project.roles.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${project.roles.length ? (assignedRoles / project.roles.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-sm text-slate-600">
                      Budget: <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                        <CurrencyDisplay amount={formatCurrency(projectBudget, 'IDRX')} currency="IDRX" />
                      </span>
                    </span>
                    <span className="text-sm text-slate-600">
                      {project.roles?.length || 0} role{project.roles?.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {!assignedRoles && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <Badge variant="warning">No freelancers assigned yet</Badge>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
