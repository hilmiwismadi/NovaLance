'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useSubmitKPI, useApproveKPI } from '@/lib/hooks';
import { type KPI } from '@/lib/mockData';
import {
  showInfo,
  showSuccess,
  showError,
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
} from '@/lib/transactions';
import { useAccount } from 'wagmi';
import { useTransactionWait } from '@/lib/hooks';

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roleId: string;
  roleTitle: string;
  roleBudget: number;
  kpi: KPI;
  currency?: string;
  onSuccess?: () => void;
}

export default function KPIDetailModal({
  isOpen,
  onClose,
  projectId,
  roleId,
  roleTitle,
  roleBudget,
  kpi,
  currency = 'IDRX',
  onSuccess,
}: KPIDetailModalProps) {
  const { address, chain } = useAccount();
  const [links, setLinks] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart contract hooks
  const { submit: submitKPI, isPending: isSubmitPending, error: submitError, hash: submitHash, isSuccess: isSubmitSuccess } = useSubmitKPI();
  const { approve: approveKPIContract, isPending: isApprovePending, error: approveError, hash: approveHash, isSuccess: isApproveSuccess } = useApproveKPI();
  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } = useTransactionWait(submitHash);
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash);

  const kpiAmount = (roleBudget * kpi.percentage) / 100;
  const canSubmit = kpi.status === 'in-progress' || kpi.status === 'rejected';
  const isPendingApproval = kpi.status === 'pending-approval';
  const needsFLConfirmation = kpi.poApproved && !kpi.flApproved;
  const isFullyApproved = kpi.poApproved && kpi.flApproved;

  // Handle submit transaction success
  if (isSubmitSuccess && submitHash && !isSubmitting) {
    showTransactionPending(submitHash, 'Submit KPI for Approval', chain?.id || 84532);
    setIsSubmitting(true);
  }

  // Handle submit transaction confirmation
  if (isSubmitConfirmed && submitHash && isSubmitting) {
    showTransactionSuccess(submitHash, 'KPI submitted for approval!');
    setIsSubmitting(false);
    setLinks('');
    setDescription('');
    onSuccess?.();
    onClose();
  }

  // Handle submit transaction error
  if (submitError) {
    showTransactionError(submitHash || '0x0', submitError, 'Failed to submit KPI');
    setIsSubmitting(false);
  }

  // Handle approve transaction success
  if (isApproveSuccess && approveHash && !isSubmitting) {
    showTransactionPending(approveHash, 'Confirm KPI Completion', chain?.id || 84532);
    setIsSubmitting(true);
  }

  // Handle approve transaction confirmation
  if (isApproveConfirmed && approveHash && isSubmitting) {
    showTransactionSuccess(approveHash, 'KPI confirmed! Payment released.');
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  }

  // Handle approve transaction error
  if (approveError) {
    showTransactionError(approveHash || '0x0', approveError, 'Failed to confirm KPI');
    setIsSubmitting(false);
  }

  const handleSubmit = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to submit KPI');
      return;
    }

    if (!description.trim()) {
      showError('Description Required', 'Please provide a description of your work');
      return;
    }

    try {
      showInfo('Submitting KPI', 'Preparing transaction...');

      const linksArray = links
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      await submitKPI({
        projectId: projectId as `0x${string}`,
        kpiId: kpi.id as `0x${string}`,
        deliverables: {
          links: linksArray,
          description: description.trim(),
        },
      });
    } catch (err) {
      const error = err as Error;
      showTransactionError(submitHash || '0x0', error, 'Failed to submit');
    }
  };

  const handleConfirmApproval = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to confirm');
      return;
    }

    try {
      showInfo('Confirming KPI', 'Processing confirmation...');

      await approveKPIContract({
        projectId: projectId as `0x${string}`,
        kpiId: kpi.id as `0x${string}`,
        isPO: false, // This is FL confirmation
      });
    } catch (err) {
      const error = err as Error;
      showTransactionError(approveHash || '0x0', error, 'Failed to confirm');
    }
  };

  const getStatusBadge = () => {
    if (isFullyApproved) return <Badge variant="success">Approved & Paid</Badge>;
    if (needsFLConfirmation) return <Badge variant="warning">Awaiting Your Confirmation</Badge>;
    if (isPendingApproval) return <Badge variant="warning">Pending PO Review</Badge>;
    if (kpi.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    if (kpi.status === 'in-progress') return <Badge variant="default">In Progress</Badge>;
    return <Badge variant="default">{kpi.status}</Badge>;
  };

  const getActionButton = () => {
    const loading = isSubmitPending || isSubmitConfirming || isApprovePending || isApproveConfirming;

    if (isFullyApproved) {
      return (
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <svg className="w-12 h-12 text-emerald-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-emerald-800">KPI Approved & Payment Released</p>
        </div>
      );
    }

    if (needsFLConfirmation) {
      return (
        <Button
          variant="success"
          onClick={handleConfirmApproval}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Confirming...
            </span>
          ) : (
            'Confirm Completion & Release Payment'
          )}
        </Button>
      );
    }

    if (isPendingApproval) {
      return (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 text-center">
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Waiting for Project Owner to review your submission
          </p>
        </div>
      );
    }

    if (kpi.status === 'rejected') {
      return (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Submission Rejected</p>
            {kpi.rejectionReason && (
              <p className="text-xs text-red-700">Reason: {kpi.rejectionReason}</p>
            )}
            <p className="text-xs text-red-600 mt-2">Please make corrections and resubmit.</p>
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting...
              </span>
            ) : (
              'Resubmit for Approval'
            )}
          </Button>
        </div>
      );
    }

    if (canSubmit) {
      return (
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit for Approval'
          )}
        </Button>
      );
    }

    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KPI Details">
      <div className="space-y-4">
        {/* KPI Info */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{kpi.name}</h3>
              <p className="text-xs text-slate-500">{roleTitle}</p>
            </div>
            {getStatusBadge()}
          </div>

          {kpi.description && (
            <p className="text-sm text-slate-600">{kpi.description}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Payment</p>
              <p className="font-semibold text-brand-600">
                <CurrencyDisplay amount={kpiAmount.toLocaleString()} currency={currency} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Percentage</p>
              <p className="font-semibold text-slate-900">{kpi.percentage}%</p>
            </div>
          </div>

          {kpi.deadline && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {new Date(kpi.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Approval Status */}
        {(kpi.poApproved !== undefined || kpi.flApproved !== undefined) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Approval Status</p>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex items-center gap-2">
                {kpi.poApproved ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                )}
                <span>Project Owner: {kpi.poApproved ? 'Approved' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                {kpi.flApproved ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                )}
                <span>Freelancer (You): {kpi.flApproved ? 'Confirmed' : 'Pending'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deliverables Form - Show when can submit or resubmit */}
        {(canSubmit || kpi.status === 'rejected') && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deliverable Links (optional)
              </label>
              <textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="Enter one link per line&#10;https://github.com/...&#10;https://demo.example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">GitHub links, demos, screenshots, etc.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description of Work *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you've accomplished for this KPI..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                rows={4}
                required
              />
            </div>

            {/* Show previous submission if exists */}
            {kpi.deliverables && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-700 mb-2">Previous Submission:</p>
                {kpi.deliverables.links.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">Links:</p>
                    {kpi.deliverables.links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-600 hover:underline truncate">
                        {link}
                      </a>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600 mb-1">Description:</p>
                  <p className="text-xs text-slate-700">{kpi.deliverables.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {getActionButton()}

        {/* Close button if no action needed */}
        {!canSubmit && !isPendingApproval && !needsFLConfirmation && kpi.status !== 'rejected' && !isFullyApproved && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </div>
    </Modal>
  );
}
