'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { mockProjects, getProjectById, mockApplications } from '@/lib/mockData';

export default function POJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  const projectId = params.id as string;
  const project = getProjectById(projectId);

  // Mock applications for this job
  const applications = mockApplications.filter(app => app.jobId === projectId);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h1>
        <p className="text-slate-600 mb-6">The job you're looking for doesn't exist.</p>
        <Link href="/PO/jobs">
          <Button variant="primary">Back to My Jobs</Button>
        </Link>
      </div>
    );
  }

  const completedMilestones = project.milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
  const progressPercentage = (completedMilestones / project.milestones.length) * 100;

  const handleDeposit = () => {
    // TODO: Implement deposit logic
    console.log('Depositing:', depositAmount);
    setDepositModalOpen(false);
    setDepositAmount('');
  };

  const handleApproveMilestone = () => {
    // TODO: Implement approval logic
    console.log('Approving milestone:', selectedMilestone);
    setApproveModalOpen(false);
    setSelectedMilestone(null);
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'completed': return 'warning';
      case 'in-progress': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/PO/jobs">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
              {project.status}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">{project.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Milestones</h2>
            <div className="space-y-4">
              {project.milestones.map((milestone, index) => (
                <div key={milestone.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{milestone.name}</h3>
                        {milestone.description && (
                          <p className="text-sm text-slate-600">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getMilestoneStatusColor(milestone.status)}>
                        {milestone.status}
                      </Badge>
                      <span className="text-sm text-slate-600">{milestone.percentage}%</span>
                    </div>
                  </div>

                  {/* Milestone Actions */}
                  {milestone.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setSelectedMilestone(milestone.id);
                          setApproveModalOpen(true);
                        }}
                      >
                        Approve & Release Payment
                      </Button>
                    </div>
                  )}

                  {milestone.status === 'pending' && project.freelancer && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        Waiting for freelancer to complete this milestone
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Overall Progress</span>
                <span className="font-medium text-slate-900">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Freelancer Applications */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Applications {applications.length > 0 && `(${applications.length})`}
            </h2>

            {applications.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {application.applicantEns || application.applicantAddress.slice(0, 8)}
                          </h3>
                          <Badge variant={application.status === 'accepted' ? 'success' : application.status === 'pending' ? 'warning' : 'error'}>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{application.coverLetter}</p>
                        <p className="text-xs text-slate-500 mt-2">Applied: {application.appliedAt}</p>
                      </div>
                      {application.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="success" size="sm">
                            Accept
                          </Button>
                          <Button variant="destructive" size="sm">
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Budget & Payments</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Budget</span>
                <span className="font-semibold text-slate-900">${project.totalBudget} {project.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Escrowed</span>
                <span className="font-semibold text-brand-600">${project.totalBudget} {project.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Released</span>
                <span className="font-semibold text-emerald-600">
                  ${Math.round(project.totalBudget * (completedMilestones / project.milestones.length))} {project.currency}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={() => setDepositModalOpen(true)}
            >
              Deposit Funds
            </Button>
          </Card>

          {/* Freelancer Info */}
          {project.freelancerEns ? (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Freelancer</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {project.freelancerEns[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{project.freelancerEns}</p>
                  <p className="text-sm text-slate-600">
                    {project.freelancer?.slice(0, 8)}...{project.freelancer?.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Message
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Freelancer</h3>
              <p className="text-slate-600 text-center py-4">No freelancer assigned yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit Funds">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount ({project.currency})
            </label>
            <Input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Funds will be held in escrow until milestones are completed and approved.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDepositModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeposit} className="flex-1">
              Deposit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Milestone Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Approve Milestone">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to approve this milestone and release the payment?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. Payment will be released to the freelancer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={handleApproveMilestone} className="flex-1">
              Approve & Release
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
