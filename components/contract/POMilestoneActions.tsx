/**
 * PO Milestone Actions Component - ProjectLance Integration
 *
 * This component provides actions for project owners to manage milestones:
 * - Accept milestone
 * - View withdrawal breakdown
 * - Deposit funds
 * - Accept freelancer
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  usePLAcceptMilestone,
  usePLDepositFunds,
  usePLAcceptFreelancer,
  usePLMilestone,
  usePLWithdrawalAmounts,
  usePLMilestonePenalty,
  usePLApplicants,
  usePLProject,
} from '@/lib/hooks';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/mockData';
import { showTransactionPending, showTransactionSuccess, showTransactionError } from '@/lib/transactions';
import type { Address } from 'viem';

interface POMilestoneActionsProps {
  projectId: bigint;
  milestoneIndex: bigint;
  onAccepted?: () => void;
  onDeposited?: () => void;
}

/**
 * Milestone actions component for Project Owner
 */
export function POMilestoneActions({ projectId, milestoneIndex, onAccepted, onDeposited }: POMilestoneActionsProps) {
  const { address, isConnected, chain } = useAccount();
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const { milestone, isLoading: isMilestoneLoading } = usePLMilestone(projectId, milestoneIndex);
  const { amounts, isLoading: isAmountsLoading } = usePLWithdrawalAmounts(projectId, milestoneIndex);
  const { penalty, isLoading: isPenaltyLoading } = usePLMilestonePenalty(projectId, milestoneIndex);
  const { project } = usePLProject(projectId);

  // Cast amounts to array type for easier access
  const amountsArray = amounts as readonly [bigint, bigint, bigint, bigint] | undefined;

  const { accept, isPending: isAcceptPending, error: acceptError, hash: acceptHash, isSuccess: isAcceptSuccess } = usePLAcceptMilestone();

  // Handle accept milestone
  const handleAccept = async () => {
    try {
      const hash = await accept(projectId, milestoneIndex);
      if (hash) {
        showTransactionPending(hash, 'Accept Milestone', chain?.id || 84532);
        setShowAcceptModal(false);
        onAccepted?.();
      }
    } catch (error) {
      showTransactionError('0x0', error as Error, 'Failed to accept milestone');
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

  const isSubmitted = (milestone as any)?.submissionTime > BigInt(0);
  const isAccepted = (milestone as any)?.accepted;
  const isReleased = (milestone as any)?.released;

  // Calculate penalty percentage
  const penaltyPercent: number = penalty ? Number(penalty as bigint) / 100 : 0;

  // Check if user is the project creator
  const projectArray = project as any[] | undefined;
  const isCreator = projectArray && address && projectArray[0].toLowerCase() === address.toLowerCase();

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
          {isReleased ? 'Withdrawn' : isAccepted ? 'Approved' : isSubmitted ? 'Awaiting Approval' : 'Pending'}
        </span>
      </div>

      {/* Actions for PO */}
      {isCreator && isSubmitted && !isAccepted && (
        <Button
          variant="success"
          size="sm"
          className="w-full"
          onClick={() => setShowAcceptModal(true)}
          disabled={isAcceptPending || !isConnected}
        >
          {isAcceptPending ? 'Accepting...' : 'Accept Milestone'}
        </Button>
      )}

      {!isCreator && (
        <p className="text-xs text-slate-500">Only the project creator can accept milestones</p>
      )}

      {isAccepted && !isReleased && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            Milestone accepted. Freelancer can now withdraw funds.
          </p>
        </div>
      )}

      {isReleased && (
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs text-emerald-800">
            Milestone funds have been withdrawn by freelancer.
          </p>
        </div>
      )}

      {/* Accept Milestone Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Accept Milestone {Number(milestoneIndex) + 1}</h3>
            <p className="text-sm text-slate-600">
              By accepting this milestone, you confirm that the work has been completed. The freelancer will be able to withdraw funds.
            </p>

            {/* Penalty Warning */}
            {penaltyPercent > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Late Penalty:</strong> {penaltyPercent.toFixed(2)}% will be deducted from the milestone amount.
                </p>
              </div>
            )}

            {/* Withdrawal Breakdown */}
            {amountsArray && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-slate-900">Freelancer will receive:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Vault:</span>
                    <span className="ml-1 font-semibold text-slate-900">
                      {formatCurrency(Number(amountsArray[0] || BigInt(0)) / 1e6, 'IDRX')}
                    </span>
                  </div>
                  {amountsArray[1] > BigInt(0) && (
                    <div>
                      <span className="text-slate-600">Creator Yield:</span>
                      <span className="ml-1 font-semibold text-emerald-700">
                        {formatCurrency(Number(amountsArray[1]) / 1e6, 'IDRX')}
                      </span>
                    </div>
                  )}
                  {amountsArray[2] > BigInt(0) && (
                    <div>
                      <span className="text-slate-600">Platform Fee:</span>
                      <span className="ml-1 font-semibold text-slate-700">
                        {formatCurrency(Number(amountsArray[2]) / 1e6, 'IDRX')}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-600">FL Yield:</span>
                    <span className="ml-1 font-semibold text-emerald-700">
                      {formatCurrency(Number(amountsArray[3] || BigInt(0)) / 1e6, 'IDRX')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAcceptModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleAccept}
                disabled={isAcceptPending}
              >
                {isAcceptPending ? 'Accepting...' : 'Accept'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Freelancer acceptance component
 */
interface AcceptFreelancerProps {
  projectId: bigint;
  onAccepted?: () => void;
}

export function AcceptFreelancer({ projectId, onAccepted }: AcceptFreelancerProps) {
  const { address, isConnected, chain } = useAccount();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Address | null>(null);

  const { applicants, isLoading: isApplicantsLoading } = usePLApplicants(projectId);
  const { project } = usePLProject(projectId);
  const { accept, isPending, error, hash, isSuccess } = usePLAcceptFreelancer();

  // Check if user is the project creator
  const projectArray = project as any[] | undefined;
  const isCreator = projectArray && address && projectArray[0].toLowerCase() === address.toLowerCase();
  const hasFreelancer = projectArray && projectArray[1] !== address && projectArray[1] !== '0x0000000000000000000000000000000000000000';

  const handleAccept = async () => {
    if (!selectedFreelancer) return;
    try {
      const hash = await accept(projectId, selectedFreelancer);
      if (hash) {
        showTransactionPending(hash, 'Accept Freelancer', chain?.id || 84532);
        setShowAcceptModal(false);
        onAccepted?.();
      }
    } catch (error) {
      showTransactionError('0x0', error as Error, 'Failed to accept freelancer');
    }
  };

  if (isApplicantsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  if (hasFreelancer) {
    return (
      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-xs text-emerald-800">
          Freelancer assigned: {projectArray?.[1]?.slice(0, 6)}...{projectArray?.[1]?.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        {applicants && applicants.length > 0
          ? `${applicants.length} applicant${applicants.length > 1 ? 's' : ''} applied`
          : 'No applicants yet'}
      </p>

      {applicants && applicants.length > 0 && (
        <div className="space-y-2">
          {applicants.map((applicant, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
            >
              <span className="text-sm font-mono text-slate-900">
                {applicant.slice(0, 6)}...{applicant.slice(-4)}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedFreelancer(applicant);
                  setShowAcceptModal(true);
                }}
                disabled={isPending}
              >
                Accept
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Accept Freelancer Modal */}
      {showAcceptModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Accept Freelancer</h3>
            <p className="text-sm text-slate-600">
              Assign this freelancer to your project? They will be able to submit milestones for payment.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-mono text-slate-900">
                {selectedFreelancer}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAcceptModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleAccept}
                disabled={isPending}
              >
                {isPending ? 'Accepting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Deposit funds component
 */
interface DepositFundsProps {
  projectId: bigint;
  onDeposited?: () => void;
}

export function DepositFunds({ projectId, onDeposited }: DepositFundsProps) {
  const { address, isConnected, chain } = useAccount();
  const [amount, setAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);

  const { project } = usePLProject(projectId);
  const { deposit, isPending, error, hash, isSuccess } = usePLDepositFunds();

  // Check if user is the project creator
  const projectArray = project as any[] | undefined;
  const isCreator = projectArray && address && projectArray[0].toLowerCase() === address.toLowerCase();

  const handleDeposit = async () => {
    if (!amount) return;
    try {
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e6)); // Convert to 6 decimals
      const hash = await deposit(projectId, amountBigInt);
      if (hash) {
        showTransactionPending(hash, 'Deposit Funds', chain?.id || 84532);
        setShowDepositModal(false);
        setAmount('');
        onDeposited?.();
      }
    } catch (error) {
      showTransactionError('0x0', error as Error, 'Failed to deposit funds');
    }
  };

  if (!isCreator) {
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowDepositModal(true)}
        disabled={!isConnected}
      >
        Deposit Funds
      </Button>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Deposit Funds</h3>
            <p className="text-sm text-slate-600">
              Funds will be split: 90% to vault, 10% to lending protocol for yield generation.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (IDRX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {amount && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <p className="text-xs text-slate-600">Estimated split:</p>
                <div className="flex justify-between text-xs">
                  <span>Vault (90%):</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(amount) * 0.9, 'IDRX')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>LP (10%):</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(parseFloat(amount) * 0.1, 'IDRX')}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDepositModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleDeposit}
                disabled={!amount || isPending}
              >
                {isPending ? 'Depositing...' : 'Deposit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
