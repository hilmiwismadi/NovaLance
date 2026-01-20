import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ProjectHistoryItem {
  id: string;
  title: string;
  role: 'owner' | 'freelancer';
  status: string;
  completionDate: string;
  review?: {
    rating: number;
    comment: string;
  };
}

interface ProjectHistoryProps {
  projects: ProjectHistoryItem[];
  title: string;
}

export default function ProjectHistory({ projects, title }: ProjectHistoryProps) {
  if (projects.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-white/60">No projects yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="space-y-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card hover>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white">{project.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-xs">
                      {project.role === 'owner' ? 'Hired' : 'Completed'}
                    </Badge>
                    {project.review && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-white/60">{project.review.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-white/40 whitespace-nowrap ml-2">
                  {new Date(project.completionDate).toLocaleDateString()}
                </span>
              </div>
              {project.review?.comment && (
                <p className="text-sm text-white/60 mt-2 italic">"{project.review.comment}"</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
