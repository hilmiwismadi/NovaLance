'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useApproveKPI } from '@/lib/hooks';
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

interface KPIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roleTitle: string;
  roleBudget: number;
  kpi: KPI;
  freelancerEns?: string;
  currency?: string;
  onSuccess?: () => void;
}

export default function KPIReviewModal({
  isOpen,
  onClose,
  projectId,
  roleTitle,
  roleBudget,
  kpi,
  freelancerEns,
  currency = 'IDRX',
  onSuccess,
}: KPIReviewModalProps) {
  const { address, chain } = useAccount();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Smart contract hooks
  const { approve: approveKPIContract, isPending: isApprovePending, error: approveError, hash: approveHash, isSuccess: isApproveSuccess } = useApproveKPI();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash);

  const kpiAmount = (roleBudget * kpi.percentage) / 100;

  // Handle approve transaction success
  if (isApproveSuccess && approveHash && !isProcessing) {
    showTransactionPending(approveHash, 'Approve KPI', chain?.id || 84532);
    setIsProcessing(true);
  }

  // Handle approve transaction confirmation
  if (isApproveConfirmed && approveHash && isProcessing) {
    showTransactionSuccess(approveHash, 'KPI approved! Freelancer will be notified to confirm.');
    setIsProcessing(false);
    setShowRejectForm(false);
    setRejectionReason('');
    onSuccess?.();
    onClose();
  }

  // Handle approve transaction error
  if (approveError) {
    showTransactionError(approveHash || '0x0', approveError, 'Failed to approve KPI');
    setIsProcessing(false);
  }

  const handleApprove = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to approve KPIs');
      return;
    }

    try {
      showInfo('Approving KPI', 'Processing approval...');

      await approveKPIContract({
        projectId: projectId as `0x${string}`,
        kpiId: kpi.id as `0x${string}`,
        isPO: true, // This is PO approval
      });
    } catch (err) {
      const error = err as Error;
      showTransactionError(approveHash || '0x0', error, 'Failed to approve KPI');
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      showError('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    // In a real implementation, this would call a rejectKPI function
    // For now, we'll show a success message and close
    showSuccess('KPI Rejected', `Freelancer will be notified with the reason.`);
    setShowRejectForm(false);
    setRejectionReason('');
    onSuccess?.();
    onClose();
  };

  const loading = isApprovePending || isApproveConfirming;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review KPI Submission">
      <div className="space-y-4">
        {/* KPI Info */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{kpi.name}</h3>
              <p className="text-xs text-slate-500">{roleTitle}</p>
            </div>
            <Badge variant="warning">Needs Review</Badge>
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

          {freelancerEns && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{freelancerEns[0]}</span>
              </div>
              <span className="text-sm text-slate-700">Submitted by {freelancerEns}</span>
            </div>
          )}
        </div>

        {/* Freelancer's Deliverables */}
        {kpi.deliverables && (
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <p className="text-sm font-medium text-brand-900 mb-3">Deliverables Submitted</p>

            {kpi.deliverables.links.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-brand-700 mb-2">Links:</p>
                <div className="space-y-1">
                  {kpi.deliverables.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-brand-600 hover:text-brand-800 hover:underline truncate bg-white px-2 py-1.5 rounded border border-brand-200"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-brand-700 mb-1">Description:</p>
              <p className="text-sm text-brand-900 bg-white p-2 rounded border border-brand-200">
                {kpi.deliverables.description}
              </p>
            </div>

            {kpi.submittedAt && (
              <p className="text-xs text-brand-600 mt-2">
                Submitted: {new Date(kpi.submittedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Yield Distribution Preview */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-900 mb-3">Yield Distribution Preview</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-emerald-700">Base Payment (Escrow):</span>
              <span className="font-semibold text-emerald-900">
                <CurrencyDisplay amount={kpiAmount.toLocaleString()} currency={currency} />
              </span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>Estimated Yield (LP):</span>
              <span className="font-semibold">Variable (-5% to +15%)</span>
            </div>
            <div className="border-t border-emerald-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-emerald-700">Your Share (40% of yield):</span>
                <span className="font-semibold text-emerald-900">Your earnings</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">FL Share (40% of yield):</span>
                <span className="font-semibold text-emerald-900">Freelancer bonus</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Platform Fee (20% of yield):</span>
                <span className="font-semibold text-emerald-900">NovaLance fee</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-3">
            Note: Yield will be distributed after freelancer confirms approval. Negative yield is borne by freelancer.
          </p>
        </div>

        {/* Approval Status */}
        {(kpi.poApproved !== undefined || kpi.flApproved !== undefined) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Multi-Signature Status</p>
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
                <span>Project Owner (You): {kpi.poApproved ? 'Approved' : 'Pending'}</span>
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
                <span>Freelancer: {kpi.flApproved ? 'Confirmed' : 'Pending your approval'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Warning about multi-sig */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Multi-Signature Required:</strong> After you approve, the freelancer must also confirm before payment is released.
          </p>
        </div>

        {/* Action Buttons */}
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(true)}
              disabled={loading}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              Reject
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Approving...
                </span>
              ) : (
                'Approve'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this submission needs revisions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none text-sm"
                rows={3}
                autoFocus
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-800">
                The freelancer will be notified and can resubmit after making the requested changes.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {!showRejectForm && (
          <Button variant="ghost" onClick={onClose} className="w-full" disabled={loading}>
            Close
          </Button>
        )}
      </div>
    </Modal>
  );
}
