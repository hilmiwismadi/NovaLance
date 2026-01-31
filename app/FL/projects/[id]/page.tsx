'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  usePLSubmitMilestone,
  usePLWithdrawMilestone,
  usePLAllMilestones,
  usePLProject,
  usePLWithdrawalAmounts,
  usePLMilestonePenalty,
  usePLApplyForProject,
  useTransactionWait,
} from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showError,
} from '@/lib/transactions';

// Format currency for IDRX (18 decimals as stored in contract, then converted for display)
function formatIDRX(amount: bigint | number): string {
  // Contract stores values in 18 decimals (standard ERC20)
  // But IDRX token uses 6 decimals, so we need to divide by 1e18 then multiply by 1e6
  // Or simply divide by 1e12 to go from 18 decimals to 6 decimals
  const value = typeof amount === 'bigint' ? Number(amount) / 1e12 : amount / 1e6;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get project status text
function getProjectStatus(status: number): string {
  switch (status) {
    case 0: return 'Active';
    case 1: return 'Assigned';
    case 2: return 'Completed';
    case 3: return 'Cancelled';
    default: return 'Unknown';
  }
}

// Get milestone status
function getMilestoneStatus(milestone: any): { text: string; variant: string } {
  if (milestone.released) return { text: 'Withdrawn', variant: 'success' };
  if (milestone.accepted) return { text: 'Ready to Withdraw', variant: 'success' };
  if (milestone.submissionTime > BigInt(0)) return { text: 'Submitted - Pending Approval', variant: 'warning' };
  return { text: 'Pending', variant: 'default' };
}

// Format penalty percentage
function formatPenalty(penaltyBps: bigint): string {
  return Number(penaltyBps) / 100 + '%';
}

export default function FLProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<{ index: number; data: any } | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());

  const projectId = params.id as string;
  const projectLanceId = BigInt(parseInt(projectId) || 0);

  // ProjectLance hooks
  const { project, isLoading: isProjectLoading, refetch: refetchProject } = usePLProject(projectLanceId);
  const { milestones, isLoading: isMilestonesLoading, refetch: refetchMilestones } = usePLAllMilestones(projectLanceId);

  // Write hooks
  const { submit: submitMilestone, isPending: isSubmitPending, error: submitError, hash: submitHash, isSuccess: isSubmitSuccess } = usePLSubmitMilestone();
  const { withdraw: withdrawMilestone, isPending: isWithdrawPending, error: withdrawError, hash: withdrawHash, isSuccess: isWithdrawSuccess } = usePLWithdrawMilestone();
  const { apply: applyForProject, isPending: isApplyPending, error: applyError, hash: applyHash, isSuccess: isApplySuccess } = usePLApplyForProject();

  // Transaction wait hooks
  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } = useTransactionWait(submitHash ?? undefined);
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useTransactionWait(withdrawHash ?? undefined);
  const { isLoading: isApplyConfirming, isSuccess: isApplyConfirmed } = useTransactionWait(applyHash ?? undefined);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Transaction handlers
  useEffect(() => {
    if (isSubmitSuccess && submitHash) {
      showTransactionPending(submitHash, 'Submit Milestone', chain?.id || 84532);
    }
  }, [isSubmitSuccess, submitHash, chain]);

  useEffect(() => {
    if (isSubmitConfirmed && submitHash) {
      showTransactionSuccess(submitHash, 'Milestone submitted successfully!');
      setSubmitModalOpen(false);
      setSelectedMilestone(null);
      refetchMilestones();
    }
  }, [isSubmitConfirmed, submitHash, refetchMilestones]);

  useEffect(() => {
    if (submitError) {
      showTransactionError(submitHash || '0x0', submitError, 'Failed to submit milestone');
    }
  }, [submitError, submitHash]);

  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      showTransactionPending(withdrawHash, 'Withdraw Funds', chain?.id || 84532);
    }
  }, [isWithdrawSuccess, withdrawHash, chain]);

  useEffect(() => {
    if (isWithdrawConfirmed && withdrawHash) {
      showTransactionSuccess(withdrawHash, 'Funds withdrawn successfully!');
      setWithdrawModalOpen(false);
      setSelectedMilestone(null);
      refetchMilestones();
      refetchProject();
    }
  }, [isWithdrawConfirmed, withdrawHash, refetchMilestones, refetchProject]);

  useEffect(() => {
    if (withdrawError) {
      showTransactionError(withdrawHash || '0x0', withdrawError, 'Failed to withdraw funds');
    }
  }, [withdrawError, withdrawHash]);

  useEffect(() => {
    if (isApplySuccess && applyHash) {
      showTransactionPending(applyHash, 'Apply for Project', chain?.id || 84532);
    }
  }, [isApplySuccess, applyHash, chain]);

  useEffect(() => {
    if (isApplyConfirmed && applyHash) {
      showTransactionSuccess(applyHash, 'Applied successfully!');
      refetchProject();
    }
  }, [isApplyConfirmed, applyHash, refetchProject]);

  useEffect(() => {
    if (applyError) {
      showTransactionError(applyHash || '0x0', applyError, 'Failed to apply for project');
    }
  }, [applyError, applyHash]);

  const handleSubmitMilestone = async () => {
    if (!address || !chain || !selectedMilestone) return;

    try {
      showInfo('Submitting Milestone', 'Processing submission...');
      await submitMilestone(projectLanceId, BigInt(selectedMilestone.index));
    } catch (err) {
      const error = err as Error;
      showTransactionError(submitHash || '0x0', error, 'Failed to submit milestone');
      setSubmitModalOpen(false);
      setSelectedMilestone(null);
    }
  };

  const handleWithdrawMilestone = async () => {
    if (!address || !chain || !selectedMilestone) return;

    try {
      showInfo('Withdrawing Funds', 'Processing withdrawal...');
      await withdrawMilestone(projectLanceId, BigInt(selectedMilestone.index));
    } catch (err) {
      const error = err as Error;
      showTransactionError(withdrawHash || '0x0', error, 'Failed to withdraw funds');
      setWithdrawModalOpen(false);
      setSelectedMilestone(null);
    }
  };

  const handleApplyForProject = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet');
      return;
    }

    try {
      showInfo('Applying for Project', 'Processing application...');
      await applyForProject(projectLanceId);
    } catch (err) {
      const error = err as Error;
      showTransactionError(applyHash || '0x0', error, 'Failed to apply for project');
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
        <Link href="/FL/projects">
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
  const totalBudget = Number(totalDeposited) / 1e6;
  const isFreelancer = freelancer && address?.toLowerCase() === (freelancer as string).toLowerCase();
  const canApply = !freelancer || freelancer === '0x0000000000000000000000000000000000000000';

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
            href="/FL/projects"
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Project #{projectId}</h1>
            <Badge variant={status === 1 ? 'warning' : status === 2 ? 'success' : 'default'}>
              {getProjectStatus(status)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Milestones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Milestones</h2>
            <span className="text-sm text-slate-500">({totalMilestoneCount})</span>
          </div>

          {/* Apply for project button if not the freelancer */}
          {canApply && status === 0 && (
            <Card className="p-4 sm:p-5 bg-brand-50 border-brand-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Apply for this Project</h3>
                  <p className="text-sm text-slate-600">Click to apply and be considered by the project owner.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleApplyForProject}
                  disabled={isApplyPending || isApplyConfirming}
                >
                  {isApplyPending || isApplyConfirming ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Applying...
                    </span>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
              </div>
            </Card>
          )}

          {(milestones as any[])?.map((milestone, index) => {
            const milestoneStatus = getMilestoneStatus(milestone);
            const isExpanded = expandedMilestones.has(index);
            const canSubmit = milestone.submissionTime === BigInt(0) && isFreelancer;
            const canWithdraw = milestone.accepted && !milestone.released && isFreelancer;
            const isClickable = canSubmit || canWithdraw;

            return (
              <Card
                key={index}
                className={`overflow-hidden ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => isClickable && toggleMilestoneExpanded(index)}
              >
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
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

                      {canSubmit && (
                        <div className="flex items-center gap-1.5 mt-2 text-brand-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">Click to submit work</span>
                        </div>
                      )}

                      {canWithdraw && (
                        <div className="flex items-center gap-1.5 mt-2 text-emerald-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-xs">Click to withdraw payment</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-base sm:text-lg font-bold text-brand-600">
                        {formatIDRX(milestone.actualAmount)} IDRX
                      </p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/30">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Percentage</span>
                        <span className="font-medium text-slate-900">{Number(milestone.percentage) / 100}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Submitted</span>
                        <span className="font-medium text-slate-900">
                          {milestone.submissionTime > BigInt(0) ? new Date(Number(milestone.submissionTime) * 1000).toLocaleString() : 'Not submitted'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Accepted by PO</span>
                        <span className="font-medium text-slate-900">{milestone.accepted ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Funds Released</span>
                        <span className="font-medium text-slate-900">{milestone.released ? 'Yes' : 'No'}</span>
                      </div>
                      {milestone.yieldAmount > BigInt(0) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Yield Amount</span>
                          <span className="font-medium text-emerald-600">{formatIDRX(milestone.yieldAmount)} IDRX</span>
                        </div>
                      )}

                      {isFreelancer && canSubmit && (
                        <Button
                          variant="primary"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMilestone({ index, data: milestone });
                            setSubmitModalOpen(true);
                          }}
                        >
                          Submit Milestone
                        </Button>
                      )}

                      {isFreelancer && canWithdraw && (
                        <Button
                          variant="success"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMilestone({ index, data: milestone });
                            setWithdrawModalOpen(true);
                          }}
                        >
                          Withdraw Funds
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
          {/* Project Owner Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {(creator as string).slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {(creator as string).slice(0, 6)}...{(creator as string).slice(-4)}
                </p>
                <p className="text-xs text-slate-500">Creator</p>
              </div>
            </div>
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
          </Card>

          {/* Status Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Your Status</h3>
            <div className="space-y-2">
              {isFreelancer ? (
                <>
                  <p className="text-sm text-emerald-600 font-medium">You are hired for this project!</p>
                  <p className="text-xs text-slate-500">
                    Complete milestones and withdraw payments as they are approved.
                  </p>
                </>
              ) : canApply && status === 0 ? (
                <>
                  <p className="text-sm text-slate-600">You haven't applied for this project yet.</p>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleApplyForProject}
                    disabled={isApplyPending || isApplyConfirming}
                  >
                    {isApplyPending || isApplyConfirming ? 'Applying...' : 'Apply Now'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">This position has been filled.</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Milestone Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Submit Milestone">
        <div className="space-y-4">
          {selectedMilestone && (
            <>
              <p className="text-slate-600">
                Submit your work for milestone #{selectedMilestone.index + 1}. Once submitted, the project owner will review and approve it.
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
                  <span className="text-slate-600">Deadline:</span>
                  <span className="font-medium text-slate-900">
                    {new Date(Number(selectedMilestone.data.deadline) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Submitting indicates that you have completed the work for this milestone. The project owner will need to approve it before you can withdraw payment.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setSubmitModalOpen(false)} className="flex-1" disabled={isSubmitPending || isSubmitConfirming}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmitMilestone} className="flex-1" disabled={isSubmitPending || isSubmitConfirming}>
                  {isSubmitPending || isSubmitConfirming ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} title="Withdraw Funds">
        <div className="space-y-4">
          {selectedMilestone && (
            <>
              <p className="text-slate-600">
                Withdraw your payment for milestone #{selectedMilestone.index + 1}.
              </p>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Milestone:</span>
                  <span className="font-medium text-slate-900">#{selectedMilestone.index + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Vault Amount:</span>
                  <span className="font-medium text-brand-600">{formatIDRX(selectedMilestone.data.actualAmount)} IDRX</span>
                </div>
                {selectedMilestone.data.isLastMilestone && selectedMilestone.data.yieldAmount > BigInt(0) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Yield Amount:</span>
                      <span className="font-medium text-emerald-600">{formatIDRX(selectedMilestone.data.yieldAmount)} IDRX</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                      <span className="text-slate-600">Total to Receive:</span>
                      <span className="font-bold text-slate-900">
                        {formatIDRX(selectedMilestone.data.actualAmount + selectedMilestone.data.yieldAmount)} IDRX
                      </span>
                    </div>
                  </>
                )}
              </div>

              {selectedMilestone.data.isLastMilestone && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 font-medium mb-2">Last Milestone - Yield Distribution:</p>
                  <div className="space-y-1 text-xs text-emerald-700">
                    <div className="flex justify-between">
                      <span>• Freelancer Yield:</span>
                      <span className="font-semibold">100% of yield</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setWithdrawModalOpen(false)} className="flex-1" disabled={isWithdrawPending || isWithdrawConfirming}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleWithdrawMilestone} className="flex-1" disabled={isWithdrawPending || isWithdrawConfirming}>
                  {isWithdrawPending || isWithdrawConfirming ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Withdrawing...
                    </span>
                  ) : (
                    'Withdraw'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
