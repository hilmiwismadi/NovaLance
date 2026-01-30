'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { mockPOProjects, formatCurrency } from '@/lib/mockData';
import { useSubmitKPI, useApproveKPI, useTransactionWait } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showError,
} from '@/lib/transactions';

// Filter projects where user has active roles
const activeJobs = mockPOProjects.filter(p =>
  p.roles.some(r => r.assignedTo && r.assignedTo.toLowerCase() === '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase() && (r.status === 'in-progress' || r.status === 'hiring'))
);

export default function FLActiveJobsPage() {
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<{
    project: typeof mockPOProjects[0];
    role: typeof mockPOProjects[0]['roles'][0];
    kpi: typeof mockPOProjects[0]['roles'][0]['kpis'][0];
  } | null>(null);
  const [deliverables, setDeliverables] = useState({
    links: '',
    description: '',
  });

  // Smart contract hooks
  const { submit: submitKPI, isPending: isSubmitPending, error: submitError, hash: submitHash, isSuccess: isSubmitSuccess } = useSubmitKPI();
  const { approve: approveKPIContract, isPending: isApprovePending, error: approveError, hash: approveHash, isSuccess: isApproveSuccess } = useApproveKPI();
  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } = useTransactionWait(submitHash ?? undefined);
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash ?? undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle submit KPI transaction
  useEffect(() => {
    if (isSubmitSuccess && submitHash) {
      showTransactionPending(submitHash, 'Submit KPI Completion', chain?.id || 84532);
    }
  }, [isSubmitSuccess, submitHash, chain]);

  useEffect(() => {
    if (isSubmitConfirmed && submitHash) {
      showTransactionSuccess(submitHash, 'KPI submitted for approval!');
      setSubmitModalOpen(false);
      setDeliverables({ links: '', description: '' });
    }
  }, [isSubmitConfirmed, submitHash]);

  useEffect(() => {
    if (submitError) {
      showTransactionError(submitHash || '0x0', submitError, 'Failed to submit KPI');
    }
  }, [submitError, submitHash]);

  // Handle approve KPI transaction (FL side)
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      showTransactionPending(approveHash, 'Confirm KPI Completion', chain?.id || 84532);
    }
  }, [isApproveSuccess, approveHash, chain]);

  useEffect(() => {
    if (isApproveConfirmed && approveHash) {
      showTransactionSuccess(approveHash, 'KPI confirmed successfully!');
      setApproveModalOpen(false);
      setSelectedKPI(null);
    }
  }, [isApproveConfirmed, approveHash]);

  useEffect(() => {
    if (approveError) {
      showTransactionError(approveHash || '0x0', approveError, 'Failed to confirm KPI');
    }
  }, [approveError, approveHash]);

  const handleSubmitKPI = async () => {
    if (!address || !chain || !selectedKPI) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    try {
      showInfo('Submitting KPI', 'Please confirm the transaction...');

      const linksArray = deliverables.links.split('\n').filter(l => l.trim());

      await submitKPI({
        projectId: selectedKPI.project.id as `0x${string}`,
        kpiId: selectedKPI.kpi.id as `0x${string}`,
        deliverables: {
          links: linksArray,
          description: deliverables.description,
        },
      });
    } catch (err) {
      const error = err as Error;
      showError('Submission Failed', error.message);
    }
  };

  const handleConfirmKPI = async () => {
    if (!address || !chain || !selectedKPI) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    try {
      showInfo('Confirming KPI', 'Please confirm the transaction...');

      await approveKPIContract({
        projectId: selectedKPI.project.id as `0x${string}`,
        kpiId: selectedKPI.kpi.id as `0x${string}`,
        isPO: false, // This is FL approval
      });
    } catch (err) {
      const error = err as Error;
      showError('Confirmation Failed', error.message);
    }
  };

  if (!mounted) return null;

  if (activeJobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Active Jobs</h1>
          <p className="text-slate-600 mt-2">Manage your ongoing work</p>
        </div>

        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Active Jobs</h2>
          <p className="text-slate-600 mb-6">You don't have any active jobs yet.</p>
          <Link href="/FL/jobs">
            <Button variant="primary">Browse Jobs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Active Jobs</h1>
        <p className="text-slate-600 mt-2">Manage your ongoing work and submit KPIs</p>
      </div>

      {/* Active Jobs List */}
      <div className="space-y-6">
        {activeJobs.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            {/* Project Header */}
            <div className="p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
                  <p className="text-slate-600 mt-1">{project.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm font-semibold text-brand-600 inline-flex items-center gap-1">
                      Budget: <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
                    </span>
                  </div>
                </div>
                <Badge variant="warning">In Progress</Badge>
              </div>
            </div>

            {/* Roles */}
            <div className="divide-y divide-slate-200">
              {project.roles
                .filter(r => r.assignedTo && r.status === 'in-progress')
                .map((role) => {
                  const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
                  const totalKPIs = role.kpis.length;
                  const progress = (completedKPIs / totalKPIs) * 100;

                  return (
                    <div key={role.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{role.title}</h3>
                          <p className="text-sm text-slate-600">{role.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-brand-600">{Math.round(progress)}%</p>
                          <p className="text-xs text-slate-500">{completedKPIs}/{totalKPIs} KPIs</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* KPIs List */}
                      <div className="space-y-3">
                        {role.kpis.map((kpi) => {
                          const isInProgress = kpi.status === 'in-progress';
                          const isPending = kpi.status === 'pending';
                          const isCompleted = kpi.status === 'completed';
                          const isApproved = kpi.status === 'approved';

                          return (
                            <div
                              key={kpi.id}
                              className={`border rounded-lg p-4 ${
                                isApproved ? 'bg-emerald-50 border-emerald-200' :
                                isCompleted ? 'bg-amber-50 border-amber-200' :
                                isInProgress ? 'bg-brand-50 border-brand-200' :
                                'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-slate-900">{kpi.name}</h4>
                                    <Badge variant={isApproved ? 'success' : isCompleted ? 'warning' : isInProgress ? 'primary' : 'default'} className="text-xs">
                                      {kpi.status}
                                    </Badge>
                                    <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full">
                                      {kpi.percentage}%
                                    </span>
                                  </div>
                                  {kpi.description && (
                                    <p className="text-sm text-slate-600">{kpi.description}</p>
                                  )}
                                  {kpi.deadline && (
                                    <p className="text-xs text-slate-500 mt-2">Deadline: {new Date(kpi.deadline).toLocaleDateString()}</p>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 ml-4">
                                  {isInProgress && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedKPI({ project, role, kpi });
                                        setSubmitModalOpen(true);
                                      }}
                                    >
                                      Submit Work
                                    </Button>
                                  )}
                                  {isCompleted && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedKPI({ project, role, kpi });
                                        setApproveModalOpen(true);
                                      }}
                                    >
                                      Confirm
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Yield info for approved KPIs */}
                              {isApproved && kpi.yield !== undefined && (
                                <div className="mt-3 pt-3 border-t border-emerald-200">
                                  <div className={`flex items-center gap-2 ${kpi.yield >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">
                                      {kpi.yield >= 0 ? '+' : ''}{kpi.yield.toFixed(2)}% yield earned
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit KPI Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Submit KPI Completion">
        <div className="space-y-4">
          {selectedKPI && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-900">{selectedKPI.kpi.name}</p>
              <p className="text-sm text-slate-600">{selectedKPI.project.title}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Deliverable Links *
            </label>
            <textarea
              value={deliverables.links}
              onChange={(e) => setDeliverables({ ...deliverables, links: e.target.value })}
              placeholder="Enter links to your work (one per line)&#10;https://github.com/...&#10;https://demo.example.com/..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
              rows={4}
              required
            />
            <p className="text-xs text-slate-500 mt-1">Add URLs to your work (GitHub, demo, docs, etc.)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              value={deliverables.description}
              onChange={(e) => setDeliverables({ ...deliverables, description: e.target.value })}
              placeholder="Describe what you've accomplished..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> After submission, the project owner will review your work. Once both you and the PO approve, payment will be released.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setSubmitModalOpen(false)} className="flex-1" disabled={isSubmitPending || isSubmitConfirming}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitKPI} className="flex-1" disabled={!deliverables.links.trim() || !deliverables.description.trim() || isSubmitPending || isSubmitConfirming}>
              {isSubmitPending || isSubmitConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit for Review'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm KPI Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Confirm KPI Completion">
        <div className="space-y-4">
          {selectedKPI && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-900">{selectedKPI.kpi.name}</p>
              <p className="text-sm text-slate-600">{selectedKPI.project.title} • {selectedKPI.role.title}</p>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-800">
              By confirming, you agree that the work has been completed satisfactorily. This will trigger the payment release process.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Both you and the project owner must approve before payment is released. Make sure you've reviewed the work thoroughly.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)} className="flex-1" disabled={isApprovePending || isApproveConfirming}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirmKPI} className="flex-1" disabled={isApprovePending || isApproveConfirming}>
              {isApprovePending || isApproveConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Confirming...
                </span>
              ) : (
                'Confirm Completion'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
