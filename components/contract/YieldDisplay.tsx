/**
 * Yield Display Component - ProjectLance Integration
 *
 * This component displays yield information from the ProjectLance smart contract.
 * It can be used in both PO and FL dashboards and portfolio pages.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  usePLYield,
  usePLProjectCount,
  usePLProject,
  usePLAllMilestones,
  usePLVaultBalance,
  usePLLendingBalance,
} from '@/lib/hooks';
import { formatCurrency } from '@/lib/mockData';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';

interface YieldDisplayProps {
  projectId?: bigint;
  role?: 'PO' | 'FL';
  variant?: 'card' | 'compact' | 'detailed';
}

/**
 * Main yield display component that fetches data from ProjectLance contract
 */
export function YieldDisplay({ projectId, role = 'PO', variant = 'card' }: YieldDisplayProps) {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If projectId is provided, get specific project yield
  const projectYield = projectId ? usePLYield(projectId) : null;
  const projectData = projectId ? usePLProject(projectId) : null;
  const milestones = projectId ? usePLAllMilestones(projectId) : null;

  // Otherwise, get all projects for the user
  const projectCount = usePLProjectCount();

  if (!mounted) return null;

  // Compact variant for dashboard cards
  if (variant === 'compact') {
    return <CompactYieldDisplay yieldData={projectYield} role={role} />;
  }

  // Detailed variant for portfolio pages
  if (variant === 'detailed') {
    return <DetailedYieldDisplay yieldData={projectYield} milestones={milestones} projectData={projectData} />;
  }

  // Default card variant
  return <CardYieldDisplay yieldData={projectYield} projectData={projectData} role={role} />;
}

/**
 * Compact yield display for dashboard cards
 */
function CompactYieldDisplay({
  yieldData,
  role,
}: {
  yieldData: ReturnType<typeof usePLYield> | null;
  role: 'PO' | 'FL';
}) {
  if (!yieldData) {
    return (
      <div className="text-sm text-slate-500">
        No yield data available. Connect wallet to view yield.
      </div>
    );
  }

  if (yieldData.isLoading) {
    return <div className="text-sm text-slate-500">Loading yield data...</div>;
  }

  const { vaultAmount, lendingAmount, yieldPercentage, totalValue } = yieldData;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Deposited</span>
        <span className="text-sm font-bold text-slate-800">
          <CurrencyDisplay amount={formatCurrency(Number(vaultAmount || 0) / 1e6, 'IDRX')} currency="IDRX" />
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">LP (10%)</span>
        <span className="text-sm font-bold text-blue-700">
          <CurrencyDisplay amount={formatCurrency(Number(lendingAmount || 0) / 1e6, 'IDRX')} currency="IDRX" />
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Yield</span>
        <span className={`text-sm font-bold ${yieldPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {yieldPercentage >= 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Card yield display for main dashboard cards
 */
function CardYieldDisplay({
  yieldData,
  projectData,
  role,
}: {
  yieldData: ReturnType<typeof usePLYield> | null;
  projectData: ReturnType<typeof usePLProject> | null;
  role: 'PO' | 'FL';
}) {
  if (!yieldData) {
    return (
      <div className="text-sm text-slate-500">
        Connect wallet to view your yield performance
      </div>
    );
  }

  if (yieldData.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const { vaultAmount, lendingAmount, lendingPrincipal, yieldPercentage, totalValue } = yieldData;

  // Calculate yield amount
  const yieldAmount = lendingAmount && lendingPrincipal
    ? (lendingAmount - lendingPrincipal)
    : BigInt(0);

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-slate-800">
            {vaultAmount ? formatCurrency(Number(vaultAmount) / 1e6, 'IDRX') : '0'}
          </p>
          <p className="text-xs text-slate-600">Deposited</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-blue-700">
            {lendingAmount ? formatCurrency(Number(lendingAmount) / 1e6, 'IDRX') : '0'}
          </p>
          <p className="text-xs text-blue-600">LP Balance</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className={`text-sm font-bold ${yieldPercentage >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {yieldPercentage >= 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
          </p>
          <p className="text-xs text-emerald-600">Yield Rate</p>
        </div>
      </div>

      {/* Additional info for detailed view */}
      {role === 'FL' && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Last milestone gets full LP allocation + yield. Only yield is split 40-40-20.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Detailed yield display for portfolio pages
 */
function DetailedYieldDisplay({
  yieldData,
  milestones,
  projectData,
}: {
  yieldData: ReturnType<typeof usePLYield> | null;
  milestones: ReturnType<typeof usePLAllMilestones> | null;
  projectData: ReturnType<typeof usePLProject> | null;
}) {
  if (!yieldData || !milestones || !projectData) {
    return (
      <div className="text-sm text-slate-500">
        Loading detailed yield data...
      </div>
    );
  }

  if (yieldData.isLoading || milestones.isLoading || projectData.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const { vaultAmount, lendingAmount, lendingPrincipal, yieldPercentage, totalValue } = yieldData;

  // Get milestone data for progress calculation
  const milestoneData = (milestones.milestones as any[]) || [];
  const completedMilestones = milestoneData.filter((m: any) => m.released).length;
  const totalMilestones = milestoneData.length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-slate-800">
            {vaultAmount ? formatCurrency(Number(vaultAmount) / 1e6, 'IDRX') : '0'}
          </p>
          <p className="text-xs text-slate-600">Vault Balance</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-blue-700">
            {lendingAmount ? formatCurrency(Number(lendingAmount) / 1e6, 'IDRX') : '0'}
          </p>
          <p className="text-xs text-blue-600">LP Balance</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className={`text-sm font-bold ${yieldPercentage >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {yieldPercentage >= 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
          </p>
          <p className="text-xs text-emerald-600">Yield Rate</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-purple-700">
            {completedMilestones}/{totalMilestones}
          </p>
          <p className="text-xs text-purple-600">Milestones</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>Project Progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestone Breakdown */}
      {milestoneData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Milestone Breakdown</h4>
          {milestoneData.map((m: any, index: number) => {
            const isLast = index === milestoneData.length - 1;
            const status = m.released ? 'Withdrawn' : m.accepted ? 'Approved' : m.submissionTime > 0 ? 'Submitted' : 'Pending';

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.released ? 'bg-emerald-100 text-emerald-700' :
                    m.accepted ? 'bg-blue-100 text-blue-700' :
                    m.submissionTime > 0 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Milestone {index + 1}</p>
                    <p className="text-xs text-slate-600">
                      {Number(m.percentage) / 100}% {isLast && '(includes LP + yield)'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    m.released ? 'bg-emerald-100 text-emerald-700' :
                    m.accepted ? 'bg-blue-100 text-blue-700' :
                    m.submissionTime > 0 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get yield data for multiple projects
 */
export function useMultiProjectYield(projectIds: bigint[]) {
  const yieldDataArray = projectIds.map(id => usePLYield(id));

  const totalVault = yieldDataArray.reduce((sum, data) => sum + (data.vaultAmount || BigInt(0)), BigInt(0));
  const totalLending = yieldDataArray.reduce((sum, data) => sum + (data.lendingAmount || BigInt(0)), BigInt(0));
  const totalLendingPrincipal = yieldDataArray.reduce((sum, data) => sum + (data.lendingPrincipal || BigInt(0)), BigInt(0));
  const totalValue = yieldDataArray.reduce((sum, data) => sum + (data.totalValue || BigInt(0)), BigInt(0));

  // Calculate weighted average yield percentage
  let totalYieldRate = 0;
  let validProjects = 0;
  yieldDataArray.forEach(data => {
    if (data.yieldPercentage !== undefined && data.yieldPercentage !== null) {
      totalYieldRate += data.yieldPercentage;
      validProjects++;
    }
  });
  const avgYieldRate = validProjects > 0 ? totalYieldRate / validProjects : 0;

  return {
    totalVault,
    totalLending,
    totalLendingPrincipal,
    totalValue,
    avgYieldRate,
    isLoading: yieldDataArray.some(data => data.isLoading),
  };
}
