'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useMyProfile, useMyApplications } from '@/lib/api-hooks';

export default function FreelancerSection() {
  const { data: user, isLoading: userLoading, error: userError } = useMyProfile();
  const { data: applications, isLoading: appsLoading } = useMyApplications();

  const pendingApplications = applications?.filter(a => a.status === 'pending') || [];

  // Show loading state
  if (userLoading || appsLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          As Freelancer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

  // Show error state
  if (userError) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">As Freelancer</h2>
        <Card className="text-center py-8">
          <p className="text-red-600">Failed to load profile data</p>
        </Card>
      </div>
    );
  }

  const completedProjects = user?.completedProjects || 0;
  // Get active assignments from applications that are accepted
  const activeWork = applications?.filter(a => a.status === 'accepted') || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        As Freelancer
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{completedProjects}</p>
          <p className="text-sm text-slate-600 mt-1">Completed</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">{activeWork.length}</p>
          <p className="text-sm text-slate-600 mt-1">Active Work</p>
        </Card>
      </div>

      {pendingApplications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Pending Applications</h3>
            <Link href="/FL/applications" className="text-sm text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {pendingApplications.slice(0, 2).map((app) => (
            <Card key={app.id} hover className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 truncate">{app.projectRole.project.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{app.projectRole.name}</p>
              </div>
              <Badge variant="pending">Pending</Badge>
            </Card>
          ))}
        </div>
      )}

      {activeWork.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Active Work</h3>
          {activeWork.map((app) => (
            <Link key={app.id} href={`/FL/projects/${app.projectRole.project.id}`}>
              <Card hover className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{app.projectRole.project.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {app.projectRole.name}
                  </p>
                </div>
                <Badge variant="warning">Active</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pendingApplications.length === 0 && activeWork.length === 0 && (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-600 mb-4">No active work yet</p>
          <Link href="/FL/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
