import { notFound } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import MilestoneList from '@/components/jobs/MilestoneList';
import { getJobById, mockJobs } from '@/lib/mockData';
import { formatCurrency, formatDate, getJobStatusColor } from '@/lib/utils';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);

  if (!job) {
    notFound();
  }

  const isOwner = job.postedBy === '0x1234567890abcdef1234567890abcdef12345678';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/jobs" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      {/* Job Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <Badge variant={getJobStatusColor(job.status) as any}>
                {job.status === 'hiring' ? 'Hiring' : job.status}
              </Badge>
            </div>
            <p className="text-slate-600">{job.description}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold text-brand-600">{formatCurrency(job.budget, job.currency)}</p>
            <p className="text-sm text-slate-400">Total Budget</p>
          </div>
        </div>

        {/* Job Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-400 mb-1">Posted By</p>
            <p className="text-sm text-slate-700">
              {job.postedByEns || `${job.postedBy.slice(0, 6)}...${job.postedBy.slice(-4)}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Applicants</p>
            <p className="text-sm text-slate-700">{job.applicantCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Milestones</p>
            <p className="text-sm text-slate-700">{job.milestones.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Posted</p>
            <p className="text-sm text-slate-700">{job.createdAt ? formatDate(job.createdAt) : 'Recently'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-slate-700 leading-relaxed">{job.description}</p>
            </div>
          </Card>

          {/* Milestones */}
          <Card>
            <MilestoneList milestones={job.milestones} totalBudget={job.budget} currency={job.currency} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-sm rounded-lg bg-brand-100 text-brand-600 border border-brand-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            {isOwner ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Owner Actions</h2>
                <Button className="w-full" variant="outline">
                  View Applications ({job.applicantCount})
                </Button>
                <Button className="w-full" variant="outline">
                  Edit Job
                </Button>
                <Button className="w-full" variant="ghost">
                  Cancel Job
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Apply for this Job</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Submit your application to be considered for this project.
                </p>
                <Button className="w-full">
                  Apply as Freelancer
                </Button>
                <Link href={`/profile/${job.postedBy}`}>
                  <Button className="w-full" variant="outline">
                    View Client Profile
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
