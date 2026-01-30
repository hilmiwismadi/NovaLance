'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import Modal from '@/components/ui/Modal';
import { getProjectById, getPOProjectById, formatCurrency } from '@/lib/mockData';
import { useSubmitKPI, useApproveKPI } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showError,
} from '@/lib/transactions';
import { useAccount } from 'wagmi';
import { useTransactionWait } from '@/lib/hooks';

export default function FLProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Milestone/KPI Modal state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [deliverables, setDeliverables] = useState({
    links: '',
    description: '',
  });

  // Smart contract hooks
  const { submit: submitKPI, isPending: isSubmitPending, error: submitError, hash: submitHash, isSuccess: isSubmitSuccess } = useSubmitKPI();
  const { approve: approveKPIContract, isPending: isApprovePending, error: approveError, hash: approveHash, isSuccess: isApproveSuccess } = useApproveKPI();
  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } = useTransactionWait(submitHash);
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash);

  const projectId = params.id as string;

  // Try both legacy project and PO project
  const legacyProject = getProjectById(projectId);
  const poProject = getPOProjectById(projectId);

  // Determine which project type we're viewing
  const project = legacyProject || poProject;
  const isPOProject = !!poProject;

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Handle submit transaction
  useEffect(() => {
    if (isSubmitSuccess && submitHash) {
      showTransactionPending(submitHash, 'Submit Milestone', chain?.id || 84532);
    }
  }, [isSubmitSuccess, submitHash, chain]);

  useEffect(() => {
    if (isSubmitConfirmed && submitHash) {
      showTransactionSuccess(submitHash, 'Milestone submitted successfully!');
      setMilestoneModalOpen(false);
      setDeliverables({ links: '', description: '' });
    }
  }, [isSubmitConfirmed, submitHash]);

  useEffect(() => {
    if (submitError) {
      showTransactionError(submitHash || '0x0', submitError, 'Failed to submit milestone');
    }
  }, [submitError, submitHash]);

  // Handle approve transaction
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      showTransactionPending(approveHash, 'Confirm Milestone', chain?.id || 84532);
    }
  }, [isApproveSuccess, approveHash, chain]);

  useEffect(() => {
    if (isApproveConfirmed && approveHash) {
      showTransactionSuccess(approveHash, 'Milestone confirmed successfully!');
      setMilestoneModalOpen(false);
      setSelectedMilestone(null);
    }
  }, [isApproveConfirmed, approveHash]);

  useEffect(() => {
    if (approveError) {
      showTransactionError(approveHash || '0x0', approveError, 'Failed to confirm milestone');
    }
  }, [approveError, approveHash]);

  const handleSubmitMilestone = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    if (!selectedMilestone) return;

    try {
      showInfo('Submitting Milestone', 'Please confirm the transaction...');

      const linksArray = deliverables.links.split('\n').filter((l: string) => l.trim());

      await submitKPI({
        projectId: projectId as `0x${string}`,
        kpiId: selectedMilestone.id as `0x${string}`,
        deliverables: {
          links: linksArray,
          description: deliverables.description,
        },
      });
    } catch (err) {
      const error = err as Error;
      showTransactionError(submitHash || '0x0', error, 'Failed to submit');
    }
  };

  const handleConfirmMilestone = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    if (!selectedMilestone) return;

    try {
      showInfo('Confirming Milestone', 'Please confirm the transaction...');

      await approveKPIContract({
        projectId: projectId as `0x${string}`,
        kpiId: selectedMilestone.id as `0x${string}`,
        isPO: false, // FL confirmation
      });
    } catch (err) {
      const error = err as Error;
      showTransactionError(approveHash || '0x0', error, 'Failed to confirm');
    }
  };

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-slate-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/FL/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // For legacy projects (with milestones)
  if (!isPOProject) {
    const completedMilestones = project.milestones.filter((m: any) => m.status === 'approved' || m.status === 'completed').length;
    const progress = Math.round((completedMilestones / project.milestones.length) * 100);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/FL/projects">
            <Button variant="ghost" size="sm" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
        </div>

        {/* Project Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                <Badge variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
                  {project.status === 'in-progress' ? 'Active' : project.status}
                </Badge>
              </div>
              <p className="text-slate-600">{project.description}</p>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <span className="text-sm font-bold text-brand-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {completedMilestones} of {project.milestones.length} milestones completed
            </p>
          </div>

          {/* Budget */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Budget</span>
            <span className="text-lg font-bold text-brand-600">
              <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
            </span>
          </div>

          {/* Client Info */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">Client</span>
            <p className="text-sm font-medium text-slate-900 mt-1">
              {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
            </p>
          </div>
        </Card>

        {/* Milestones */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Milestones</h2>
          <div className="space-y-4">
            {project.milestones.map((milestone: any, index: number) => {
              const isCompleted = milestone.status === 'approved' || milestone.status === 'completed';
              const isInProgress = milestone.status === 'in-progress';
              const isPending = milestone.status === 'pending';
              const isClickable = isInProgress || isCompleted;

              return (
                <div
                  key={milestone.id}
                  onClick={() => {
                    if (isClickable) {
                      setSelectedMilestone(milestone);
                      setMilestoneModalOpen(true);
                    }
                  }}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    isClickable ? 'cursor-pointer hover:shadow-md hover:border-brand-300' : ''
                  } ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : isInProgress
                      ? 'border-brand-200 bg-brand-50/50'
                      : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isInProgress
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-300 text-slate-600'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{milestone.name}</h3>
                          <Badge
                            variant={
                              isCompleted
                                ? 'success'
                                : isInProgress
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {milestone.status}
                          </Badge>
                          <span className="text-sm font-medium text-slate-700">{milestone.percentage}%</span>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-slate-600">{milestone.description}</p>
                        )}

                        {/* Click indicator */}
                        {isClickable && (
                          <div className="flex items-center gap-1 text-brand-600 text-xs mt-2">
                            <span>
                              {isCompleted ? 'Click to confirm & release payment' : 'Click to submit work'}
                            </span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Milestone budget */}
                  <div className="ml-11 text-sm text-slate-600">
                    <CurrencyDisplay
                      amount={formatCurrency(
                        (project.totalBudget * milestone.percentage) / 100,
                        project.currency
                      )}
                      currency={project.currency}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Milestone Modal */}
        <Modal
          isOpen={milestoneModalOpen}
          onClose={() => {
            setMilestoneModalOpen(false);
            setSelectedMilestone(null);
            setDeliverables({ links: '', description: '' });
          }}
          title={selectedMilestone?.name || 'Milestone Details'}
        >
          {selectedMilestone && (
            <div className="space-y-4">
              {/* Milestone Info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedMilestone.name}</h3>
                  <p className="text-xs text-slate-500">{project.title}</p>
                </div>

                {selectedMilestone.description && (
                  <p className="text-sm text-slate-600">{selectedMilestone.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500">Payment</p>
                    <p className="font-semibold text-brand-600">
                      <CurrencyDisplay
                        amount={formatCurrency(
                          (project.totalBudget * selectedMilestone.percentage) / 100,
                          project.currency
                        )}
                        currency={project.currency}
                      />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Percentage</p>
                    <p className="font-semibold text-slate-900">{selectedMilestone.percentage}%</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <Badge
                  variant={
                    selectedMilestone.status === 'approved' || selectedMilestone.status === 'completed'
                      ? 'success'
                      : selectedMilestone.status === 'in-progress'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {selectedMilestone.status === 'completed' ? 'Ready for Confirmation' : selectedMilestone.status}
                </Badge>
              </div>

              {/* In-progress: Submit form */}
              {selectedMilestone.status === 'in-progress' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Deliverable Links (optional)
                    </label>
                    <textarea
                      value={deliverables.links}
                      onChange={(e) => setDeliverables({ ...deliverables, links: e.target.value })}
                      placeholder="Enter one link per line&#10;https://github.com/...&#10;https://demo.example.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description of Work *
                    </label>
                    <textarea
                      value={deliverables.description}
                      onChange={(e) => setDeliverables({ ...deliverables, description: e.target.value })}
                      placeholder="Describe what you've accomplished for this milestone..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSubmitMilestone}
                    disabled={!deliverables.description.trim() || isSubmitPending || isSubmitConfirming}
                    className="w-full"
                  >
                    {isSubmitPending || isSubmitConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit for Approval'
                    )}
                  </Button>
                </div>
              )}

              {/* Completed: Confirm button */}
              {selectedMilestone.status === 'completed' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Project owner has marked this milestone as complete. Please confirm to release payment.
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-800 font-medium mb-2">Payment to be released:</p>
                    <p className="text-lg font-bold text-emerald-900">
                      <CurrencyDisplay
                        amount={formatCurrency(
                          (project.totalBudget * selectedMilestone.percentage) / 100,
                          project.currency
                        )}
                        currency={project.currency}
                      />
                    </p>
                  </div>

                  <Button
                    variant="success"
                    onClick={handleConfirmMilestone}
                    disabled={isApprovePending || isApproveConfirming}
                    className="w-full"
                  >
                    {isApprovePending || isApproveConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Confirming...
                      </span>
                    ) : (
                      'Confirm Completion & Release Payment'
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  setMilestoneModalOpen(false);
                  setSelectedMilestone(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // For PO Projects (with KPIs) - Use the existing KPIDetailModal
  // Import it dynamically here
  const KPIDetailModal = require('@/components/fl/KPIDetailModal').default;

  const assignedRoles = poProject.roles.filter((r: any) =>
    r.assignedTo && r.assignedTo.toLowerCase() === '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase()
  );

  if (assignedRoles.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Not Assigned</h1>
        <p className="text-slate-600 mb-6">You are not assigned to this project.</p>
        <Link href="/FL/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // ... rest of PO project rendering would go here
  // For now, redirect to projects page if PO project
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">PO Project View</h1>
      <p className="text-slate-600 mb-6">This project uses the new KPI system. Please view from the main projects page.</p>
      <Link href="/FL/projects">
        <Button variant="primary">Back to Projects</Button>
      </Link>
    </div>
  );
}
