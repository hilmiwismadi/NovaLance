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
  usePLDepositFunds,
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
import { getPOProjectById } from '@/lib/mockData';
import KPIReviewModal from '@/components/po/KPIReviewModal';

// Format currency for IDRX (6 decimals)
function formatIDRX(amount: bigint | number): string {
  const value = typeof amount === 'bigint' ? Number(amount) / 1e6 : amount;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get project status text
function getProjectStatus(status: number): string {
  switch (status) {
    case 0: return 'Hiring';
    case 1: return 'In Progress';
    case 2: return 'Completed';
    case 3: return 'Cancelled';
    default: return 'Unknown';
  }
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
  const [depositModalOpen, setDepositModalOpen] = useState(false);
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
  const { deposit: depositFunds, isPending: isDepositPending, error: depositError, hash: depositHash, isSuccess: isDepositSuccess } = usePLDepositFunds();
  const { accept: acceptMilestone, isPending: isAcceptPending, error: acceptError, hash: acceptHash, isSuccess: isAcceptSuccess } = usePLAcceptMilestone();
  const { accept: acceptFreelancer, isPending: isHirePending, error: hireError, hash: hireHash, isSuccess: isHireSuccess } = usePLAcceptFreelancer();
  const { cancel: cancelProject, isPending: isCancelPending, error: cancelError, hash: cancelHash, isSuccess: isCancelSuccess } = usePLCancelProject();

  // Transaction wait hooks
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useTransactionWait(depositHash ?? undefined);
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
    if (isDepositSuccess && depositHash) {
      showTransactionPending(depositHash, 'Deposit to Escrow', chain?.id || 84532);
    }
  }, [isDepositSuccess, depositHash, chain]);

  useEffect(() => {
    if (isDepositConfirmed && depositHash) {
      showTransactionSuccess(depositHash, 'Funds deposited successfully!');
      setDepositModalOpen(false);
      refetchProject();
      refetchMilestones();
    }
  }, [isDepositConfirmed, depositHash, refetchProject, refetchMilestones]);

  useEffect(() => {
    if (depositError) {
      showTransactionError(depositHash || '0x0', depositError, 'Failed to deposit funds');
    }
  }, [depositError, depositHash]);

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

  const handleDeposit = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to deposit funds');
      return;
    }

    try {
      showInfo('Depositing to Escrow', 'Enter amount to deposit...');
      // For simplicity, using a fixed amount. In production, this would be user input
      const amount = 10 * 1e6; // 10 IDRX
      await depositFunds(projectLanceId, BigInt(amount));
    } catch (err) {
      const error = err as Error;
      showTransactionError(depositHash || '0x0', error, 'Failed to deposit');
      setDepositModalOpen(false);
    }
  };

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
    // Try to get mock data as fallback
    const mockProject = getPOProjectById(projectId);
    if (mockProject) {
      return <MockProjectDetailPage project={mockProject} />;
    }
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
  const totalBudget = Number(totalDeposited) / 1e6;
  const hasFreelancer = freelancer !== '0x0000000000000000000000000000000000000000' as Address;
  const isProjectOwner = address?.toLowerCase() === creator.toLowerCase();

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
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-base sm:text-lg font-bold text-brand-600">
                        {formatIDRX(milestone.actualAmount)} IDRX
                      </p>
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
                    <p className="text-xs text-slate-500">Assigned</p>
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

            {isProjectOwner && (
              <Button variant="primary" className="w-full mt-4" onClick={() => setDepositModalOpen(true)}>
                Deposit Funds
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

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit to Escrow">
        <div className="space-y-4">
          <p className="text-slate-600">
            Funds will be automatically split between escrow (90%) and yield generation (10%).
          </p>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-600">
              Enter the amount to deposit in IDRX. The funds will be split:
            </p>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Vault (Escrow - 90%):</span>
                <span className="font-semibold text-brand-600">90%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Lending (10%):</span>
                <span className="font-semibold text-blue-600">10%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDepositModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeposit} className="flex-1" disabled={isDepositPending || isDepositConfirming}>
              {isDepositPending || isDepositConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Depositing...
                </span>
              ) : (
                'Deposit 10 IDRX'
              )}
            </Button>
          </div>
        </div>
      </Modal>

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
                  <span className="font-medium text-brand-600">{formatIDRX(selectedMilestone.data.actualAmount)} IDRX</span>
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

// Mock project detail page component for when no contract data is available
interface MockProjectDetailPageProps {
  project: import('@/lib/mockData').POProject;
}

function MockProjectDetailPage({ project }: MockProjectDetailPageProps) {
  const router = useRouter();
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [selectedKPI, setSelectedKPI] = useState<{ roleIndex: number; kpiIndex: number } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Flatten all KPIs for display
  const allKPIs = project.roles.flatMap(role =>
    role.kpis.map(kpi => ({ ...kpi, roleName: role.title, roleId: role.id }))
  );

  const completedKPIs = allKPIs.filter(k => k.status === 'completed' || k.status === 'approved').length;
  const progress = (completedKPIs / allKPIs.length) * 100;

  // Auto-expand roles that have KPIs pending approval
  useEffect(() => {
    const rolesWithPendingApproval = project.roles
      .filter((r) => r.kpis.some((k) => k.status === 'pending-approval' || k.status === 'completed'))
      .map((r) => r.id);

    if (rolesWithPendingApproval.length > 0) {
      setExpandedRoles(new Set(rolesWithPendingApproval));
    }
  }, [project]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hiring': return { text: 'Hiring', variant: 'info' as const };
      case 'in-progress': return { text: 'In Progress', variant: 'warning' as const };
      case 'completed': return { text: 'Completed', variant: 'success' as const };
      case 'cancelled': return { text: 'Cancelled', variant: 'error' as const };
      default: return { text: 'Draft', variant: 'default' as const };
    }
  };

  const getKPIStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return { text: 'Approved', variant: 'success' as const };
      case 'completed': return { text: 'Completed', variant: 'success' as const };
      case 'pending-approval': return { text: 'Pending Approval', variant: 'warning' as const };
      case 'in-progress': return { text: 'In Progress', variant: 'info' as const };
      case 'rejected': return { text: 'Rejected', variant: 'error' as const };
      default: return { text: 'Pending', variant: 'default' as const };
    }
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const openReviewModal = (roleIndex: number, kpiIndex: number) => {
    const kpi = project.roles[roleIndex].kpis[kpiIndex];
    setSelectedKPI({ roleIndex, kpiIndex });
    setReviewModalOpen(true);
  };

  const projectStatus = getStatusBadge(project.status);

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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={projectStatus.variant}>
              {projectStatus.text}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-2">{project.description}</p>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Total Budget</p>
            <p className="text-base sm:text-lg font-bold text-brand-600">
              {project.totalBudget.toLocaleString()} {project.currency}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Roles</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{project.roles.length}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">KPIs</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{allKPIs.length}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Progress</p>
            <p className="text-base sm:text-lg font-bold text-brand-600">{progress.toFixed(0)}%</p>
          </div>
        </div>
      </Card>

      {/* Dates Card */}
      {(project.startDate || project.endDate) && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
              <p className="text-xs text-slate-500">Project duration</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {project.startDate && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Start Date</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {project.endDate && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">End Date</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Features Card */}
      {project.features && project.features.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Features</h3>
              <p className="text-xs text-slate-500">Project deliverables</p>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {project.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Roles & KPIs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Roles & Milestones</h2>
            <span className="text-sm text-slate-500">({project.roles.length})</span>
          </div>

          {project.roles.map((role) => {
            const isExpanded = expandedRoles.has(role.id);
            const roleCompletedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
            const roleProgress = (roleCompletedKPIs / role.kpis.length) * 100;
            const roleStatus = getStatusBadge(role.status);

            return (
              <Card key={role.id} className="overflow-hidden">
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">{role.title}</h3>
                        <Badge variant={roleStatus.variant as any} className="text-xs flex-shrink-0">
                          {roleStatus.text}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full">
                          {role.budget.toLocaleString()} {role.currency}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{role.description}</p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {role.skills.map((skill) => (
                          <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{role.kpis.length} KPIs</span>
                        <span>•</span>
                        <span>{roleCompletedKPIs} completed</span>
                        <span>•</span>
                        <span className="font-medium text-brand-600">{roleProgress.toFixed(0)}% progress</span>
                      </div>

                      {role.assignedTo && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Assigned to: {role.assignedToEns || role.assignedTo.slice(0, 6) + '...' + role.assignedTo.slice(-4)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRoleExpanded(role.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all border border-brand-200 hover:border-brand-300"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide KPIs</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7-7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View KPIs</span>
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
                      {role.kpis.map((kpi, index) => {
                        const kpiStatus = getKPIStatusBadge(kpi.status);
                        const isInProgress = kpi.status === 'in-progress';
                        const isPendingApproval = kpi.status === 'pending-approval';
                        const needsReview = kpi.status === 'completed' || isPendingApproval;
                        const isClickable = needsReview;
                        const roleIndex = project.roles.indexOf(role);

                        return (
                          <div
                            key={kpi.id}
                            className={`border rounded-lg p-3 transition-all ${
                              isClickable ? 'cursor-pointer hover:shadow-md hover:border-brand-300' : ''
                            } ${
                              kpi.status === 'approved'
                                ? 'bg-emerald-50 border-emerald-200'
                                : kpi.status === 'completed' || isPendingApproval
                                ? 'bg-amber-50 border-amber-200'
                                : kpi.status === 'in-progress'
                                ? 'bg-brand-50 border-brand-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                            onClick={() => {
                              if (isClickable) {
                                openReviewModal(roleIndex, index);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-slate-900">KPI {index + 1}: {kpi.name}</span>
                                  <Badge variant={kpiStatus.variant as any} className="text-xs">
                                    {kpiStatus.text}
                                  </Badge>
                                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                    {kpi.percentage}%
                                  </span>
                                </div>
                                {kpi.description && (
                                  <p className="text-xs text-slate-600">{kpi.description}</p>
                                )}
                              </div>
                            </div>

                            {kpi.deadline && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Deadline: {new Date(kpi.deadline).toLocaleDateString()}</span>
                              </div>
                            )}

                            {kpi.completedAt && (
                              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Completed: {new Date(kpi.completedAt).toLocaleDateString()}</span>
                              </div>
                            )}

                            {isInProgress && kpi.deadline && (
                              <div className="flex items-center gap-1.5 text-brand-600 mt-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs">
                                  Due: {new Date(kpi.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}

                            {isPendingApproval && kpi.deliverables && (
                              <div className="flex items-center gap-1.5 text-amber-700 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-xs">Deliverables submitted</span>
                              </div>
                            )}

                            {isClickable && (
                              <div className="flex items-center gap-1 text-amber-700 text-xs mt-2">
                                <span>
                                  {isPendingApproval ? 'Click to review & approve/reject' : 'Click to review'}
                                </span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}

                            {isInProgress && (
                              <div className="mt-2 pt-2 border-t border-brand-200/50">
                                <div className="w-full bg-brand-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
                                </div>
                              </div>
                            )}

                            {kpi.yield !== undefined && kpi.status === 'approved' && (
                              <div className="mt-2 text-xs">
                                <span className={`font-medium ${kpi.yield >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  Yield: {kpi.yield >= 0 ? '+' : ''}{kpi.yield}%
                                </span>
                              </div>
                            )}

                            {kpi.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                <p className="font-medium mb-1">Rejection Reason:</p>
                                <p>{kpi.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Owner</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {(project.ownerEns || project.owner).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {project.ownerEns || `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}`}
                  </p>
                  <p className="text-xs text-slate-500">Creator</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Budget Breakdown</h3>
            <div className="space-y-3">
              {project.roles.map((role) => (
                <div key={role.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{role.title}</p>
                    <p className="text-xs text-slate-500">{role.kpis.length} KPIs</p>
                  </div>
                  <p className="text-sm font-bold text-brand-600">
                    {role.budget.toLocaleString()} {role.currency}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold text-brand-600">
                  {project.totalBudget.toLocaleString()} {project.currency}
                </span>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mock Data Mode</h3>
            <p className="text-sm text-slate-600 mb-4">
              This project is showing mock data. Deploy a project to the ProjectLance contract to see real blockchain data.
            </p>
            <Button
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => router.push('/PO/projects')}
            >
              Back to Projects
            </Button>
          </Card>
        </div>
      </div>

      {/* KPI Review Modal */}
      {selectedKPI && (
        <KPIReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedKPI(null);
          }}
          projectId={project.id}
          roleTitle={project.roles[selectedKPI.roleIndex].title}
          roleBudget={project.roles[selectedKPI.roleIndex].budget}
          kpi={project.roles[selectedKPI.roleIndex].kpis[selectedKPI.kpiIndex]}
          freelancerEns={project.roles[selectedKPI.roleIndex].assignedToEns}
          currency={project.currency}
          onSuccess={() => {
            // Refresh logic could go here
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
