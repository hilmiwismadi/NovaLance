'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { mockJobs } from '@/lib/mockData';

type FilterType = 'all' | 'hiring' | 'closed';

interface FilterConfig {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const filters: FilterConfig[] = [
  {
    key: 'all',
    label: 'All Jobs',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    key: 'hiring',
    label: 'Hiring',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    key: 'closed',
    label: 'Closed',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
];

export default function FLJobsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get all unique skills from jobs
  const allSkills = Array.from(new Set(mockJobs.flatMap(job => job.skills))).sort();

  // Filter jobs based on search, skills, and status
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => job.skills.includes(skill));

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesSkills && matchesStatus;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const stats = {
    all: mockJobs.length,
    hiring: mockJobs.filter(j => j.status === 'hiring').length,
    closed: mockJobs.filter(j => j.status === 'closed').length,
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Browse Jobs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Find your next opportunity
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="p-5 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Available Jobs
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.all} Job{stats.all !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-2">
          {filters.map((f) => {
            const countMap: Record<FilterType, number> = {
              'all': stats.all,
              'hiring': stats.hiring,
              'closed': stats.closed,
            };
            const count = countMap[f.key];
            const isActive = statusFilter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`
                  group flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? `${f.bgColor} ${f.color} shadow-sm ring-2 ring-offset-1 ring-opacity-50`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }
                  ${f.key === 'all' && isActive ? 'ring-slate-300' : ''}
                  ${f.key === 'hiring' && isActive ? 'ring-emerald-300' : ''}
                  ${f.key === 'closed' && isActive ? 'ring-slate-300' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: f.icon }} />
                  <span className="text-xs leading-tight">{f.label}</span>
                </div>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                  ${isActive ? 'bg-white/80' : f.bgColor + ' ' + f.color}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
              Search Jobs
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
              Filter by Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'success' : 'default'}
                  className="cursor-pointer transition-all hover:shadow-sm"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> jobs
          </p>
        </div>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center border-2 border-transparent">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-600">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/FL/jobs/${job.id}`}>
              <Card className="p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer h-full border-2 border-transparent">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                  <Badge variant={job.status === 'hiring' ? 'success' : 'default'}>{job.status}</Badge>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-xs bg-slate-100">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Milestones Preview */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
                    {job.milestones.length} Milestones
                  </p>
                  <div className="flex gap-1">
                    {job.milestones.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        className="h-2 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                        style={{ width: `${m.percentage}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-lg font-bold text-brand-600">
                    ${job.budget} {job.currency}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {job.postedByEns || job.postedBy.slice(0, 8)}
                    </span>
                    <span className="text-sm text-slate-500">•</span>
                    <span className="text-sm text-slate-600">
                      {job.applicantCount} applicants
                    </span>
                  </div>
                </div>

                {job.createdAt && (
                  <div className="mt-2 text-xs text-slate-500">
                    Posted {job.createdAt}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
