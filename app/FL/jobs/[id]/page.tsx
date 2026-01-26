'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { mockJobs, getJobById } from '@/lib/mockData';

export default function FLJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const jobId = params.id as string;
  const job = getJobById(jobId);

  useEffect(() => {
    setMounted(true);
  }, [jobId]);

  if (!mounted) return null;

  if (!job) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h1>
        <p className="text-slate-600 mb-6">The job you're looking for doesn't exist or has been closed.</p>
        <Link href="/FL/jobs">
          <Button variant="primary">Browse Jobs</Button>
        </Link>
      </div>
    );
  }

  const handleApply = () => {
    // TODO: Submit application via API
    console.log('Applying with cover letter:', coverLetter);
    setApplyModalOpen(false);
    setCoverLetter('');
    // Navigate to applications page
    router.push('/FL/applications');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/FL/jobs">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            <Badge variant={job.status === 'hiring' ? 'success' : 'default'}>
              {job.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
            <p className="text-slate-700 whitespace-pre-line">{job.description}</p>
          </Card>

          {/* Required Skills */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="success">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Milestones */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Payment Milestones ({job.milestones.length})
            </h2>
            <div className="space-y-3">
              {job.milestones.map((milestone, index) => (
                <div key={milestone.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-brand-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{milestone.name}</h3>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{milestone.status}</Badge>
                      <span className="text-sm font-semibold text-brand-600">{milestone.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Budget</span>
                <span className="text-2xl font-bold text-brand-600">${job.budget} {job.currency}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <Card className="p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-600 mb-1">Total Budget</p>
              <p className="text-3xl font-bold text-brand-600">${job.budget}</p>
              <p className="text-sm text-slate-500">{job.currency}</p>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => setApplyModalOpen(true)}
              disabled={job.status !== 'hiring'}
            >
              {job.status === 'hiring' ? 'Apply for this Job' : 'Not Accepting Applications'}
            </Button>

            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Posted by</span>
                <span className="font-medium text-slate-900">
                  {job.postedByEns || job.postedBy.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Applicants</span>
                <span className="font-medium text-slate-900">{job.applicantCount}</span>
              </div>
              {job.createdAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Posted</span>
                  <span className="font-medium text-slate-900">{job.createdAt}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Project Owner Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">About the Client</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {job.postedByEns ? job.postedByEns[0].toUpperCase() : '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {job.postedByEns || job.postedBy.slice(0, 8)}
                </p>
                <p className="text-sm text-slate-600">Project Owner</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Card>

          {/* Safety Tips */}
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h3 className="text-sm font-bold text-amber-900 mb-2">Safety Tips</h3>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• All payments are held in escrow</li>
              <li>• Milestone-based payments protect you</li>
              <li>• Communicate through the platform</li>
              <li>• Report suspicious activity</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Apply for Job">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the client why you're the right fit for this job..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
              rows={6}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Explain your relevant experience and how you'll complete this project.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> Your profile information will be shared with the client.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApplyModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply} className="flex-1" disabled={!coverLetter.trim()}>
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
