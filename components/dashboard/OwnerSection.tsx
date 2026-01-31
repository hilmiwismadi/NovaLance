'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useMyProfile, useProjects, useProjectBalances } from '@/lib/api-hooks';

export default function OwnerSection() {
  const { data: user, isLoading: userLoading } = useMyProfile();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: projectBalances, isLoading: balancesLoading } = useProjectBalances();

  // Filter projects owned by current user
  const { address } = user || {};
  const myProjects = projects?.filter(p => p.ownerAddress === address) || [];

  // Calculate totals from project balances
  const totalBudgetLocked = projectBalances?.totals?.deposited || '0';

  // Show loading state
  if (userLoading || projectsLoading || balancesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            As Project Owner
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center py-8">
            <div className="animate-pulse h-8 w-16 mx-auto bg-slate-200 rounded"></div>
            <div className="animate-pulse h-4 w-20 mx-auto mt-2 bg-slate-200 rounded"></div>
          </Card>
          <Card className="text-center py-8">
            <div className="animate-pulse h-8 w-16 mx-auto bg-slate-200 rounded"></div>
            <div className="animate-pulse h-4 w-20 mx-auto mt-2 bg-slate-200 rounded"></div>
          </Card>
          <Card className="text-center py-8">
            <div className="animate-pulse h-8 w-16 mx-auto bg-slate-200 rounded"></div>
            <div className="animate-pulse h-4 w-20 mx-auto mt-2 bg-slate-200 rounded"></div>
          </Card>
        </div>
      </div>
    );
  }

  const activeProjects = myProjects.filter(p => p.status === 'in_progress' || p.status === 'open').length;
  const formattedBudget = totalBudgetLocked ? parseInt(totalBudgetLocked).toLocaleString() : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          As Project Owner
        </h2>
        <Link href="/PO/create">
          <Button size="sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{myProjects.length}</p>
          <p className="text-sm text-slate-600 mt-1">Total Projects</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{activeProjects}</p>
          <p className="text-sm text-slate-600 mt-1">Active Projects</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">{formattedBudget}</p>
          <p className="text-sm text-slate-600 mt-1">Total Budget Locked</p>
        </Card>
      </div>

      {myProjects.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Your Recent Projects</h3>
          {myProjects.slice(0, 2).map((project) => (
            <Link key={project.id} href={`/PO/projects/${project.id}`}>
              <Card hover className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{project.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {project.roles.length} roles · {project.status}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-600 mb-4">No projects created yet</p>
          <Link href="/PO/create">
            <Button>Create Your First Project</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
