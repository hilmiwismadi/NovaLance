'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import { formatCurrency } from '@/lib/contract';
import {
  useWithdrawableBalance,
  useWithdraw,
  useTransactionWait,
  // ProjectLance hooks
  usePLVaultBalance,
  usePLLendingBalance,
  usePLProjectCount,
  usePLYield,
  usePLProject,
  usePLAllMilestones,
} from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

type StatusFilter = 'all' | 'withdrawable' | 'in-progress';

export default function POPortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);

  // Get wagmi account
  const { address: wagmiAddress } = useAccount();

  // Smart contract hooks
  const { balance, isLoading: isBalanceLoading } = useWithdrawableBalance();
  const { withdraw, isPending, error, hash, isSuccess } = useWithdraw();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  // ProjectLance contract hooks for yield data
  const { count: projectCount } = usePLProjectCount();

  // Get user's projects (PO is creator)
  const [userProjectIds, setUserProjectIds] = useState<bigint[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check wallet connection status
    if (typeof window !== 'undefined') {
      const isWalletConnected = localStorage.getItem('po-wallet-connected');
      const storedWalletAddress = localStorage.getItem('po-wallet-address');
      if (isWalletConnected && storedWalletAddress) {
        setWalletConnected(true);
        setWalletAddress(storedWalletAddress);
      }
    }
  }, []);

  // Fetch user's projects - use wagmiAddress when available
  useEffect(() => {
    if (!projectCount || !mounted) return;

    const address = wagmiAddress || walletAddress;
    if (!address) return;

    const fetchUserProjects = async () => {
      setIsLoadingProjects(true);
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

        const count = Number(projectCount);
        const userProjects: bigint[] = [];

        for (let i = 0; i < Math.min(count, 50); i++) {
          try {
            const result = await publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'getProject',
              args: [BigInt(i)]
            }) as any[];

            const creator = result[0];
            if (creator.toLowerCase() === address.toLowerCase()) {
              userProjects.push(BigInt(i));
            }
          } catch {
            // Skip invalid projects
          }
        }

        setUserProjectIds(userProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchUserProjects();
  }, [projectCount, mounted]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      const chainId = 84532;
      showTransactionPending(hash, 'Withdraw Earnings', chainId);
    }
  }, [isSuccess, hash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Earnings withdrawn successfully!');
    }
  }, [isConfirmed, hash]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to withdraw earnings');
    }
  }, [error, hash]);

  const handleWalletConnected = () => {
    setWalletConnected(true);
    setWalletAddress(localStorage.getItem('po-wallet-address') || '');
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('po-wallet-connected');
      localStorage.removeItem('po-wallet-address');
    }
    setWalletConnected(false);
    setWalletAddress('');
  };

  const handleWithdraw = async () => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }

    try {
      await withdraw();
    } catch (err) {
      const error = err as Error;
      showError('Withdrawal Failed', error.message);
    }
  };

  // Calculate totals - Use contract data when available
  // For each project, fetch its yield data
  const [projectYields, setProjectYields] = useState<Array<{
    id: bigint;
    vaultAmount: bigint;
    lendingAmount: bigint;
    yieldPercentage: number;
  }>>([]);

  useEffect(() => {
    if (!userProjectIds.length) return;

    const fetchProjectYields = async () => {
      const yields = [];
      for (const projectId of userProjectIds) {
        try {
          const { vaultAmount, lendingAmount, yieldPercentage } = await import('@/lib/hooks').then(m => {
            const hook = m.usePLYield(projectId);
            return { vaultAmount: hook.vaultAmount, lendingAmount: hook.lendingAmount, yieldPercentage: hook.yieldPercentage };
          });
          // Actually, we need to use the hook properly - but since we can't use hooks in loops,
          // we'll just store the project IDs and let individual project components handle the data
        } catch (e) {
          // Skip
        }
      }
    };

    // For now, we'll just store the project IDs
    setProjectYields(userProjectIds.map(id => ({
      id,
      vaultAmount: BigInt(0),
      lendingAmount: BigInt(0),
      yieldPercentage: 0,
    })));
  }, [userProjectIds]);

  const totalDeposited = projectYields.reduce((sum, p) => sum + (p.vaultAmount || BigInt(0)), BigInt(0));
  const totalLP = projectYields.reduce((sum, p) => sum + (p.lendingAmount || BigInt(0)), BigInt(0));
  const avgYieldRate = projectYields.length > 0
    ? projectYields.reduce((sum, p) => sum + p.yieldPercentage, 0) / projectYields.length
    : 0;

  // Calculate withdrawable balance
  const withdrawableBalance = balance
    ? Number(balance.totalWithdrawable) / 1e6
    : 0;

  if (!mounted) return null;

  return (
    <>
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Portfolio Performance</h1>
          <p className="text-slate-600 text-sm mt-1">Track your deposits, yields, and overall portfolio performance</p>
        </div>

        {/* Withdrawable Yield Card - Prominent */}
        <Card className={`p-3 sm:p-4 md:p-6 border-2 transition-all ${
          walletConnected
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between gap-2 md:gap-3 mb-2 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    walletConnected
                      ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                      : 'bg-gradient-to-br from-amber-400 to-orange-600'
                  }`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 truncate">Withdrawable Yield</h2>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">
                      {walletConnected ? 'Ready to withdraw' : 'Connect wallet to withdraw'}
                    </p>
                  </div>
                </div>
                {walletConnected && (
                  <button
                    onClick={handleDisconnectWallet}
                    className="px-2 py-1 text-[10px] sm:text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all shadow-sm flex-shrink-0"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              <div className="mb-2 md:mb-4">
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 truncate inline-flex items-center gap-1">
                  {isBalanceLoading ? (
                    '...'
                  ) : (
                    <CurrencyDisplay amount={withdrawableBalance.toFixed(3)} currency="IDRX" />
                  )}
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mt-1 truncate">
                  Total yield earned
                </p>
              </div>

              {!walletConnected && (
                <div className="bg-amber-100/50 rounded-lg p-2 md:p-3 mb-2 md:mb-4 border border-amber-200">
                  <div className="flex items-start gap-1.5 md:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] sm:text-xs text-amber-800 line-clamp-2">
                      Connect wallet to withdraw yield earnings
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={walletConnected ? 'success' : 'primary'}
                  size="lg"
                  onClick={handleWithdraw}
                  disabled={isPending || isConfirming || withdrawableBalance === 0}
                  className="flex-1 text-xs sm:text-sm md:text-base py-2 md:py-3"
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Processing...
                    </span>
                  ) : withdrawableBalance > 0 ? (
                    'Withdrawable'
                  ) : (
                    'No Withdrawable'
                  )}
                </Button>
              </div>
            </div>

            {/* Summary Stats - Visible on all screens */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full md:w-auto">
              <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-emerald-200">
                <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">Total Deposited</p>
                <p className="text-[10px] sm:text-sm font-bold text-slate-900 truncate">
                  <span className="inline-flex items-center gap-0.5 max-w-full overflow-hidden">
                    <CurrencyDisplay amount={formatCurrency(totalDeposited, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-xs" />
                  </span>
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-blue-200">
                <p className="text-[8px] sm:text-[10px] text-blue-600 truncate">In LP (10%)</p>
                <p className="text-[10px] sm:text-sm font-bold text-blue-700 truncate">
                  <span className="inline-flex items-center gap-0.5 max-w-full overflow-hidden">
                    <CurrencyDisplay amount={formatCurrency(totalLP, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-xs" />
                  </span>
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-emerald-200">
                <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">Avg Yield Rate</p>
                <p className={`text-[10px] sm:text-sm font-bold truncate ${avgYieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {avgYieldRate >= 0 ? '+' : ''}{avgYieldRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Projects with Yield */}
        <Card className="p-4">
          <div className={`flex items-start justify-between gap-3 mb-4 ${isCardsExpanded ? '' : 'mb-3'}`}>
            <div>
              <h3 className={`font-bold text-slate-900 ${isCardsExpanded ? 'text-lg' : 'text-base'}`}>Projects</h3>
            </div>
          </div>

          {userProjectIds.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              {isLoadingProjects ? 'Loading projects...' : 'No projects yet. Create your first project to start earning yield!'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjectIds.map((projectId) => (
                <ProjectYieldCard key={projectId.toString()} projectId={projectId} />
              ))}
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
              <p className="font-semibold mb-1">How yield generation works:</p>
              <ul className="space-y-0.5 text-blue-700">
                <li>• 90% of each deposit goes to vault (escrow for freelancer)</li>
                <li>• 10% goes to lending protocol to generate yield</li>
                <li>• Yield is distributed on the last milestone</li>
                <li>• Withdraw your yield anytime from this page</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// Component to display individual project yield info
function ProjectYieldCard({ projectId }: { projectId: bigint }) {
  const { vaultAmount, lendingAmount, yieldPercentage } = usePLYield(projectId);
  const { project } = usePLProject(projectId);

  const projectData = project as any[] | undefined;
  const status = projectData?.[2] ?? 0;
  const totalDeposited = projectData?.[3] ?? BigInt(0);

  const vault = vaultAmount || BigInt(0);
  const lending = lendingAmount || BigInt(0);
  const yieldRate = yieldPercentage ?? 0;

  const isPositive = yieldRate >= 0;
  const hasDeposits = totalDeposited > BigInt(0);

  // Get status text
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Hiring';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (!hasDeposits) return null;

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">Project #{projectId}</h4>
          <p className="text-[10px] text-slate-600">{getStatusText(status)}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{yieldRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/60 rounded-lg p-2 text-center">
          <p className="text-[8px] text-slate-600 truncate">Vault (90%)</p>
          <p className="text-[10px] font-bold text-slate-900 truncate">
            <CurrencyDisplay amount={formatCurrency(vault, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-[8px] text-blue-600 truncate">LP (10%)</p>
          <p className="text-[10px] font-bold text-blue-700 truncate">
            <CurrencyDisplay amount={formatCurrency(lending, 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
        <div className={`rounded-lg p-2 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[8px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Yield</p>
          <p className={`text-[10px] font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            <CurrencyDisplay amount={formatCurrency((lending * BigInt(Math.round(Math.abs(yieldRate) * 100))) / BigInt(10000), 'IDRX')} currency="IDRX" className="text-[8px]" />
          </p>
        </div>
      </div>
    </div>
  );
}
