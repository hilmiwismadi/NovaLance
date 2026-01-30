'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { getPOProjectById, formatCurrency } from '@/lib/mockData';
import { useDepositKPI, useApproveKPI, useCancelProject, useTransactionWait } from '@/lib/hooks';
import {
  usePLDepositFunds,
  usePLAcceptMilestone,
  usePLAllMilestones,
  usePLVaultBalance,
  usePLLendingBalance,
} from '@/lib/hooks';
import KPIReviewModal from '@/components/po/KPIReviewModal';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showSuccess,
  showError,
} from '@/lib/transactions';

export default function POProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [approveKPIModalOpen, setApproveKPIModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedKPI, setSelectedKPI] = useState<{ roleIndex: number; kpiIndex: number } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Auto-expand roles that have KPIs pending approval
  useEffect(() => {
    if (project) {
      const rolesWithPendingApproval = project.roles
        .filter((r) => r.kpis.some((k) => k.status === 'pending-approval' || k.status === 'completed'))
        .map((r) => r.id);

      if (rolesWithPendingApproval.length > 0) {
        setExpandedRoles(new Set(rolesWithPendingApproval));
      }
    }
  }, [project]);

  // Smart contract hooks
  const { deposit: depositKPI, approveToken, isPending, error, hash, isSuccess } = useDepositKPI();
  const { approve: approveKPIContract, isPending: isApprovePending, error: approveError, hash: approveHash, isSuccess: isApproveSuccess } = useApproveKPI();
  const { cancel: cancelProject, isPending: isCancelPending, error: cancelError, hash: cancelHash, isSuccess: isCancelSuccess } = useCancelProject();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash ?? undefined);
  const { isLoading: isCancelConfirming, isSuccess: isCancelConfirmed } = useTransactionWait(cancelHash ?? undefined);

  // ProjectLance hooks for milestone-based projects
  const projectLanceId = BigInt(parseInt(projectId) || 1);
  const { deposit: depositFunds } = usePLDepositFunds();
  const { accept: acceptMilestone } = usePLAcceptMilestone();
  const { milestones, isLoading: isMilestonesLoading } = usePLAllMilestones(projectLanceId);
  const { balance: vaultBalance } = usePLVaultBalance(projectLanceId);
  const { balance: lendingBalance } = usePLLendingBalance(projectLanceId);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      showTransactionPending(hash, 'Deposit to Escrow', chain?.id || 84532);
    }
  }, [isSuccess, hash, chain]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Funds deposited successfully!');
      setDepositModalOpen(false);
      // TODO: Refresh project data from smart contract
      // For now, just show success
    }
  }, [isConfirmed, hash]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to deposit funds');
    }
  }, [error, hash]);

  // Handle approve transaction success
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      showTransactionPending(approveHash, 'Approve KPI', chain?.id || 84532);
    }
  }, [isApproveSuccess, approveHash, chain]);

  // Handle approve transaction confirmation
  useEffect(() => {
    if (isApproveConfirmed && approveHash) {
      showTransactionSuccess(approveHash, 'KPI approved successfully!');
      setApproveKPIModalOpen(false);
      setSelectedKPI(null);
      // TODO: Refresh project data from smart contract
    }
  }, [isApproveConfirmed, approveHash]);

  // Handle approve transaction error
  useEffect(() => {
    if (approveError) {
      showTransactionError(approveHash || '0x0', approveError, 'Failed to approve KPI');
    }
  }, [approveError, approveHash]);

  // Handle cancel transaction success
  useEffect(() => {
    if (isCancelSuccess && cancelHash) {
      showTransactionPending(cancelHash, 'Cancel Project', chain?.id || 84532);
    }
  }, [isCancelSuccess, cancelHash, chain]);

  // Handle cancel transaction confirmation
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

  // Handle cancel transaction error
  useEffect(() => {
    if (cancelError) {
      showTransactionError(cancelHash || '0x0', cancelError, 'Failed to cancel project');
    }
  }, [cancelError, cancelHash]);

  if (!mounted) return null;

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

  const handleDeposit = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to deposit funds');
      return;
    }

    if (!project) return;

    try {
      // Calculate total budget for all KPIs
      let totalDeposit = 0;

      for (const role of project.roles) {
        for (const kpi of role.kpis) {
          if (kpi.status === 'pending') {
            const kpiAmount = (role.budget * kpi.percentage) / 100;
            totalDeposit += kpiAmount;
          }
        }
      }

      if (totalDeposit <= 0) {
        showError('No KPIs to Fund', 'All KPIs are already funded or in progress');
        setDepositModalOpen(false);
        return;
      }

      showInfo('Depositing to Escrow', 'Preparing transaction...');

      // For simplicity, we're depositing for all KPIs at once
      // In production, you might want to do this KPI by KPI or role by role
      // Here we'll use the first pending KPI as an example
      const firstPendingKPI = project.roles
        .flatMap((r) => r.kpis.map((k) => ({ kpi: k, role: r })))
        .find(({ kpi }) => kpi.status === 'pending');

      if (!firstPendingKPI) {
        showError('No KPIs to Fund', 'All KPIs are already funded');
        setDepositModalOpen(false);
        return;
      }

      const kpiAmount = (firstPendingKPI.role.budget * firstPendingKPI.kpi.percentage) / 100;

      // TODO: Check and handle token approval if needed for ERC20 tokens
      // For now, assuming USDC/IDRX has infinite approval or is handled elsewhere

      await depositKPI({
        projectId: projectId as `0x${string}`,
        kpiId: firstPendingKPI.kpi.id as `0x${string}`,
        amount: kpiAmount,
        currency: project.currency,
      });

      // Transaction submitted - will be handled by useEffect below
    } catch (err) {
      const error = err as Error;
      showTransactionError(hash || '0x0', error, 'Failed to deposit');
      setDepositModalOpen(false);
    }
  };

  const handleApproveKPI = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to approve KPIs');
      return;
    }

    if (!selectedKPI || !project) return;

    const { roleIndex, kpiIndex } = selectedKPI;
    const role = project.roles[roleIndex];
    const kpi = role.kpis[kpiIndex];

    try {
      showInfo('Approving KPI', 'Processing approval...');

      await approveKPIContract({
        projectId: projectId as `0x${string}`,
        kpiId: kpi.id as `0x${string}`,
        isPO: true, // This is PO approval
      });

      // Transaction submitted - will be handled by useEffect below
    } catch (err) {
      const error = err as Error;
      showTransactionError(approveHash || '0x0', error, 'Failed to approve KPI');
      setApproveKPIModalOpen(false);
      setSelectedKPI(null);
    }
  };

  // Cancel Project Handlers
  const handleCancelProject = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to cancel project');
      return;
    }

    if (!project) return;

    if (!cancelReason.trim()) {
      showError('Reason Required', 'Please provide a reason for cancellation');
      return;
    }

    try {
      showInfo('Cancelling Project', 'Processing cancellation...');

      await cancelProject({
        projectId: projectId as `0x${string}`,
        reason: cancelReason,
      });

      // Transaction submitted - will be handled by useEffect below
    } catch (err) {
      const error = err as Error;
      showTransactionError(cancelHash || '0x0', error, 'Failed to cancel project');
    }
  };

  const openApproveModal = (roleIndex: number, kpiIndex: number) => {
    const kpi = project.roles[roleIndex].kpis[kpiIndex];
    setSelectedKPI({ roleIndex, kpiIndex });

    // Use review modal for pending-approval KPIs, legacy modal for completed
    if (kpi.status === 'pending-approval') {
      setReviewModalOpen(true);
    } else {
      setApproveKPIModalOpen(true);
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

  const hiredRoles = project.roles.filter(r => r.assignedTo);
  const hiringRoles = project.roles.filter(r => r.status === 'hiring');
  const visibleFeatures = featuresExpanded ? project.features : project.features?.slice(0, 3);

  const getKPIYield = (kpi: any, role: any) => {
    if (kpi.status === 'approved') {
      const baseAmount = (role.budget * kpi.percentage) / 100;
      // Use the yield from KPI if available, otherwise default to 0
      const yieldPercent = kpi.yield !== undefined ? kpi.yield : 0;
      const yieldAmount = baseAmount * (yieldPercent / 100);
      const totalAmount = baseAmount + yieldAmount;

      return {
        baseAmount,
        yieldPercent,
        yieldAmount,
        totalAmount,
        formattedBase: formatCurrency(baseAmount, project.currency),
        formattedTotal: formatCurrency(totalAmount, project.currency),
      };
    }
    return null;
  };

  const getYieldColor = (yieldPercent: number) => {
    if (yieldPercent < 0) return 'text-red-600';
    if (yieldPercent < 5) return 'text-amber-600';
    if (yieldPercent < 10) return 'text-emerald-600';
    return 'text-emerald-500';
  };

  const getYieldIcon = (yieldPercent: number) => {
    if (yieldPercent < 0) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    if (yieldPercent < 5) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* Header - Match applications page style */}
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
            <Badge variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
              {project.status === 'in-progress' ? 'Active' : project.status}
            </Badge>
            {project.currency && (
              <span className="text-[10px] sm:text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {project.currency}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Total Budget</p>
            <p className="text-base sm:text-lg font-bold text-brand-600">
              <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Team Roles</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{project.roles.length}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Hired</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">{hiredRoles.length}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Hiring</p>
            <p className="text-base sm:text-lg font-bold text-amber-600">{hiringRoles.length}</p>
          </div>
        </div>
      </Card>

      {/* Description Card - Collapsible */}
      <Card className="p-4 sm:p-5">
        <button
          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">About This Project</h3>
              <p className="text-xs text-slate-500">Description & details</p>
            </div>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${descriptionExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {descriptionExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
          </div>
        )}
      </Card>

      {/* Timeline Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">Project Timeline</p>
              <div className="flex items-center gap-2 mt-0.5">
                {project.startDate && (
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {project.endDate && (
                  <>
                    <div className="flex items-center gap-1 overflow-hidden">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-brand-400 to-brand-300 rounded" />
                      <svg className="w-4 h-4 text-brand-500 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="w-8 h-0.5 bg-gradient-to-r from-brand-300 to-brand-200 rounded" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Duration badge */}
          {project.startDate && project.endDate && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-slate-700">
                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Features Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Features</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {project.features?.length || 0}
            </span>
          </div>

          {project.features && project.features.length > 3 && (
            <button
              onClick={() => setFeaturesExpanded(!featuresExpanded)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              {featuresExpanded ? (
                <>
                  Show less
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Show {project.features.length - 3} more
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visibleFeatures?.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm bg-slate-50 hover:bg-brand-50/50 transition-colors px-3 py-2 rounded-lg border border-slate-200/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              <span className="text-slate-700 truncate">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Roles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Team Roles</h2>
            <span className="text-sm text-slate-500">({project.roles.length})</span>
          </div>

          {project.roles.map((role, roleIndex) => {
            const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
            const totalKPIs = role.kpis.length;
            const progress = totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0;
            const isExpanded = expandedRoles.has(role.id);

            return (
              <Card key={role.id} className="overflow-hidden">
                {/* Brief View - Always Visible */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Title and status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{role.title}</h3>
                        <Badge
                          variant={role.status === 'in-progress' ? 'warning' : role.status === 'hiring' ? 'pending' : 'success'}
                          className="text-xs flex-shrink-0"
                        >
                          {role.status === 'in-progress' ? 'Active' : role.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-1 sm:line-clamp-2">{role.description}</p>

                      {/* Skills - Mobile friendly */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {role.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md border border-brand-100">
                            {skill}
                          </span>
                        ))}
                        {role.skills.length > 3 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            +{role.skills.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Assigned freelancer or hiring status */}
                      {role.assignedToEns ? (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{role.assignedToEns[0]}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-900 font-medium truncate">{role.assignedToEns}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-3 text-amber-600">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs">Looking for freelancer...</span>
                        </div>
                      )}
                    </div>

                    {/* Budget */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="text-base sm:text-lg font-bold text-brand-600">
                        <CurrencyDisplay amount={formatCurrency(role.budget, 'IDRX')} currency="IDRX" />
                      </p>
                      {/* Show indicator if KPIs need approval */}
                      {role.kpis.some(k => k.status === 'pending-approval' || k.status === 'completed') && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Needs Review</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse Button - Full width at bottom */}
                  <button
                    onClick={() => toggleRoleExpanded(role.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all border border-brand-200 hover:border-brand-300"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Progress & KPIs</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View Progress & KPIs</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Section - Progress & KPIs */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/30">
                    {/* KPIs Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-slate-900">Progress</span>
                        <span className="text-sm font-semibold text-brand-600">{completedKPIs}/{totalKPIs} KPIs</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* KPIs List */}
                    <div className="space-y-2">
                  {role.kpis.map((kpi, kpiIndex) => {
                    const yieldAmount = getKPIYield(kpi, role);
                    const isInProgress = kpi.status === 'in-progress';
                    const isPendingApproval = kpi.status === 'pending-approval';
                    const needsReview = kpi.status === 'completed' || isPendingApproval;
                    const isClickable = needsReview;

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
                            setSelectedKPI({ roleIndex, kpiIndex });
                            setReviewModalOpen(true);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-slate-900 text-sm truncate">{kpi.name}</h4>

                              {/* Status badge */}
                              {kpi.status === 'approved' ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : isPendingApproval ? (
                                <Badge variant="warning" className="text-xs">
                                  Needs Approval
                                </Badge>
                              ) : kpi.status === 'completed' ? (
                                <Badge variant="warning" className="text-xs">
                                  Ready for Review
                                </Badge>
                              ) : isInProgress ? (
                                <div className="flex items-center gap-1.5 text-brand-600">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                </div>
                              ) : (
                                <Badge variant="default" className="text-xs">
                                  {kpi.status}
                                </Badge>
                              )}

                              <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full">
                                {kpi.percentage}%
                              </span>
                            </div>

                            {kpi.description && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-1">{kpi.description}</p>
                            )}

                            {/* Show deliverables info if submitted */}
                            {isPendingApproval && kpi.deliverables && (
                              <div className="flex items-center gap-1.5 text-amber-700 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-xs">Deliverables submitted</span>
                              </div>
                            )}

                            {/* Click indicator for review */}
                            {isClickable && (
                              <div className="flex items-center gap-1 text-amber-700 text-xs mt-1">
                                <span>
                                  {isPendingApproval ? 'Click to review & approve/reject' : 'Click to review'}
                                </span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}

                            {/* Yield info for approved KPIs */}
                            {yieldAmount && (
                              <div className={`flex items-center gap-2 ${getYieldColor(yieldAmount.yieldPercent)}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-semibold">
                                  {yieldAmount.yieldPercent.toFixed(2)}% yield • {yieldAmount.formattedTotal}
                                </span>
                              </div>
                            )}

                            {/* Deadline for in-progress KPIs */}
                            {isInProgress && kpi.deadline && (
                              <div className="flex items-center gap-1.5 text-brand-600 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs">
                                  Due: {new Date(kpi.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action button or click indicator */}
                          {isClickable && (
                            <div className="flex items-center gap-1 text-amber-700 text-xs">
                              <span>Review</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Animated progress bar for in-progress KPIs */}
                        {isInProgress && (
                          <div className="mt-2 pt-2 border-t border-brand-200/50">
                            <div className="w-full bg-brand-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
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
          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Budget</h3>
            <div className="space-y-3 mb-4">
              {project.roles.map((role, i) => (
                <div key={role.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{role.title || `Role ${i + 1}`}</span>
                  <span className="font-medium text-slate-900 flex-shrink-0 inline-flex items-center gap-1">
                    <CurrencyDisplay amount={formatCurrency(role.budget, 'IDRX')} currency="IDRX" />
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-brand-600">
                <CurrencyDisplay amount={formatCurrency(project.totalBudget, 'IDRX')} currency="IDRX" />
              </span>
            </div>

            <Button variant="primary" className="w-full mt-4" onClick={() => setDepositModalOpen(true)}>
              Deposit to Escrow
            </Button>
          </Card>

          {/* Team Status */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Team Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Roles</span>
                <span className="font-medium text-slate-900">{project.roles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hired</span>
                <span className="font-medium text-emerald-600">{hiredRoles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hiring</span>
                <span className="font-medium text-amber-600">{hiringRoles.length}</span>
              </div>
            </div>

            {hiringRoles.length > 0 && (
              <Link href={`/PO/projects/${project.id}/applications`} className="block mt-4">
                <Button variant="primary" className="w-full">
                  View Applications
                </Button>
              </Link>
            )}
          </Card>

          {/* Cancel Project Card */}
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Project</h3>
            <p className="text-sm text-slate-600 mb-4">
              Permanently cancel this project and refund remaining funds.
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
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit to Escrow">
        <div className="space-y-4">
          <p className="text-slate-600">
            Funds will be automatically split between escrow and yield generation.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Total project budget:</span>
              <span className="font-semibold text-slate-900 inline-flex items-center gap-1">
                <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Vault (Escrow - 90%):</span>
                <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                  <CurrencyDisplay amount={formatCurrency(project.totalBudget * 0.9, project.currency)} currency={project.currency} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">LP Allocation (10%):</span>
                <span className="font-semibold text-blue-600 inline-flex items-center gap-1">
                  <CurrencyDisplay amount={formatCurrency(project.totalBudget * 0.1, project.currency)} currency={project.currency} />
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-800">
                <strong>LP Allocation:</strong> 10% of each deposit is allocated to DeFi protocols (Aave, Nusa Finance, or Morpho) to generate yield.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDepositModalOpen(false)} className="flex-1" disabled={isPending || isConfirming}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeposit} className="flex-1" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Depositing...
                </span>
              ) : (
                'Deposit'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* KPI Review Modal - for pending-approval and completed KPIs */}
      {selectedKPI && project && (
        <KPIReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedKPI(null);
          }}
          projectId={projectId}
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

      {/* Legacy Approve KPI Modal - kept for backwards compatibility */}
      <Modal isOpen={approveKPIModalOpen} onClose={() => setApproveKPIModalOpen(false)} title="Approve KPI">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to approve this KPI and release the payment to the freelancer?
          </p>

          {selectedKPI && project && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">KPI:</span>
                <span className="font-medium text-slate-900">{project.roles[selectedKPI.roleIndex].kpis[selectedKPI.kpiIndex].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Role:</span>
                <span className="font-medium text-slate-900">{project.roles[selectedKPI.roleIndex].title}</span>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yield Distribution (upon FL approval):</p>
            <div className="space-y-1 text-xs text-emerald-700">
              <div className="flex justify-between">
                <span>• PO Share (40% of yield):</span>
                <span className="font-semibold">Your yield earnings</span>
              </div>
              <div className="flex justify-between">
                <span>• FL Share (40% of yield):</span>
                <span className="font-semibold">Freelancer bonus</span>
              </div>
              <div className="flex justify-between">
                <span>• Platform Fee (20% of yield):</span>
                <span className="font-semibold">NovaLance fee</span>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              Note: If yield is negative, freelancer bears the loss. You receive your principal back.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. Payment will be released from escrow after both approvals.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApproveKPIModalOpen(false)} className="flex-1" disabled={isApprovePending || isApproveConfirming}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleApproveKPI} className="flex-1" disabled={isApprovePending || isApproveConfirming}>
              {isApprovePending || isApproveConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Approving...
                </span>
              ) : (
                'Approve'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Project Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Project">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to cancel this project? This action cannot be undone.
          </p>

          {/* Cancellation Breakdown */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-900">Refund Breakdown</h4>

            {/* Scenario A: Before KPI completion */}
            {project.roles.every(r => r.kpis.every(k => k.status !== 'approved' && k.status !== 'completed')) ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Vault Refund (90%):</span>
                  <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                    <CurrencyDisplay amount={formatCurrency(project.totalBudget * 0.9, project.currency)} currency={project.currency} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">LP Allocation (10%):</span>
                  <span className="font-semibold text-blue-600">Platform keeps</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  No KPIs have been completed. You'll receive 90% of deposits back.
                </p>
              </div>
            ) : (
              /* Scenario B: After some KPIs completed */
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Completed KPIs:</span>
                  <span className="font-semibold text-emerald-600">Paid to freelancers</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Remaining Vault:</span>
                  <span className="font-semibold text-brand-600">Refunded to you</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">LP Allocation (10%):</span>
                  <span className="font-semibold text-blue-600">Platform keeps</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Some KPIs are completed. Freelancers will be paid for completed work.
                </p>
              </div>
            )}
          </div>

          {/* Reason Input */}
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
              <strong>Warning:</strong> This will permanently cancel the project. All remaining funds will be refunded according to the breakdown above.
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

      <style jsx>{`
        @keyframes slideRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        .animate-slide-right {
          animation: slideRight 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
