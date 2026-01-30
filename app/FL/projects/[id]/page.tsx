'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { getProjectById, formatCurrency } from '@/lib/mockData';

export default function FLProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const projectId = params.id as string;
  const project = getProjectById(projectId);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-slate-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/FL/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const completedMilestones = project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length;
  const progress = Math.round((completedMilestones / project.milestones.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/FL/projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
      </div>

      {/* Project Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <Badge variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
                {project.status === 'in-progress' ? 'Active' : project.status}
              </Badge>
            </div>
            <p className="text-slate-600">{project.description}</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-brand-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {completedMilestones} of {project.milestones.length} milestones completed
          </p>
        </div>

        {/* Budget */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">Total Budget</span>
          <span className="text-lg font-bold text-brand-600">
            <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
          </span>
        </div>

        {/* Client Info */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">Client</span>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
          </p>
        </div>
      </Card>

      {/* Milestones */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Milestones</h2>
        <div className="space-y-4">
          {project.milestones.map((milestone, index) => {
            const isCompleted = milestone.status === 'approved' || milestone.status === 'completed';
            const isInProgress = milestone.status === 'in-progress';
            const isPending = milestone.status === 'pending';

            return (
              <div
                key={milestone.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : isInProgress
                    ? 'border-brand-200 bg-brand-50/50'
                    : 'border-slate-200 bg-slate-50/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isInProgress
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{milestone.name}</h3>
                      {milestone.description && (
                        <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        isCompleted
                          ? 'success'
                          : isInProgress
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {milestone.status}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700">{milestone.percentage}%</span>
                  </div>
                </div>

                {/* Milestone budget */}
                <div className="ml-11 text-sm text-slate-600">
                  <CurrencyDisplay
                    amount={formatCurrency(
                      (project.totalBudget * milestone.percentage) / 100,
                      project.currency
                    )}
                    currency={project.currency}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
