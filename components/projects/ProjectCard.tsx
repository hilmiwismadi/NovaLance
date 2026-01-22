import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Project } from '@/lib/mockData';
import { formatCurrency, getJobStatusColor } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const completedMilestones = project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length;
  const progress = (completedMilestones / project.milestones.length) * 100;

  const getRoleBadge = () => {
    if (project.userRole === 'both') {
      return (
        <div className="flex gap-1">
          <Badge variant="default" className="text-xs">Owner</Badge>
          <Badge variant="default" className="text-xs">Freelancer</Badge>
        </div>
      );
    }
    return <Badge variant="default">{project.userRole === 'owner' ? 'Owner' : 'Freelancer'}</Badge>;
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card hover className="h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 flex-1 mr-2">{project.title}</h3>
          <Badge variant={getJobStatusColor(project.status) as any} className="flex-shrink-0">
            {project.status === 'in-progress' ? 'Active' : project.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{project.description}</p>

        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-600">Progress</span>
              <span className="text-slate-700">{completedMilestones}/{project.milestones.length} milestones</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Budget and Role */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div>
              <p className="text-lg font-bold text-brand-600">{formatCurrency(project.totalBudget, project.currency)}</p>
            </div>
            {getRoleBadge()}
          </div>

          {/* Other party */}
          {project.userRole === 'owner' && project.freelancer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Freelancer:</span>
              <span className="text-slate-700">
                {project.freelancerEns || `${project.freelancer.slice(0, 6)}...${project.freelancer.slice(-4)}`}
              </span>
            </div>
          )}
          {project.userRole === 'freelancer' && project.owner && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Client:</span>
              <span className="text-slate-700">
                {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
