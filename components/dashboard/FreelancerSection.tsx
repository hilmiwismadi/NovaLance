import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockApplications, mockProjects, mockUser } from '@/lib/mockData';

export default function FreelancerSection() {
  const pendingApplications = mockApplications.filter(a => a.status === 'pending');
  const activeWork = mockProjects.filter(p => p.userRole === 'freelancer' && p.status === 'in-progress');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        As Freelancer
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-300">{mockUser.completedProjects}</p>
          <p className="text-sm text-white/60 mt-1">Completed</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-400">{mockUser.rating}</p>
          <p className="text-sm text-white/60 mt-1">Rating</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-400">{activeWork.length}</p>
          <p className="text-sm text-white/60 mt-1">Active Work</p>
        </Card>
      </div>

      {pendingApplications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">Pending Applications</h3>
            <Link href="/applications" className="text-sm text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>
          {pendingApplications.slice(0, 2).map((app) => (
            <Link key={app.id} href={`/jobs/${app.jobId}`}>
              <Card hover className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{app.jobTitle}</h4>
                  <p className="text-sm text-white/60 mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="pending">Pending</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeWork.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Active Work</h3>
          {activeWork.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card hover className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{project.title}</h4>
                  <p className="text-sm text-white/60 mt-1">
                    ${project.totalBudget} · {project.milestones.filter(m => m.status === 'completed').length}/{project.milestones.length} milestones
                  </p>
                </div>
                <Badge variant="warning">In Progress</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pendingApplications.length === 0 && activeWork.length === 0 && (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-white/60 mb-4">No active work yet</p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
