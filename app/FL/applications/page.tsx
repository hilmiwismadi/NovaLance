'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockApplications, getApplicationStatusColor } from '@/lib/mockData';

export default function FLApplicationsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredApplications = mockApplications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: mockApplications.length,
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
          <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
          <p className="text-slate-600 mt-1">Track your job applications</p>
        </div>
        <Link href="/FL/jobs">
          <Button variant="primary" className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-600">Total</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-slate-600">Pending</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
          <p className="text-sm text-slate-600">Accepted</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-slate-600">Rejected</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'pending'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'accepted'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Accepted ({stats.accepted})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            filter === 'rejected'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="p-12 text-center">
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
          {filteredApplications.map((application) => (
            <Card key={application.id} className="p-6">
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
                  {application.status === 'accepted' && (
                    <Link href={`/FL/jobs/${application.jobId}`}>
                      <Button variant="primary" size="sm">
                        View Project
                      </Button>
                    </Link>
                  )}
                  {application.status === 'pending' && (
                    <Button variant="outline" size="sm" disabled>
                      Awaiting Response
                    </Button>
                  )}
                </div>
              </div>

              {application.status === 'rejected' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Don't worry! Keep browsing and applying to jobs that match your skills.
                  </p>
                </div>
              )}

              {application.status === 'accepted' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-emerald-600 font-medium">
                    Congratulations! You've been hired. Start working on the project now.
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
