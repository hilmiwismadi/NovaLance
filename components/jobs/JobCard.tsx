import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { Job } from '@/lib/mockData';
import { formatCurrency, formatDate, getJobStatusColor } from '@/lib/utils';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card hover className="h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{job.title}</h3>
          <Badge variant={getJobStatusColor(job.status) as any}>
            {job.status === 'hiring' ? 'Hiring' : job.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{job.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-xs rounded-lg bg-brand-100 text-brand-600 border border-brand-200"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {job.postedByEns?.[0].toUpperCase() || job.postedBy[2].toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-slate-700">
              {job.postedByEns || `${job.postedBy.slice(0, 6)}...${job.postedBy.slice(-4)}`}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-brand-600">
              <CurrencyDisplay amount={formatCurrency(job.budget, job.currency)} currency={job.currency} />
            </p>
            <p className="text-xs text-slate-400">{job.applicantCount} applicants</p>
          </div>
        </div>

        {job.createdAt && (
          <p className="text-xs text-slate-400 mt-2">{formatDate(job.createdAt)}</p>
        )}
      </Card>
    </Link>
  );
}
