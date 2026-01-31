'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import {
  usePLProjectCount,
  usePLProject,
  usePLAllMilestones,
  usePLWithdrawalAmounts,
  usePLWithdrawMilestone,
  useTransactionWait,
} from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

// Project data interface for contract data
interface ContractProject {
  id: bigint;
  creator: string;
  freelancer: string;
  status: number;
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
}

// Custom hook to fetch projects where FL is the freelancer
function useFLProjectsForPortfolio(maxProjects: number = 50) {
  const { address, chain } = useAccount();
  const [projects, setProjects] = useState<ContractProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !chain) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { getContractAddresses } = await import('@/lib/contract-adapter');
        const { PROJECTLANCE_ABI } = await import('@/lib/abi');
        const { createPublicClient, http } = await import('viem');

        const publicClient = createPublicClient({
          chain: chain,
          transport: http()
        });

        const addresses = getContractAddresses(chain.id);
        const projectLanceAddress = addresses.projectLance;

        // Fetch all projects in parallel
        const projectPromises = [];
        for (let i = 0; i < maxProjects; i++) {
          projectPromises.push(
            publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'getProject',
              args: [BigInt(i)]
            }).catch(() => null)
          );
        }

        const results = await Promise.all(projectPromises);

        const flProjects: ContractProject[] = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i] as any[] | null;
          if (!result) continue;

          const creator = result[0] as string;
          const freelancer = result[1] as string;
          const status = result[2] as number;
          const totalDeposited = result[3] as bigint;
          const vaultAmount = result[4] as bigint;
          const lendingAmount = result[5] as bigint;
          const milestoneCount = result[6] as bigint;

          // Only include projects where user is the freelancer
          if (freelancer && freelancer.toLowerCase() === address.toLowerCase()) {
            flProjects.push({
              id: BigInt(i),
              creator,
              freelancer,
              status,
              totalDeposited,
              vaultAmount,
              lendingAmount,
              milestoneCount,
            });
          }
        }

        setProjects(flProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [address, chain, maxProjects]);

  return { projects, isLoading };
}

// Milestone data from contract
type MilestoneData = {
  deadline: bigint;
  percentage: bigint;
  released: boolean;
  accepted: boolean;
  submissionTime: bigint;
  actualAmount: bigint;
  yieldAmount: bigint;
  isLastMilestone: boolean;
};

interface ChartDataPoint {
  date: string;
  totalDeposited: number;
  totalYield: number;
  yieldRate: number;
}

// Generate chart data based on actual project data
const generateChartData = (projects: ContractProject[]): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60); // 60 days back

  let totalDeposited = projects.reduce((sum, p) => sum + Number(p.vaultAmount + p.lendingAmount), 0);

  // Generate data points for the last 60 days
  for (let i = 0; i <= 15; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 4));

    const lpAmount = totalDeposited * 0.1;
    // Simple yield calculation for demo - 8% APY
    const daysElapsed = i * 4;
    const dailyYield = (lpAmount * (8 / 100)) / 365;
    const totalYield = Math.round(dailyYield * daysElapsed);

    const overallYieldRate = lpAmount > 0 ? (totalYield / lpAmount) * 100 : 0;

    data.push({
      date: date.toISOString().split('T')[0],
      totalDeposited,
      totalYield,
      yieldRate: parseFloat(overallYieldRate.toFixed(2)),
    });
  }

  return data;
};

type StatusFilter = 'all' | 'withdrawable' | 'in-progress';

// Memoized yield card component for milestones
const MilestoneYieldCard = memo(({
  projectId,
  milestoneIndex,
  milestone,
  isWithdrawable,
}: {
  projectId: bigint;
  milestoneIndex: number;
  milestone: MilestoneData;
  isWithdrawable: boolean;
}) => {
  const { amounts } = usePLWithdrawalAmounts(projectId, BigInt(milestoneIndex));
  const { project } = usePLProject(projectId);
  const { withdraw, isPending, error, hash, isSuccess } = usePLWithdrawMilestone();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      const chainId = 84532;
      showTransactionPending(hash, 'Withdraw Milestone', chainId);
    }
  }, [isSuccess, hash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Milestone withdrawn successfully!');
    }
  }, [isConfirmed, hash]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to withdraw milestone');
    }
  }, [error, hash]);

  const handleWithdraw = async () => {
    if (!isWithdrawable) return;

    try {
      await withdraw(projectId, BigInt(milestoneIndex));
    } catch (err) {
      const error = err as Error;
      showError('Withdrawal Failed', error.message);
    }
  };

  // Calculate totals from withdrawal amounts (amounts is a tuple/array)
  const withdrawalAmounts = amounts as readonly [bigint, bigint, bigint, bigint] | undefined;
  const freelancerVaultAmount = withdrawalAmounts?.[0] ?? BigInt(0);
  const freelancerYieldAmount = withdrawalAmounts?.[3] ?? BigInt(0);
  const totalWithdrawable = freelancerVaultAmount + freelancerYieldAmount;
  const yieldRate = milestone.actualAmount > 0
    ? Number((freelancerYieldAmount * BigInt(10000)) / milestone.actualAmount) / 100
    : 0;

  const isPositive = yieldRate >= 0;

  const projectData = project as any[] | undefined;
  const status = projectData?.[2] ?? 0;

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Hiring';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`flex-shrink-0 w-80 p-4 rounded-xl border-2 transition-all snap-center ${
      isWithdrawable
        ? 'bg-emerald-50 border-emerald-200'
        : milestone.accepted
          ? 'bg-blue-50 border-blue-200'
          : milestone.submissionTime > BigInt(0)
            ? 'bg-amber-50 border-amber-200'
            : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm truncate">
            Project #{projectId} - Milestone {milestoneIndex + 1}
          </h4>
          <p className="text-[10px] text-slate-600 truncate">{getStatusText(status)}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{yieldRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-white/60 rounded-lg p-1.5 text-center">
          <p className="text-[8px] text-slate-600 truncate">Vault</p>
          <p className="text-[9px] font-bold text-slate-900 truncate">
            <CurrencyDisplay amount={formatCurrency(freelancerVaultAmount, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 text-center">
          <p className="text-[8px] text-blue-600 truncate">Yield</p>
          <p className="text-[9px] font-bold text-blue-700 truncate">
            <CurrencyDisplay amount={formatCurrency(freelancerYieldAmount, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className={`rounded-lg p-1.5 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[8px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Total</p>
          <p className={`text-[9px] font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            <CurrencyDisplay amount={formatCurrency(totalWithdrawable, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
      </div>

      {isWithdrawable && (
        <Button
          variant="success"
          size="sm"
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || totalWithdrawable === BigInt(0)}
          className="w-full mt-2 text-xs"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processing...
            </span>
          ) : (
            'Withdraw'
          )}
        </Button>
      )}

      <Badge
        variant={
          isWithdrawable
            ? 'success'
            : milestone.accepted
              ? 'default'
              : milestone.submissionTime > BigInt(0)
                ? 'warning'
                : 'default'
        }
        className="text-[9px] mt-2 w-full justify-center"
      >
        {isWithdrawable
          ? 'Withdrawable'
          : milestone.accepted
            ? 'Accepted'
            : milestone.submissionTime > BigInt(0)
              ? 'Submitted'
              : 'Pending'}
      </Badge>
    </div>
  );
});
MilestoneYieldCard.displayName = 'MilestoneYieldCard';

// Expanded version
const ExpandedMilestoneYieldCard = memo(({
  projectId,
  milestoneIndex,
  milestone,
  isWithdrawable,
}: {
  projectId: bigint;
  milestoneIndex: number;
  milestone: MilestoneData;
  isWithdrawable: boolean;
}) => {
  const { amounts } = usePLWithdrawalAmounts(projectId, BigInt(milestoneIndex));
  const { withdraw, isPending, error, hash, isSuccess } = usePLWithdrawMilestone();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  // Handle transaction feedback
  useEffect(() => {
    if (isSuccess && hash) {
      const chainId = 84532;
      showTransactionPending(hash, 'Withdraw Milestone', chainId);
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Milestone withdrawn successfully!');
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to withdraw milestone');
    }
  }, [error, hash]);

  const handleWithdraw = async () => {
    if (!isWithdrawable) return;

    try {
      await withdraw(projectId, BigInt(milestoneIndex));
    } catch (err) {
      const error = err as Error;
      showError('Withdrawal Failed', error.message);
    }
  };

  // Calculate totals from withdrawal amounts (amounts is a tuple/array)
  const withdrawalAmounts = amounts as readonly [bigint, bigint, bigint, bigint] | undefined;
  const freelancerVaultAmount = withdrawalAmounts?.[0] ?? BigInt(0);
  const freelancerYieldAmount = withdrawalAmounts?.[3] ?? BigInt(0);
  const totalWithdrawable = freelancerVaultAmount + freelancerYieldAmount;
  const yieldRate = milestone.actualAmount > 0
    ? Number((freelancerYieldAmount * BigInt(10000)) / milestone.actualAmount) / 100
    : 0;

  const isPositive = yieldRate >= 0;

  return (
    <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
      isWithdrawable
        ? 'bg-emerald-50 border-emerald-200'
        : milestone.accepted
          ? 'bg-blue-50 border-blue-200'
          : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
            Project #{projectId} - Milestone {milestoneIndex + 1}
          </h4>
        </div>
        <div className="text-right">
          <p className={`text-xl sm:text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{yieldRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
        <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 text-center">
          <p className="text-[9px] sm:text-[10px] text-slate-600">Vault Amount</p>
          <p className="text-[10px] sm:text-xs font-bold text-slate-900">
            <CurrencyDisplay amount={formatCurrency(freelancerVaultAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2 text-center">
          <p className="text-[9px] sm:text-[10px] text-blue-600">Yield (40%)</p>
          <p className="text-[10px] sm:text-xs font-bold text-blue-700">
            <CurrencyDisplay amount={formatCurrency(freelancerYieldAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
          </p>
        </div>
        <div className={`rounded-lg p-1.5 sm:p-2 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[9px] sm:text-[10px] ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>Total</p>
          <p className={`text-[10px] sm:text-xs font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            <CurrencyDisplay amount={formatCurrency(totalWithdrawable, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
          </p>
        </div>
      </div>

      {isWithdrawable && (
        <Button
          variant="success"
          size="sm"
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || totalWithdrawable === BigInt(0)}
          className="w-full text-xs"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processing...
            </span>
          ) : (
            'Withdraw Now'
          )}
        </Button>
      )}
    </div>
  );
});
ExpandedMilestoneYieldCard.displayName = 'ExpandedMilestoneYieldCard';

export default function FLPortfolioContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');
  const [isChartTransitioning, setIsChartTransitioning] = useState(false);
  const [displayedChartData, setDisplayedChartData] = useState<ChartDataPoint[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartDataPoint; x: number; y: number } | null>(null);

  // Get projects where FL is the freelancer
  const { projects: flProjects, isLoading: isProjectsLoading } = useFLProjectsForPortfolio(50);

  // Get all milestones for each project
  const [milestonesMap, setMilestonesMap] = useState<Map<string, MilestoneData[]>>(new Map());

  useEffect(() => {
    setMounted(true);

    // Fetch milestones for all projects
    const fetchMilestones = async () => {
      const map = new Map<string, MilestoneData[]>();

      for (const project of flProjects) {
        try {
          const { getContractAddresses } = await import('@/lib/contract-adapter');
          const { PROJECTLANCE_ABI } = await import('@/lib/abi');
          const { createPublicClient, http } = await import('viem');
          const { baseSepolia } = await import('viem/chains');

          const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http()
          });

          const addresses = getContractAddresses(84532); // Base Sepolia
          const projectLanceAddress = addresses.projectLance;

          const result = await publicClient.readContract({
            address: projectLanceAddress as `0x${string}`,
            abi: PROJECTLANCE_ABI,
            functionName: 'getAllMilestones',
            args: [project.id]
          }) as any[][];

          const milestones: MilestoneData[] = result.map(m => ({
            deadline: m[0] as bigint,
            percentage: m[1] as bigint,
            released: m[2] as boolean,
            accepted: m[3] as boolean,
            submissionTime: m[4] as bigint,
            actualAmount: m[5] as bigint,
            yieldAmount: m[6] as bigint,
            isLastMilestone: m[7] as boolean,
          }));

          map.set(project.id.toString(), milestones);
        } catch (e) {
          console.error(`Failed to load milestones for project ${project.id}:`, e);
        }
      }

      setMilestonesMap(map);
    };

    if (flProjects.length > 0) {
      fetchMilestones();
    }
  }, [flProjects]);

  useEffect(() => {
    const chartData = generateChartData(flProjects);
    setDisplayedChartData(chartData);
  }, [flProjects, selectedTimeframe]);

  // Filter milestones based on status
  const filteredMilestones = useMemo(() => {
    const items: Array<{ projectId: bigint; milestoneIndex: number; milestone: MilestoneData; isWithdrawable: boolean }> = [];

    for (const project of flProjects) {
      const milestones = milestonesMap.get(project.id.toString()) || [];
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const isWithdrawable = milestone.accepted && !milestone.released;

        if (statusFilter === 'all') {
          items.push({ projectId: project.id, milestoneIndex: i, milestone, isWithdrawable });
        } else if (statusFilter === 'withdrawable' && isWithdrawable) {
          items.push({ projectId: project.id, milestoneIndex: i, milestone, isWithdrawable });
        } else if (statusFilter === 'in-progress' && !milestone.released) {
          items.push({ projectId: project.id, milestoneIndex: i, milestone, isWithdrawable });
        }
      }
    }

    return items;
  }, [flProjects, milestonesMap, statusFilter]);

  // Calculate totals
  const portfolioCalculations = useMemo(() => {
    let totalDeposited = BigInt(0);
    let totalLP = BigInt(0);
    let totalYield = BigInt(0);
    let withdrawableBalance = BigInt(0);

    for (const project of flProjects) {
      totalDeposited += project.vaultAmount || BigInt(0);
      totalLP += project.lendingAmount || BigInt(0);

      const milestones = milestonesMap.get(project.id.toString()) || [];
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        if (milestone.accepted && !milestone.released) {
          withdrawableBalance += milestone.actualAmount + milestone.yieldAmount;
        }
        totalYield += milestone.yieldAmount || BigInt(0);
      }
    }

    // Calculate average yield rate
    const avgYieldRate = totalLP > 0 ? Number(totalYield) / Number(totalLP) * 100 : 0;

    return {
      totalDeposited,
      totalLP,
      totalYield,
      avgYieldRate,
      withdrawableBalance: Number(withdrawableBalance) / 1e6,
    };
  }, [flProjects, milestonesMap]);

  // Chart paths
  const chartData = displayedChartData;
  const chartPaths = useMemo(() => {
    const maxYield = Math.max(...chartData.map(p => p.totalYield), 1);
    const areaPath = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1 || 1)) * 100;
      const y = 100 - ((point.totalYield / maxYield) * 60 + 20);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ') + ' L 100,100 L 0,100 Z';

    const linePath = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1 || 1)) * 100;
      const y = 100 - ((point.totalYield / maxYield) * 60 + 20);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return { areaPath, linePath, maxYield };
  }, [chartData]);

  const handlePointClick = useCallback((point: ChartDataPoint, x: number, y: number, event: React.MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    setHoveredPoint({ point, x, y });
  }, []);

  const handleChartClick = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const toggleTimeframe = useCallback((timeframe: '1W' | '1M' | '3M' | 'ALL') => {
    setSelectedTimeframe(timeframe);
  }, []);

  const toggleCardsExpanded = useCallback(() => {
    setIsCardsExpanded(prev => !prev);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as StatusFilter);
  }, []);

  if (!mounted) return null;

  if (isProjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Withdrawable Yield Card */}
      <Card className="p-3 sm:p-4 md:p-6 border-2 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-green-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Withdrawable Yield</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600">Available to withdraw</p>
              </div>
            </div>

            <div className="mb-2 md:mb-4">
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">
                <CurrencyDisplay amount={portfolioCalculations.withdrawableBalance.toFixed(3)} currency="IDRX" />
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mt-1">
                Total from accepted milestones
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="success" size="lg" className="flex-1 text-xs sm:text-sm md:text-base py-2 md:py-3" disabled={portfolioCalculations.withdrawableBalance === 0}>
                {portfolioCalculations.withdrawableBalance > 0 ? 'Withdraw All' : 'No Withdrawable'}
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-1.5 sm:gap-2 w-full md:w-auto">
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-emerald-200">
              <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">Total Deposited</p>
              <p className="text-[10px] sm:text-sm font-bold text-slate-900 truncate">
                <CurrencyDisplay amount={formatCurrency(portfolioCalculations.totalDeposited, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-xs" />
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-blue-200">
              <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">In LP (10%)</p>
              <p className="text-[10px] sm:text-sm font-bold text-blue-700 truncate">
                <CurrencyDisplay amount={formatCurrency(portfolioCalculations.totalLP, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-xs" />
              </p>
            </div>
            <div className={`rounded-lg p-1.5 sm:p-2.5 border ${portfolioCalculations.avgYieldRate >= 0 ? 'bg-white/60 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">Avg Yield</p>
              <p className={`text-[10px] sm:text-sm font-bold truncate ${portfolioCalculations.avgYieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {portfolioCalculations.avgYieldRate >= 0 ? '+' : ''}{portfolioCalculations.avgYieldRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Chart */}
      <Card className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900">
              Portfolio Performance
            </h3>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600">
              Yield growth over time
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              chartData[chartData.length - 1]?.yieldRate >= 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <svg className={`w-3.5 h-3.5 ${chartData[chartData.length - 1]?.yieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={chartData[chartData.length - 1]?.yieldRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
              <span className={`text-xs font-semibold ${chartData[chartData.length - 1]?.yieldRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {chartData[chartData.length - 1]?.yieldRate >= 0 ? '+' : ''}{chartData[chartData.length - 1]?.yieldRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {(['1W', '1M', '3M', 'ALL'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => toggleTimeframe(timeframe)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                    selectedTimeframe === timeframe
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="relative h-48 sm:h-56 md:h-72" onClick={handleChartClick}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flAreaGradientInline" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="flLineGradientInline" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(99 102 241)" />
                <stop offset="50%" stopColor="rgb(16 185 129)" />
                <stop offset="100%" stopColor="rgb(16 185 129)" />
              </linearGradient>
              <filter id="flGlowInline">
                <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {[20, 40, 60, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgb(226 232 240)" strokeWidth="0.3" strokeDasharray="1.5" />
            ))}

            <path d={chartPaths.areaPath} fill="url(#flAreaGradientInline)" className={`transition-all duration-500 ease-out ${isChartTransitioning ? 'opacity-0' : 'opacity-100'}`} />
            <path d={chartPaths.linePath} fill="none" stroke="url(#flLineGradientInline)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#flGlowInline)" className={`transition-all duration-500 ease-out ${isChartTransitioning ? 'opacity-0 scale-y-95' : 'opacity-100 scale-y-100'}`} style={{ transformOrigin: 'bottom' }}>
              <animate attributeName="stroke-width" values="0.8;1.2;0.8" dur="2s" repeatCount="indefinite" />
            </path>

            {chartData.map((point, i) => {
              const x = (i / (chartData.length - 1 || 1)) * 100;
              const y = 100 - ((point.totalYield / chartPaths.maxYield) * 60 + 20);
              const isHovered = hoveredPoint?.point.date === point.date;

              return (
                <g key={`point-${i}`}>
                  <circle cx={x} cy={y} r="3" fill="transparent" className="cursor-pointer" onClick={(e) => handlePointClick(point, x, y, e)} />
                  <circle cx={x} cy={y} r={isHovered ? "1.5" : "1"} fill="rgb(16 185 129)" className={`cursor-pointer transition-all duration-200 ${isChartTransitioning ? 'opacity-0' : 'opacity-100'}`} onClick={(e) => handlePointClick(point, x, y, e)} />
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div className="absolute bg-white rounded-xl shadow-2xl border border-brand-200 p-3 z-50 min-w-[160px]" style={{ left: `${Math.min(Math.max(hoveredPoint.x, 10), 85)}%`, top: `${Math.max(hoveredPoint.y - 20, 8)}%`, transform: 'translate(-50%, -100%)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[9px] text-slate-500 mb-0.5">{new Date(hoveredPoint.point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-base font-bold text-slate-900">${(hoveredPoint.point.totalYield / 1000000).toFixed(2)}</p>
                </div>
                <button onClick={() => setHoveredPoint(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 sm:px-2">
            {chartData.map((point, i) => {
              const showLabel = i % 3 === 0;
              return (
                <div key={point.date} className="flex-1 text-center" style={{ display: showLabel ? 'block' : 'none' }}>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-slate-600 truncate px-0.5">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Yield Performance by Milestone */}
      <Card className={`transition-all duration-500 ${isCardsExpanded ? 'p-6' : 'p-4'}`}>
        <div className={`flex items-start justify-between gap-3 mb-4 ${isCardsExpanded ? '' : 'mb-3'}`}>
          <div>
            <h3 className={`font-bold text-slate-900 ${isCardsExpanded ? 'text-lg' : 'text-base'}`}>Milestone Yield</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="appearance-none pl-9 pr-8 py-2 text-sm font-medium rounded-xl border-2 bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-700 border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="withdrawable">Withdrawable</option>
              <option value="in-progress">In Progress</option>
            </select>
            <button onClick={toggleCardsExpanded} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all">
              <svg className={`w-5 h-5 text-slate-600 transition-transform ${isCardsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {filteredMilestones.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {statusFilter === 'withdrawable'
              ? 'No withdrawable milestones yet'
              : statusFilter === 'in-progress'
                ? 'No milestones in progress'
                : 'No milestones yet'}
          </p>
        ) : isCardsExpanded ? (
          <div className="space-y-4">
            {filteredMilestones.map(({ projectId, milestoneIndex, milestone, isWithdrawable }) => (
              <ExpandedMilestoneYieldCard
                key={`${projectId}-${milestoneIndex}`}
                projectId={projectId}
                milestoneIndex={milestoneIndex}
                milestone={milestone}
                isWithdrawable={isWithdrawable}
              />
            ))}
          </div>
        ) : (
          <div className="relative -mx-4 px-4">
            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth no-scrollbar">
              {filteredMilestones.map(({ projectId, milestoneIndex, milestone, isWithdrawable }) => (
                <MilestoneYieldCard
                  key={`${projectId}-${milestoneIndex}`}
                  projectId={projectId}
                  milestoneIndex={milestoneIndex}
                  milestone={milestone}
                  isWithdrawable={isWithdrawable}
                />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-brand-50 border border-blue-200">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-[10px] sm:text-xs text-blue-800">
            <p className="font-semibold mb-1">How your yield works:</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• 10% of each deposit allocated to lending protocol</li>
              <li>• Yield distributed on last milestone (40% FL, 40% PO, 20% Platform)</li>
              <li>• Withdraw approved milestones anytime from this page</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
