/**
 * Milestone Actions Component - ProjectLance Integration
 *
 * This component provides actions for freelancers to manage milestones:
 * - Submit milestone
 * - Confirm & withdraw milestone (multi-sig)
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  usePLSubmitMilestone,
  usePLWithdrawMilestone,
  usePLMilestone,
  usePLWithdrawalAmounts,
  usePLMilestonePenalty,
  usePLAllMilestones,
} from '@/lib/hooks';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/mockData';
import { showTransactionPending, showTransactionSuccess, showTransactionError } from '@/lib/transactions';

interface MilestoneActionsProps {
  projectId: bigint;
  milestoneIndex: bigint;
  onSubmitted?: () => void;
  onWithdrawn?: () => void;
}

/**
 * Milestone actions component for freelancer
 */
export function MilestoneActions({ projectId, milestoneIndex, onSubmitted, onWithdrawn }: MilestoneActionsProps) {
  const { address, isConnected, chain } = useAccount();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { milestone, isLoading: isMilestoneLoading } = usePLMilestone(projectId, milestoneIndex);
  const { amounts, isLoading: isAmountsLoading } = usePLWithdrawalAmounts(projectId, milestoneIndex);
  const { penalty, isLoading: isPenaltyLoading } = usePLMilestonePenalty(projectId, milestoneIndex);

  const { submit, isPending: isSubmitPending, error: submitError, hash: submitHash, isSuccess: isSubmitSuccess } = usePLSubmitMilestone();
  const { withdraw, isPending: isWithdrawPending, error: withdrawError, hash: withdrawHash, isSuccess: isWithdrawSuccess } = usePLWithdrawMilestone();

  // Handle submit milestone
  const handleSubmit = async () => {
    try {
      const hash = await submit(projectId, milestoneIndex);
      if (hash) {
        showTransactionPending(hash, 'Submit Milestone', chain?.id || 84532);
        onSubmitted?.();
      }
    } catch (error) {
      showTransactionError('0x0', error as Error, 'Failed to submit milestone');
    }
  };

  // Handle withdraw milestone
  const handleWithdraw = async () => {
    try {
      const hash = await withdraw(projectId, milestoneIndex);
      if (hash) {
        showTransactionPending(hash, 'Withdraw Milestone Earnings', chain?.id || 84532);
        setShowConfirmModal(false);
        onWithdrawn?.();
      }
    } catch (error) {
      showTransactionError('0x0', error as Error, 'Failed to withdraw milestone');
    }
  };

  if (isMilestoneLoading || isAmountsLoading || isPenaltyLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!milestone) {
    return <p className="text-sm text-slate-500">Milestone not found</p>;
  }

  const isSubmitted = (milestone as any)?.submissionTime > 0;
  const isAccepted = (milestone as any)?.accepted;
  const isReleased = (milestone as any)?.released;

  // Calculate penalty percentage
  const penaltyPercent: number = penalty ? Number(penalty) / 100 : 0;

  return (
    <div className="space-y-3">
      {/* Milestone Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          isReleased ? 'bg-emerald-100 text-emerald-700' :
          isAccepted ? 'bg-blue-100 text-blue-700' :
          isSubmitted ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {isReleased ? 'Withdrawn' : isAccepted ? 'Approved' : isSubmitted ? 'Submitted' : 'Pending'}
        </span>
      </div>

      {/* Actions */}
      {!isSubmitted && !isAccepted && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitPending || !isConnected}
        >
          {isSubmitPending ? 'Submitting...' : 'Submit Milestone'}
        </Button>
      )}

      {isAccepted && !isReleased && (
        <>
          <Button
            variant="success"
            size="sm"
            className="w-full"
            onClick={() => setShowConfirmModal(true)}
            disabled={isWithdrawPending || !isConnected}
          >
            {isWithdrawPending ? 'Withdrawing...' : 'Confirm & Withdraw'}
          </Button>

          {/* Withdrawal Breakdown */}
          {amounts && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
              <p className="text-xs font-semibold text-emerald-900">Withdrawal Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-600">Vault Amount:</span>
                  <span className="ml-1 font-semibold text-slate-900">
                    {formatCurrency(Number((amounts as any[])?.[0] || 0) / 1e6, 'IDRX')}
                  </span>
                </div>
                {(amounts as any[])?.[1] > 0 && (
                  <div>
                    <span className="text-slate-600">Creator Yield:</span>
                    <span className="ml-1 font-semibold text-emerald-700">
                      {formatCurrency(Number((amounts as any[])?.[1]) / 1e6, 'IDRX')}
                    </span>
                  </div>
                )}
                {(amounts as any[])?.[2] > 0 && (
                  <div>
                    <span className="text-slate-600">Platform Fee:</span>
                    <span className="ml-1 font-semibold text-slate-700">
                      {formatCurrency(Number((amounts as any[])?.[2]) / 1e6, 'IDRX')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-600">FL Yield:</span>
                  <span className="ml-1 font-semibold text-emerald-700">
                    {formatCurrency(Number((amounts as any[])?.[3] || 0) / 1e6, 'IDRX')}
                  </span>
                </div>
              </div>
              {penaltyPercent > 0 && (
                <div className="pt-2 border-t border-emerald-300">
                  <span className="text-xs text-red-700">
                    Late penalty: {penaltyPercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isReleased && (
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs text-emerald-800">
            Milestone funds have been withdrawn.
          </p>
        </div>
      )}

      {/* Confirm Withdrawal Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Withdrawal</h3>
            <p className="text-sm text-slate-600">
              By confirming, you will withdraw your milestone earnings. This action cannot be undone.
            </p>
            {(amounts as any[] | undefined) && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <p className="text-sm font-semibold text-slate-900">You will receive:</p>
                <p className="text-xs text-slate-700">
                  Vault: {formatCurrency(Number((amounts as any[])?.[0] || 0) / 1e6, 'IDRX')} IDRX
                </p>
                <p className="text-xs text-emerald-700">
                  Yield: {formatCurrency(Number((amounts as any[])?.[3] || 0) / 1e6, 'IDRX')} IDRX
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleWithdraw}
                disabled={isWithdrawPending}
              >
                {isWithdrawPending ? 'Withdrawing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Milestone list component for project detail page
 */
interface MilestoneListProps {
  projectId: bigint;
  onAction?: () => void;
}

export function MilestoneList({ projectId, onAction }: MilestoneListProps) {
  const { milestones, isLoading, refetch } = usePLAllMilestones(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!milestones || (milestones as any[]).length === 0) {
    return <p className="text-center text-slate-500 py-4">No milestones found</p>;
  }

  return (
    <div className="space-y-3">
      {(milestones as any[]).map((m: any, index: number) => {
        const milestoneIndex = BigInt(index);
        const isLast = m.isLastMilestone;
        const percentage = Number(m.percentage) / 100;

        return (
          <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  m.released ? 'bg-emerald-100 text-emerald-700' :
                  m.accepted ? 'bg-blue-100 text-blue-700' :
                  m.submissionTime > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Milestone {index + 1}</p>
                  <p className="text-sm text-slate-600">
                    {percentage}% {isLast && '(includes LP + Yield)'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                m.released ? 'bg-emerald-100 text-emerald-700' :
                m.accepted ? 'bg-blue-100 text-blue-700' :
                m.submissionTime > 0 ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {m.released ? 'Withdrawn' : m.accepted ? 'Approved' : m.submissionTime > 0 ? 'Submitted' : 'Pending'}
              </span>
            </div>

            {/* Actions */}
            <MilestoneActions
              projectId={projectId}
              milestoneIndex={milestoneIndex}
              onSubmitted={refetch}
              onWithdrawn={() => {
                refetch();
                onAction?.();
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
