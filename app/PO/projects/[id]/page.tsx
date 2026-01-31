'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import {
  usePLAcceptMilestone,
  usePLAllMilestones,
  usePLVaultBalance,
  usePLLendingBalance,
  usePLProject,
  usePLAcceptFreelancer,
  usePLApplicants,
  usePLCancelProject,
  useTransactionWait,
} from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showError,
} from '@/lib/transactions';

// Format currency for IDRX (18 decimals)
function formatIDRX(amount: bigint | number): string {
  const value = typeof amount === 'bigint' ? Number(amount) / 1e18 : amount;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get project status text - based on both status and freelancer assignment
function getProjectStatus(status: number, freelancer: string): string {
  if (status === 3) return 'Cancelled';
  if (status === 2) return 'Completed';
  if (status === 0) {
    // Active projects can be "Hired" (freelancer assigned) or just "Active" (hiring)
    return freelancer && freelancer !== '0x0000000000000000000000000000000000000000' ? 'Hired' : 'Active';
  }
  return 'Unknown';
}

// Get milestone status
function getMilestoneStatus(milestone: any): { text: string; variant: string } {
  if (milestone.released) return { text: 'Withdrawn', variant: 'success' };
  if (milestone.accepted) return { text: 'Approved', variant: 'success' };
  if (milestone.submissionTime > BigInt(0)) return { text: 'Submitted', variant: 'warning' };
  return { text: 'Pending', variant: 'default' };
}

export default function POProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<{ index: number; data: any } | null>(null);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());

  const projectId = params.id as string;
  const projectLanceId = BigInt(parseInt(projectId) || 0);

  // ProjectLance hooks
  const { project, isLoading: isProjectLoading, refetch: refetchProject } = usePLProject(projectLanceId);
  const { milestones, isLoading: isMilestonesLoading, refetch: refetchMilestones } = usePLAllMilestones(projectLanceId);
  const { balance: vaultBalance } = usePLVaultBalance(projectLanceId);
  const { balance: lendingBalance } = usePLLendingBalance(projectLanceId);
  const { applicants } = usePLApplicants(projectLanceId);

  // Write hooks
  const { accept: acceptMilestone, isPending: isAcceptPending, error: acceptError, hash: acceptHash, isSuccess: isAcceptSuccess } = usePLAcceptMilestone();
  const { accept: acceptFreelancer, isPending: isHirePending, error: hireError, hash: hireHash, isSuccess: isHireSuccess } = usePLAcceptFreelancer();
  const { cancel: cancelProject, isPending: isCancelPending, error: cancelError, hash: cancelHash, isSuccess: isCancelSuccess } = usePLCancelProject();

  // Transaction wait hooks
  const { isLoading: isAcceptConfirming, isSuccess: isAcceptConfirmed } = useTransactionWait(acceptHash ?? undefined);
  const { isLoading: isHireConfirming, isSuccess: isHireConfirmed } = useTransactionWait(hireHash ?? undefined);
  const { isLoading: isCancelConfirming, isSuccess: isCancelConfirmed } = useTransactionWait(cancelHash ?? undefined);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Auto-expand milestones that need approval
  useEffect(() => {
    if (milestones) {
      const indicesNeedingApproval = (milestones as any[])
        .map((m, i) => ({ ...m, index: i }))
        .filter((m) => m.submissionTime > BigInt(0) && !m.accepted)
        .map((m) => m.index);

      if (indicesNeedingApproval.length > 0) {
        setExpandedMilestones(new Set(indicesNeedingApproval));
      }
    }
  }, [milestones]);

  // Transaction handlers
  useEffect(() => {
    if (isAcceptSuccess && acceptHash) {
      showTransactionPending(acceptHash, 'Accept Milestone', chain?.id || 84532);
    }
  }, [isAcceptSuccess, acceptHash, chain]);

  useEffect(() => {
    if (isAcceptConfirmed && acceptHash) {
      showTransactionSuccess(acceptHash, 'Milestone accepted successfully!');
      setApproveModalOpen(false);
      setSelectedMilestone(null);
      refetchMilestones();
      refetchProject();
    }
  }, [isAcceptConfirmed, acceptHash, refetchMilestones, refetchProject]);

  useEffect(() => {
    if (acceptError) {
      showTransactionError(acceptHash || '0x0', acceptError, 'Failed to accept milestone');
    }
  }, [acceptError, acceptHash]);

  useEffect(() => {
    if (isHireSuccess && hireHash) {
      showTransactionPending(hireHash, 'Accept Freelancer', chain?.id || 84532);
    }
  }, [isHireSuccess, hireHash, chain]);

  useEffect(() => {
    if (isHireConfirmed && hireHash) {
      showTransactionSuccess(hireHash, 'Freelancer accepted successfully!');
      setHireModalOpen(false);
      refetchProject();
    }
  }, [isHireConfirmed, hireHash, refetchProject]);

  useEffect(() => {
    if (hireError) {
      showTransactionError(hireHash || '0x0', hireError, 'Failed to accept freelancer');
    }
  }, [hireError, hireHash]);

  useEffect(() => {
    if (isCancelSuccess && cancelHash) {
      showTransactionPending(cancelHash, 'Cancel Project', chain?.id || 84532);
    }
  }, [isCancelSuccess, cancelHash, chain]);

  useEffect(() => {
    if (isCancelConfirmed && cancelHash) {
      showTransactionSuccess(cancelHash, 'Project cancelled successfully!');
      setCancelModalOpen(false);
      setCancelReason('');
      setTimeout(() => {
        router.push('/PO/projects');
      }, 1500);
    }
  }, [isCancelConfirmed, cancelHash, router]);

  useEffect(() => {
    if (cancelError) {
      showTransactionError(cancelHash || '0x0', cancelError, 'Failed to cancel project');
    }
  }, [cancelError, cancelHash]);

  const handleAcceptMilestone = async () => {
    if (!address || !chain || !selectedMilestone) return;

    try {
      showInfo('Approving Milestone', 'Processing approval...');
      await acceptMilestone(projectLanceId, BigInt(selectedMilestone.index));
    } catch (err) {
      const error = err as Error;
      showTransactionError(acceptHash || '0x0', error, 'Failed to approve milestone');
      setApproveModalOpen(false);
      setSelectedMilestone(null);
    }
  };

  const handleHireFreelancer = async (freelancer: `0x${string}`) => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    try {
      showInfo('Accepting Freelancer', 'Processing...');
      await acceptFreelancer(projectLanceId, freelancer);
    } catch (err) {
      const error = err as Error;
      showTransactionError(hireHash || '0x0', error, 'Failed to accept freelancer');
      setHireModalOpen(false);
    }
  };

  const handleCancelProject = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to cancel project');
      return;
    }

    if (!cancelReason.trim()) {
      showError('Reason Required', 'Please provide a reason for cancellation');
      return;
    }

    try {
      showInfo('Cancelling Project', 'Processing cancellation...');
      await cancelProject(projectLanceId);
    } catch (err) {
      const error = err as Error;
      showTransactionError(cancelHash || '0x0', error, 'Failed to cancel project');
    }
  };

  const toggleMilestoneExpanded = (index: number) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (!mounted) return null;

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-slate-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/PO/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // ProjectLance getProject returns a tuple, access by index
  const projectArray = project as any[] | undefined;
  const creator = projectArray?.[0];
  const freelancer = projectArray?.[1];
  const status = projectArray?.[2] ?? 0;
  const totalDeposited = projectArray?.[3] ?? BigInt(0);
  const vaultAmount = projectArray?.[4] ?? BigInt(0);
  const lendingAmount = projectArray?.[5] ?? BigInt(0);
  const milestoneCount = projectArray?.[6] ?? BigInt(0);
  const cancelledTimestamp = projectArray?.[7] ?? BigInt(0);
  const totalBudget = Number(totalDeposited) / 1e18;
  const hasFreelancer = freelancer !== '0x0000000000000000000000000000000000000000' as Address;
  const isProjectOwner = address?.toLowerCase() === creator.toLowerCase();

  // Calculate milestone amount (projected) based on total budget and percentage
  const calculateMilestoneAmount = (milestone: any): bigint => {
    if (milestone.actualAmount > BigInt(0)) {
      return milestone.actualAmount; // Use actual if already calculated
    }
    // Projected amount = total deposited * milestone percentage
    return (totalDeposited * BigInt(milestone.percentage)) / BigInt(10000);
  };

  // Get estimated amount as number for display
  const getEstimatedAmount = (percentage: bigint): number => {
    return (totalBudget * Number(percentage)) / 10000; // percentage is in basis points (100 = 1%)
  };

  // Calculate progress
  const completedMilestones = (milestones as any[])?.filter(m => m.accepted || m.released).length || 0;
  const totalMilestoneCount = (milestones as any[])?.length || Number(milestoneCount);
  const progress = totalMilestoneCount > 0 ? (completedMilestones / totalMilestoneCount) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/PO/projects"
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Project #{projectId}</h1>
            <Badge variant={
              status === 3 ? 'error' :
              status === 2 ? 'success' :
              (status === 0 && freelancer && freelancer !== '0x0000000000000000000000000000000000000000') ? 'info' : 'default'
            }>
              {getProjectStatus(status, freelancer as string)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Total Budget</p>
            <p className="text-base sm:text-lg font-bold text-brand-600">
              {formatIDRX(totalBudget)} IDRX
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Milestones</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{totalMilestoneCount}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Completed</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">{completedMilestones}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Progress</p>
            <p className="text-base sm:text-lg font-bold text-brand-600">{progress.toFixed(0)}%</p>
          </div>
        </div>
      </Card>

      {/* Vault & Lending Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Funds Overview</h3>
              <p className="text-xs text-slate-500">Vault balance and yield</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-50 rounded-lg p-4">
            <p className="text-xs text-brand-600 mb-1">Vault (Escrow - 90%)</p>
            <p className="text-lg font-bold text-brand-700">{formatIDRX(vaultBalance || BigInt(0))} IDRX</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 mb-1">Lending (10% + Yield)</p>
            <p className="text-lg font-bold text-blue-700">{formatIDRX(lendingBalance || BigInt(0))} IDRX</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Milestones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Milestones</h2>
            <span className="text-sm text-slate-500">({totalMilestoneCount})</span>
          </div>

          {(milestones as any[])?.map((milestone, index) => {
            const milestoneStatus = getMilestoneStatus(milestone);
            const isExpanded = expandedMilestones.has(index);
            const needsApproval = milestone.submissionTime > BigInt(0) && !milestone.accepted;
            const hasActualAmount = milestone.actualAmount > BigInt(0);
            const estimatedAmount = getEstimatedAmount(milestone.percentage);

            return (
              <Card key={index} className="overflow-hidden">
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Milestone {index + 1}</h3>
                        <Badge variant={milestoneStatus.variant as any} className="text-xs flex-shrink-0">
                          {milestoneStatus.text}
                        </Badge>
                        {milestone.isLastMilestone && (
                          <Badge variant="default" className="text-xs flex-shrink-0">
                            Includes Yield
                          </Badge>
                        )}
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full">
                          {Number(milestone.percentage) / 100}%
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        Deadline: {new Date(Number(milestone.deadline) * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      {needsApproval && (
                        <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs">Awaiting your approval</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500">
                        {hasActualAmount ? 'Actual Amount' : 'Est. Amount'}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-brand-600">
                        {hasActualAmount
                          ? formatIDRX(milestone.actualAmount)
                          : formatIDRX(estimatedAmount)
                        } IDRX
                      </p>
                      {!hasActualAmount && (
                        <p className="text-[10px] text-slate-400">before penalties</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMilestoneExpanded(index)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all border border-brand-200 hover:border-brand-300"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Details</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View Details</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/30">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Percentage</span>
                        <span className="font-medium text-slate-900">{Number(milestone.percentage) / 100}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {hasActualAmount ? 'Actual Amount' : 'Est. Amount'}
                        </span>
                        <span className={`font-medium ${hasActualAmount ? 'text-brand-600' : 'text-slate-900'}`}>
                          {hasActualAmount
                            ? formatIDRX(milestone.actualAmount)
                            : formatIDRX(estimatedAmount)
                          } IDRX
                        </span>
                      </div>
                      {!hasActualAmount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Note</span>
                          <span className="font-medium text-slate-500 text-xs">
                            Amount calculated on approval (may include late penalty)
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Submitted</span>
                        <span className="font-medium text-slate-900">
                          {milestone.submissionTime > BigInt(0) ? new Date(Number(milestone.submissionTime) * 1000).toLocaleString() : 'Not submitted'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Accepted</span>
                        <span className="font-medium text-slate-900">{milestone.accepted ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Released</span>
                        <span className="font-medium text-slate-900">{milestone.released ? 'Yes' : 'No'}</span>
                      </div>
                      {milestone.yieldAmount > BigInt(0) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Yield Amount</span>
                          <span className="font-medium text-emerald-600">{formatIDRX(milestone.yieldAmount)} IDRX</span>
                        </div>
                      )}

                      {needsApproval && isProjectOwner && (
                        <Button
                          variant="primary"
                          className="w-full mt-2"
                          onClick={() => {
                            setSelectedMilestone({ index, data: milestone });
                            setApproveModalOpen(true);
                          }}
                        >
                          Approve Milestone
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Freelancer Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Freelancer</h3>
            {hasFreelancer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(freelancer as string).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {(freelancer as string).slice(0, 6)}...{(freelancer as string).slice(-4)}
                    </p>
                    <p className="text-xs text-slate-500">Hired</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">No freelancer assigned yet.</p>
                {applicants && applicants.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">{applicants.length} applicant(s)</p>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setHireModalOpen(true)}
                    >
                      Review Applicants
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Budget</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Deposited</span>
                <span className="font-medium text-slate-900">{formatIDRX(totalDeposited)} IDRX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Vault (90%)</span>
                <span className="font-medium text-brand-600">{formatIDRX(vaultAmount)} IDRX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Lending (10%)</span>
                <span className="font-medium text-blue-600">{formatIDRX(lendingAmount)} IDRX</span>
              </div>
            </div>

            {isProjectOwner && totalDeposited === 0n && (
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => router.push(`/PO/projects/${projectId}/fund`)}
              >
                Fund Project
              </Button>
            )}
          </Card>

          {/* Cancel Project Card */}
          {isProjectOwner && status !== 3 && (
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Project</h3>
              <p className="text-sm text-slate-600 mb-4">
                Permanently cancel this project.
              </p>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => setCancelModalOpen(true)}
                disabled={isCancelPending || isCancelConfirming}
              >
                {isCancelPending || isCancelConfirming ? 'Cancelling...' : 'Cancel Project'}
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Milestone Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Approve Milestone">
        <div className="space-y-4">
          {selectedMilestone && (
            <>
              <p className="text-slate-600">
                Are you sure you want to approve milestone #{selectedMilestone.index + 1} and release payment to the freelancer?
              </p>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Milestone:</span>
                  <span className="font-medium text-slate-900">#{selectedMilestone.index + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Percentage:</span>
                  <span className="font-medium text-slate-900">{Number(selectedMilestone.data.percentage) / 100}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-medium text-brand-600">
                    {selectedMilestone.data.actualAmount > BigInt(0)
                      ? formatIDRX(selectedMilestone.data.actualAmount)
                      : formatIDRX(getEstimatedAmount(selectedMilestone.data.percentage))
                    } IDRX
                  </span>
                </div>
                {selectedMilestone.data.isLastMilestone && selectedMilestone.data.yieldAmount > BigInt(0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Yield (100% to FL):</span>
                    <span className="font-medium text-emerald-600">{formatIDRX(selectedMilestone.data.yieldAmount)} IDRX</span>
                  </div>
                )}
              </div>

              {selectedMilestone.data.isLastMilestone && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 font-medium mb-2">Last Milestone Yield Distribution:</p>
                  <div className="space-y-1 text-xs text-emerald-700">
                    <div className="flex justify-between">
                      <span>• Freelancer Yield:</span>
                      <span className="font-semibold">100%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setApproveModalOpen(false)} className="flex-1" disabled={isAcceptPending || isAcceptConfirming}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleAcceptMilestone} className="flex-1" disabled={isAcceptPending || isAcceptConfirming}>
                  {isAcceptPending || isAcceptConfirming ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Approving...
                    </span>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Hire Freelancer Modal */}
      <Modal isOpen={hireModalOpen} onClose={() => setHireModalOpen(false)} title="Select Freelancer">
        <div className="space-y-4">
          <p className="text-slate-600">Choose a freelancer from the applicants list.</p>

          {applicants && applicants.length > 0 ? (
            <div className="space-y-2">
              {applicants.map((applicant) => (
                <div
                  key={applicant}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/50"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {applicant.slice(0, 6)}...{applicant.slice(-4)}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleHireFreelancer(applicant)}
                    disabled={isHirePending || isHireConfirming}
                  >
                    Hire
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No applicants yet.</p>
          )}

          <Button variant="ghost" onClick={() => setHireModalOpen(false)} className="w-full" disabled={isHirePending || isHireConfirming}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Cancel Project Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Project">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to cancel this project? This action cannot be undone.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-900">Refund Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Vault Refund:</span>
                <span className="font-semibold text-brand-600">{formatIDRX(vaultAmount || BigInt(0))} IDRX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Lending (kept by platform):</span>
                <span className="font-semibold text-blue-600">Platform keeps</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                You will receive {formatIDRX(vaultAmount || BigInt(0))} IDRX back from the vault.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Cancellation *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please explain why you're cancelling this project..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This will permanently cancel the project.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)} className="flex-1" disabled={isCancelPending || isCancelConfirming}>
              Keep Project
            </Button>
            <Button variant="outline" onClick={handleCancelProject} className="flex-1 border-red-300 text-red-700 hover:bg-red-50" disabled={!cancelReason.trim() || isCancelPending || isCancelConfirming}>
              {isCancelPending || isCancelConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-red-700 border-t-transparent animate-spin" />
                  Cancelling...
                </span>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
