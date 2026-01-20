import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import mockApplications, { getApplicationStatusColor } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

export default function ApplicationsPage() {
  const stats = {
    total: mockApplications.length,
    pending: mockApplications.filter(a => a.status === 'pending').length,
    accepted: mockApplications.filter(a => a.status === 'accepted').length,
    rejected: mockApplications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Applications</h1>
        <p className="text-white/60 mt-1">Track your job applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-white/60 mt-1">Total</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.pending}</p>
          <p className="text-sm text-white/60 mt-1">Pending</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-400">{stats.accepted}</p>
          <p className="text-sm text-white/60 mt-1">Accepted</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          <p className="text-sm text-white/60 mt-1">Rejected</p>
        </Card>
      </div>

      {/* Applications List */}
      {mockApplications.length > 0 ? (
        <div className="space-y-4">
          {mockApplications.map((application) => (
            <Card key={application.id} className="hover:bg-white/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{application.jobTitle}</h3>
                      <p className="text-sm text-white/60 mt-1">
                        Applied {formatDate(application.appliedAt)}
                      </p>
                    </div>
                    <Badge variant={getApplicationStatusColor(application.status) as any}>
                      {application.status}
                    </Badge>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 mt-3">
                    <p className="text-sm text-white/70 italic">"{application.coverLetter}"</p>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 sm:min-w-[140px]">
                  {application.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="w-full">
                        Withdraw
                      </Button>
                    </>
                  )}
                  {application.status === 'accepted' && (
                    <Link href="/projects">
                      <Button size="sm" className="w-full">
                        View Project
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">No applications yet</h3>
          <p className="text-white/60 mb-6">Start browsing jobs and submit your first application!</p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </Card>
      )}

      {/* Tips */}
      <Card className="border-brand-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Tips for Better Applications</h3>
            <ul className="text-sm text-white/60 space-y-1">
              <li>• Tailor your cover letter to each specific job</li>
              <li>• Highlight relevant experience and skills</li>
              <li>• Keep your profile updated with your latest work</li>
              <li>• Respond promptly to messages from project owners</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
