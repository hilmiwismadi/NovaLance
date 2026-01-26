'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { mockJobs } from '@/lib/mockData';

export default function FLJobsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get all unique skills from jobs
  const allSkills = Array.from(new Set(mockJobs.flatMap(job => job.skills))).sort();

  // Filter jobs based on search and skills
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => job.skills.includes(skill));

    return matchesSearch && matchesSkills && job.status === 'hiring';
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Browse Jobs</h1>
        <p className="text-slate-600 mt-1">Find your next opportunity</p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'success' : 'default'}
                  className="cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700"
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
        <Card className="p-12 text-center">
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
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                  <Badge variant="success">{job.status}</Badge>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Milestones Preview */}
                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    {job.milestones.length} milestones
                  </p>
                  <div className="flex gap-1">
                    {job.milestones.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        className="h-2 rounded-full bg-slate-200"
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
