import { notFound } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import RoleSection from '@/components/projects/RoleSection';
import { getProjectById } from '@/lib/mockData';
import { formatCurrency, formatDate, getJobStatusColor } from '@/lib/utils';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = getProjectById(params.id);

  if (!project) {
    notFound();
  }

  const isOwner = project.userRole === 'owner' || project.userRole === 'both';
  const isFreelancer = project.userRole === 'freelancer' || project.userRole === 'both';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/projects" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </Link>

      {/* Project Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <Badge variant={getJobStatusColor(project.status) as any}>
                {project.status === 'in-progress' ? 'Active' : project.status}
              </Badge>
            </div>
            <p className="text-slate-600">{project.description}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold text-brand-600">{formatCurrency(project.totalBudget, project.currency)}</p>
            <p className="text-sm text-slate-400">Total Budget</p>
          </div>
        </div>

        {/* Project Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-400 mb-1">Owner</p>
            <p className="text-sm text-slate-700">
              {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
            </p>
          </div>
          {project.freelancer && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Freelancer</p>
              <p className="text-sm text-slate-700">
                {project.freelancerEns || `${project.freelancer.slice(0, 6)}...${project.freelancer.slice(-4)}`}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1">Milestones</p>
            <p className="text-sm text-slate-700">{project.milestones.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Started</p>
            <p className="text-sm text-slate-700">{formatDate(project.createdAt)}</p>
          </div>
        </div>

        {/* Role badges */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">Your role:</span>
          {project.userRole === 'both' ? (
            <>
              <Badge variant="default">Owner</Badge>
              <span className="text-slate-400">&</span>
              <Badge variant="default">Freelancer</Badge>
            </>
          ) : (
            <Badge variant="default">{project.userRole === 'owner' ? 'Owner' : 'Freelancer'}</Badge>
          )}
        </div>
      </Card>

      {/* Milestone Progress Overview */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Overall Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Completed Milestones</span>
              <span className="text-slate-900">
                {project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length} / {project.milestones.length}
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                style={{
                  width: `${
                    (project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length /
                      project.milestones.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {project.milestones.filter(m => m.status === 'approved').length}
              </p>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {project.milestones.filter(m => m.status === 'in-progress').length}
              </p>
              <p className="text-xs text-slate-400">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">
                {project.milestones.filter(m => m.status === 'pending').length}
              </p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Role-Based Sections */}
      <div className="space-y-6">
        {/* As Owner Section */}
        {isOwner && (
          <Card className="border-brand-200">
            <RoleSection
              title="As Project Owner"
              description="Review freelancer work and approve milestones"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              milestones={project.milestones}
              totalBudget={project.totalBudget}
              currency={project.currency}
              userRole="owner"
            />
          </Card>
        )}

        {/* As Freelancer Section */}
        {isFreelancer && (
          <Card className="border-purple-200">
            <RoleSection
              title="As Freelancer"
              description="Track your progress and submit milestone completions"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              milestones={project.milestones}
              totalBudget={project.totalBudget}
              currency={project.currency}
              userRole="freelancer"
            />
          </Card>
        )}
      </div>

      {/* Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isOwner && project.freelancer && (
            <Button variant="outline" className="w-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message Freelancer
            </Button>
          )}
          {isFreelancer && project.owner && (
            <Button variant="outline" className="w-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message Client
            </Button>
          )}
          <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Issue
          </Button>
        </div>
      </Card>
    </div>
  );
}
