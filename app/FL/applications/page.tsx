'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockApplications, getApplicationStatusColor } from '@/lib/mockData';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected';

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
    label: 'All',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>`,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
];

export default function FLApplicationsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredApplications = mockApplications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    all: mockApplications.length,
    pending: mockApplications.filter(a => a.status === 'pending').length,
    accepted: mockApplications.filter(a => a.status === 'accepted').length,
    rejected: mockApplications.filter(a => a.status === 'rejected').length,
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Applications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your job applications
          </p>
        </div>
        <Link href="/FL/jobs">
          <Button variant="primary" size="sm" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Overview Card */}
      <Card className="p-5 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Application Overview
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.all} Application{stats.all !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500"
            style={{ width: stats.all > 0 ? `${(stats.accepted / stats.all) * 100}%` : '0%' }}
          />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {filters.map((f) => {
            const countMap: Record<FilterType, number> = {
              'all': stats.all,
              'pending': stats.pending,
              'accepted': stats.accepted,
              'rejected': stats.rejected,
            };
            const count = countMap[f.key];
            const isActive = filter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  group flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? `${f.bgColor} ${f.color} shadow-sm ring-2 ring-offset-1 ring-opacity-50`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }
                  ${f.key === 'all' && isActive ? 'ring-slate-300' : ''}
                  ${f.key === 'pending' && isActive ? 'ring-amber-300' : ''}
                  ${f.key === 'accepted' && isActive ? 'ring-emerald-300' : ''}
                  ${f.key === 'rejected' && isActive ? 'ring-red-300' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: f.icon }} />
                  <span className="text-xs sm:text-sm leading-tight">{f.label}</span>
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

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="p-12 text-center border-2 border-transparent">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications found</h3>
          <p className="text-slate-600 mb-6">
            {filter === 'all' ? "You haven't applied to any jobs yet" : `No ${filter} applications`}
          </p>
          <Link href="/FL/jobs">
            <Button variant="primary">Browse Jobs</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const isPending = application.status === 'pending';
            const isAccepted = application.status === 'accepted';
            const isRejected = application.status === 'rejected';

            return (
              <Card
                key={application.id}
                className={`p-5 hover:shadow-lg hover:border-brand-200 transition-all border-2 ${
                  isPending ? 'border-amber-200 bg-amber-50/30' : 'border-transparent'
                } ${isAccepted ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{application.jobTitle}</h3>
                      <Badge variant={getApplicationStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {application.coverLetter}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>
                        Applied: <span className="font-medium text-slate-900">{application.appliedAt}</span>
                      </span>
                      <span>•</span>
                      <span>
                        ID: <span className="font-mono text-slate-900">{application.id}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {isAccepted && (
                      <Link href={`/FL/jobs/${application.jobId}`}>
                        <Button variant="primary" size="sm" className="gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          View Project
                        </Button>
                      </Link>
                    )}
                    {isPending && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {isRejected && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Don't worry! Keep browsing and applying to jobs that match your skills.
                    </p>
                  </div>
                )}

                {isAccepted && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Congratulations! You've been hired. Start working on the project now.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
