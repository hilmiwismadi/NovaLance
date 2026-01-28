'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import { mockPOProjects, formatCurrency } from '@/lib/mockData';
import { useWithdrawableBalance, useWithdraw, useTransactionWait } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

// Mock yield performance data for each KPI
interface YielPerformanceData {
  kpiId: string;
  kpiName: string;
  projectTitle: string;
  roleTitle: string;
  depositedAmount: number;
  lpAmount: number;
  currentYield: number;
  yieldRate: number;
  status: 'in-progress' | 'approved' | 'completed';
  depositDate: string;
}

const mockYieldData: YielPerformanceData[] = [
  {
    kpiId: 'kpi-3-1',
    kpiName: 'Setup & Wallet Connection',
    projectTitle: 'DeFi Escrow Platform',
    roleTitle: 'Smart Contract Developer',
    depositedAmount: 15000000,
    lpAmount: 1500000,
    currentYield: 171600,
    yieldRate: 11.44,
    status: 'approved',
    depositDate: '2024-01-15',
  },
  {
    kpiId: 'kpi-4-1',
    kpiName: 'Contract Architecture',
    projectTitle: 'DeFi Escrow Platform',
    roleTitle: 'Smart Contract Developer',
    depositedAmount: 20000000,
    lpAmount: 2000000,
    currentYield: -47000,
    yieldRate: -2.35,
    status: 'in-progress',
    depositDate: '2024-01-20',
  },
  {
    kpiId: 'kpi-4-2',
    kpiName: 'Core Automation Logic',
    projectTitle: 'DeFi Escrow Platform',
    roleTitle: 'Smart Contract Developer',
    depositedAmount: 25000000,
    lpAmount: 2500000,
    currentYield: 218000,
    yieldRate: 8.72,
    status: 'in-progress',
    depositDate: '2024-01-25',
  },
];

// Mock chart data for portfolio performance over time
interface ChartDataPoint {
  date: string;
  totalDeposited: number;
  totalYield: number;
  yieldRate: number;
}

const mockChartData: ChartDataPoint[] = [
  { date: '2024-01-15', totalDeposited: 15000000, totalYield: 0, yieldRate: 0 },
  { date: '2024-01-20', totalDeposited: 35000000, totalYield: 45000, yieldRate: 0.13 },
  { date: '2024-01-25', totalDeposited: 60000000, totalYield: 120000, yieldRate: 0.2 },
  { date: '2024-02-01', totalDeposited: 60000000, totalYield: 245000, yieldRate: 4.08 },
  { date: '2024-02-08', totalDeposited: 60000000, totalYield: 320000, yieldRate: 5.33 },
  { date: '2024-02-15', totalDeposited: 60000000, totalYield: 342600, yieldRate: 5.71 },
];

export default function POPortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');

  // Smart contract hooks
  const { balance, isLoading: isBalanceLoading } = useWithdrawableBalance();
  const { withdraw, isPending, error, hash, isSuccess } = useWithdraw();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash);

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

  // Calculate totals
  const totalDeposited = mockYieldData.reduce((sum, item) => sum + item.depositedAmount, 0);
  const totalLP = mockYieldData.reduce((sum, item) => sum + item.lpAmount, 0);
  const totalYield = mockYieldData.reduce((sum, item) => sum + item.currentYield, 0);
  const avgYieldRate = totalLP > 0 ? (totalYield / totalLP) * 100 : 0;

  // Calculate withdrawable balance from smart contract or fall back to mock
  const withdrawableBalance = balance
    ? Number(balance.totalWithdrawable) / 1e6
    : Math.floor(totalYield / 1000000);

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
        <Card className={`p-6 border-2 transition-all ${
          walletConnected
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                  walletConnected
                    ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                    : 'bg-gradient-to-br from-amber-400 to-orange-600'
                }`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Withdrawable Yield</h2>
                  <p className="text-sm text-slate-600">
                    {walletConnected ? 'Ready to withdraw' : 'Connect wallet to withdraw'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-4xl sm:text-5xl font-bold text-slate-900">
                  ${isBalanceLoading ? '...' : withdrawableBalance.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Total yield earned from your deposits
                </p>
              </div>

              {!walletConnected && (
                <div className="bg-amber-100/50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-800">
                      Connect your wallet to withdraw your yield earnings. Your funds are safely held in escrow and earning yield.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant={walletConnected ? 'success' : 'primary'}
                  size="lg"
                  onClick={handleWithdraw}
                  disabled={isPending || isConfirming || withdrawableBalance === 0}
                  className="flex-1"
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Processing...
                    </span>
                  ) : withdrawableBalance > 0 ? (
                    'Withdraw Yield'
                  ) : (
                    'No Yield to Withdraw'
                  )}
                </Button>
                {walletConnected && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDisconnectWallet}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="hidden sm:block w-64 space-y-3">
              <div className="bg-white/60 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs text-slate-600">Total Deposited</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalDeposited, 'IDRX')}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-slate-600">In LP (10%)</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(totalLP, 'IDRX')}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs text-slate-600">Avg Yield Rate</p>
                <p className={`text-lg font-bold ${avgYieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {avgYieldRate >= 0 ? '+' : ''}{avgYieldRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Portfolio Performance</h3>
              <p className="text-sm text-slate-600">Yield growth over time</p>
            </div>
            <div className="flex gap-2">
              {(['1W', '1M', '3M', 'ALL'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          {/* Mock Chart - Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {mockChartData.map((point, index) => {
              const maxValue = Math.max(...mockChartData.map(p => p.totalYield));
              const height = maxValue > 0 ? (point.totalYield / maxValue) * 100 : 0;
              const isLast = index === mockChartData.length - 1;

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isLast
                          ? 'bg-gradient-to-t from-brand-500 to-brand-400'
                          : 'bg-gradient-to-t from-brand-400/70 to-brand-300/50'
                      } hover:from-brand-500 hover:to-brand-400 cursor-pointer`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                        <p className="font-semibold">{new Date(point.date).toLocaleDateString()}</p>
                        <p>Yield: ${Math.floor(point.totalYield / 1000000).toLocaleString()}</p>
                        <p>Rate: {point.yieldRate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 transform -rotate-45 origin-center sm:transform-none truncate w-16 text-center">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-brand-400 to-brand-500" />
              <span className="text-xs text-slate-600">Yield Earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-xs text-slate-600">Hover for details</span>
            </div>
          </div>
        </Card>

        {/* Yield Performance by KPI */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Yield Performance by Deposit</h3>
            <p className="text-sm text-slate-600">Track yield for each KPI deposit</p>
          </div>

          <div className="space-y-4">
            {mockYieldData.map((item) => {
              const isPositive = item.yieldRate >= 0;
              const isWithdrawable = item.status === 'approved';

              return (
                <div
                  key={item.kpiId}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isWithdrawable
                      ? 'bg-emerald-50 border-emerald-200'
                      : item.status === 'in-progress'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 truncate">{item.kpiName}</h4>
                        <Badge
                          variant={item.status === 'approved' ? 'success' : item.status === 'in-progress' ? 'warning' : 'default'}
                          className="text-xs shrink-0"
                        >
                          {isWithdrawable ? 'Withdrawable' : item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{item.projectTitle}</p>
                      <p className="text-xs text-slate-500">Role: {item.roleTitle}</p>
                    </div>
                    <div className={`text-right shrink-0`}>
                      <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{item.yieldRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-600">Yield Rate</p>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/60 rounded-lg p-2 text-center">
                      <p className="text-xs text-slate-600">Deposited</p>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(item.depositedAmount, 'IDRX')}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-600">LP (10%)</p>
                      <p className="text-sm font-bold text-blue-700">{formatCurrency(item.lpAmount, 'IDRX')}</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <p className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>Current Yield</p>
                      <p className={`text-sm font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(Math.abs(item.currentYield), 'IDRX')}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {item.status === 'in-progress' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                      <p className="text-xs font-medium">Live yield generation in progress</p>
                    </div>
                  )}
                  {isWithdrawable && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium">Available to withdraw</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-brand-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">How yield generation works:</p>
              <ul className="space-y-0.5 text-blue-700">
                <li>• 10% of each approved KPI payment is allocated to LP</li>
                <li>• LP funds generate yield through DeFi protocols (variable APY)</li>
                <li>• Yield can fluctuate based on market conditions</li>
                <li>• Withdraw your yield anytime from this page</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
