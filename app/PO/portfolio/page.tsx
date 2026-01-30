'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
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

// Simple seeded random number generator
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate chart data for a specific KPI deposit
const generateKPIChartData = (depositAmount: number, depositDate: string, currentYield: number, kpiId: string): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const startDate = new Date(depositDate);
  const lpAmount = depositAmount * 0.1;
  let cumulativeYield = 0;

  // Create a numeric seed from the KPI ID for consistent unique patterns
  const seed = kpiId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const days = Math.min(16, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Unique volatility parameters for each KPI based on seed
  const baseFrequency = 0.5 + (seededRandom(seed) * 0.6); // 0.5 to 1.1
  const volatilityAmplitude = 0.3 + (seededRandom(seed + 1) * 0.5); // 0.3 to 0.8
  const randomNoise = 0.2 + (seededRandom(seed + 2) * 0.5); // 0.2 to 0.7
  const dipDay1 = Math.floor(seededRandom(seed + 3) * 8); // Random day for first dip
  const dipDay2 = Math.floor(seededRandom(seed + 4) * 8) + 8; // Random day for second dip

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const dailyYield = (lpAmount * (8 / 100)) / 365;

    // Add market volatility - unique pattern for each KPI based on seed
    const volatility = Math.sin(i * baseFrequency) * volatilityAmplitude + (seededRandom(seed + i * 7) - 0.5) * randomNoise;
    const marketMultiplier = 1 + volatility; // Can go negative, creating real declines

    // Simulate market corrections at unique days for each KPI
    let correction = 1;
    if (i === dipDay1 || i === dipDay2) {
      correction = -0.2 - (seededRandom(seed + i) * 0.3); // Random dip strength
    } else if (i === dipDay1 + 1 || i === dipDay2 + 1) {
      correction = 1.3 + (seededRandom(seed + i) * 0.5); // Random recovery strength
    }

    const change = dailyYield * marketMultiplier * correction;
    cumulativeYield = Math.max(0, Math.round(cumulativeYield + change));

    const overallYieldRate = lpAmount > 0 ? (cumulativeYield / lpAmount) * 100 : 0;

    data.push({
      date: date.toISOString().split('T')[0],
      totalDeposited: depositAmount,
      totalYield: cumulativeYield,
      yieldRate: parseFloat(overallYieldRate.toFixed(2)),
    });
  }

  return data;
};

// Generate aggregate portfolio chart data
const generateAggregateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const startDate = new Date('2024-01-15');
  let totalDeposited = 0;
  let totalYield = 0;

  // Initial deposit
  totalDeposited += 15000000;

  for (let i = 0; i < 16; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 4)); // Every 4 days

    // Add new deposits periodically
    if (i === 3) totalDeposited += 20000000;
    if (i === 7) totalDeposited += 25000000;

    const lpAmount = totalDeposited * 0.1;
    const dailyYield = (lpAmount * (8 / 100)) / 365; // Base 8% APY

    // Add realistic market volatility with ups AND downs
    const trend = Math.sin(i * 0.3) * 0.3; // Creates wave pattern
    const volatility = Math.sin(i * 0.8) * 0.6 + (Math.random() - 0.5) * 0.7;
    const marketMultiplier = 1 + volatility; // Can go negative (-0.3 to 2.3), creating real declines

    // Simulate market corrections
    let correction = 1;
    if (i === 4 || i === 9) {
      correction = -0.4; // Market dip - subtract from cumulative
    } else if (i === 5 || i === 10) {
      correction = 1.8; // Strong recovery
    }

    const change = dailyYield * 4 * marketMultiplier * correction;
    totalYield = Math.max(0, Math.round(totalYield + change + (Math.random() - 0.5) * dailyYield * 2));

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

const mockAggregateChartData = generateAggregateChartData();

type StatusFilter = 'all' | 'withdrawable' | 'in-progress';

export default function POPortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [isChartTransitioning, setIsChartTransitioning] = useState(false);
  const [displayedChartData, setDisplayedChartData] = useState(mockAggregateChartData);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartDataPoint; x: number; y: number } | null>(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Smart contract hooks
  const { balance, isLoading: isBalanceLoading } = useWithdrawableBalance();
  const { withdraw, isPending, error, hash, isSuccess } = useWithdraw();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

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

  // Animate chart transition when selection changes
  useEffect(() => {
    const selectedKpi = selectedKpiId ? mockYieldData.find(item => item.kpiId === selectedKpiId) : null;
    const newChartData = selectedKpiId && selectedKpi
      ? generateKPIChartData(selectedKpi.depositedAmount, selectedKpi.depositDate, selectedKpi.currentYield, selectedKpi.kpiId)
      : mockAggregateChartData;

    setIsChartTransitioning(true);

    // Fade out, update data, then fade in
    const timer = setTimeout(() => {
      setDisplayedChartData(newChartData);
      setTimeout(() => {
        setIsChartTransitioning(false);
      }, 50);
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedKpiId]);

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

  // Get chart data based on selection
  const selectedKpi = selectedKpiId ? mockYieldData.find(item => item.kpiId === selectedKpiId) : null;
  const chartData = displayedChartData;

  // Calculate chart path data
  const maxYield = Math.max(...chartData.map(p => p.totalYield));
  const areaPath = chartData.map((point, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - ((point.totalYield / maxYield) * 60 + 20);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ') + ' L 100,100 L 0,100 Z';

  const linePath = chartData.map((point, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - ((point.totalYield / maxYield) * 60 + 20);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const handleCardClick = (kpiId: string | null) => {
    if (kpiId !== selectedKpiId) {
      setSelectedKpiId(kpiId);

      // Smooth scroll to chart after a short delay
      setTimeout(() => {
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Calculate totals
  const totalDeposited = mockYieldData.reduce((sum, item) => sum + item.depositedAmount, 0);
  const totalLP = mockYieldData.reduce((sum, item) => sum + item.lpAmount, 0);
  const totalYield = mockYieldData.reduce((sum, item) => sum + item.currentYield, 0);
  const avgYieldRate = totalLP > 0 ? (totalYield / totalLP) * 100 : 0;

  // Filter cards based on status
  const baseFilteredCards = mockYieldData.filter(item => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'withdrawable') return item.status === 'approved';
    if (statusFilter === 'in-progress') return item.status === 'in-progress';
    return true;
  });

  // Create endless loop by duplicating cards (need at least 3 cycles for smooth infinite scroll)
  const filteredCards = [...baseFilteredCards, ...baseFilteredCards, ...baseFilteredCards];

  // Detect centered card in carousel
  useEffect(() => {
    if (isCardsExpanded || !carouselRef.current) return;

    const carousel = carouselRef.current;
    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
      const centerIndex = Math.round(scrollLeft / cardWidth) % baseFilteredCards.length;

      // Update active dot for pagination
      setActiveDotIndex(centerIndex);

      // Auto-select the centered card
      if (baseFilteredCards[centerIndex]) {
        setSelectedKpiId(baseFilteredCards[centerIndex].kpiId);
      }
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [isCardsExpanded, baseFilteredCards]);

  const handlePointClick = (point: ChartDataPoint, x: number, y: number, event: React.MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    setHoveredPoint({ point, x, y });
  };

  const handleChartClick = () => {
    setHoveredPoint(null);
  };

  // Generate random withdrawable balance between 40,000 and 200,000 IDR (with decimals)
  const mockWithdrawableBalance = Math.random() * (200000 - 40000) + 40000;

  // Calculate withdrawable balance from smart contract or fall back to mock (in IDR, no conversion needed)
  const withdrawableBalance = balance
    ? Number(balance.totalWithdrawable) / 1e6
    : mockWithdrawableBalance;

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
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-1.5 sm:gap-2 w-full md:w-auto">
              <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-emerald-200">
                <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">Total Deposited</p>
                <p className="text-[10px] sm:text-sm font-bold text-slate-900 truncate">
                  <span className="inline-flex items-center gap-0.5 max-w-full overflow-hidden">
                    <CurrencyDisplay amount={formatCurrency(totalDeposited, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-xs" />
                  </span>
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-1.5 sm:p-2.5 border border-blue-200">
                <p className="text-[8px] sm:text-[10px] text-slate-600 truncate">In LP (10%)</p>
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

        {/* Performance Chart */}
        <div ref={chartRef}>
        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`transition-all duration-300 ${isChartTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900">
                  {selectedKpi ? selectedKpi.kpiName : 'Portfolio Performance'}
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600">
                  {selectedKpi ? `Yield performance for ${selectedKpi.projectTitle}` : 'Yield growth over time'}
                </p>
              </div>
              {selectedKpi && (
                <button
                  onClick={() => handleCardClick(null)}
                  className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Back to aggregate view"
                >
                  View All
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 md:gap-3">
              {/* Trend Indicator */}
              <div className={`flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-1 rounded-lg border transition-all duration-300 ${
                chartData[chartData.length - 1].yieldRate >= 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              } ${isChartTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <svg className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-colors duration-300 ${chartData[chartData.length - 1].yieldRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={chartData[chartData.length - 1].yieldRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
                <span className={`text-[9px] md:text-xs font-semibold transition-colors duration-300 ${chartData[chartData.length - 1].yieldRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {chartData[chartData.length - 1].yieldRate >= 0 ? '+' : ''}{chartData[chartData.length - 1].yieldRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex gap-1 md:gap-1.5 sm:gap-2">
                {(['1W', '1M', '3M', 'ALL'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-1.5 md:px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] md:text-[10px] sm:text-xs font-medium transition-all ${
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

          {/* Line Chart - Mobile Friendly */}
          <div className="relative h-48 sm:h-56 md:h-72" ref={chartContainerRef} onClick={handleChartClick}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                {/* Gradient for area under line */}
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
                </linearGradient>
                {/* Gradient for line */}
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99 102 241)" />
                  <stop offset="50%" stopColor="rgb(16 185 129)" />
                  <stop offset="100%" stopColor="rgb(16 185 129)" />
                </linearGradient>
                {/* Subtle glow effect */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {[20, 40, 60, 80].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgb(226 232 240)"
                  strokeWidth="0.3"
                  strokeDasharray="1.5"
                />
              ))}

              {/* Area under the line with animation */}
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                className={`transition-all duration-500 ease-out ${isChartTransitioning ? 'opacity-0' : 'opacity-100'}`}
              />

              {/* The line - Thin and elegant with animation */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className={`transition-all duration-500 ease-out ${isChartTransitioning ? 'opacity-0 scale-y-95' : 'opacity-100 scale-y-100'}`}
                style={{
                  transformOrigin: 'bottom',
                }}
              >
                <animate
                  attributeName="stroke-width"
                  values="0.8;1.2;0.8"
                  dur="2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="1;0.8;1"
                  dur="2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
              </path>

              {/* Clickable points along the line */}
              {chartData.map((point, i) => {
                const x = (i / (chartData.length - 1)) * 100;
                const maxYield = Math.max(...chartData.map(p => p.totalYield));
                const y = 100 - ((point.totalYield / maxYield) * 60 + 20);
                const isHovered = hoveredPoint?.point.date === point.date;

                return (
                  <g key={`point-${i}`}>
                    {/* Invisible larger hit area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={(e) => handlePointClick(point, x, y, e)}
                    />
                    {/* Visible dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? "1.5" : "1"}
                      fill="rgb(16 185 129)"
                      className={`cursor-pointer transition-all duration-200 ${isChartTransitioning ? 'opacity-0' : 'opacity-100'}`}
                      onClick={(e) => handlePointClick(point, x, y, e)}
                    >
                      {isHovered && (
                        <animate
                          attributeName="r"
                          values="1.5;2;1.5"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Clickable Point Tooltip Card */}
            {hoveredPoint && (
              <div
                className="absolute bg-white rounded-xl shadow-2xl border border-brand-200 p-3 z-50 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200"
                style={{
                  left: `${Math.min(Math.max(hoveredPoint.x, 10), 85)}%`,
                  top: `${Math.max(hoveredPoint.y - 20, 8)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[9px] text-slate-500 mb-0.5">
                      {new Date(hoveredPoint.point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      ${(hoveredPoint.point.totalYield / 1000000).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setHoveredPoint(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 hover:bg-slate-100 rounded-lg"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <div className="bg-slate-50 rounded px-2 py-1">
                    <span className="text-slate-500">Dep: </span>
                    <span className="font-semibold text-slate-900">
                      <CurrencyDisplay amount={formatCurrency(hoveredPoint.point.totalDeposited, 'IDRX')} currency="IDRX" className="text-[9px]" />
                    </span>
                  </div>
                  <div className={`rounded px-2 py-1 ${hoveredPoint.point.yieldRate >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <span className={`font-semibold ${hoveredPoint.point.yieldRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {hoveredPoint.point.yieldRate >= 0 ? '+' : ''}{hoveredPoint.point.yieldRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* X-Axis Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 sm:px-2">
              {chartData.map((point, i) => {
                const showLabel = i % 3 === 0;
                return (
                  <div
                    key={point.date}
                    className="flex-1 text-center"
                    style={{ display: showLabel || typeof window !== 'undefined' && window.innerWidth >= 640 ? 'block' : 'none' }}
                  >
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-slate-600 truncate px-0.5">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Y-Axis Label (hidden on mobile) */}
            <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 -translate-x-6 origin-center">
              <p className="text-[10px] sm:text-xs text-slate-500">Yield ($)</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6 mt-3 md:mt-4 lg:mt-6">
            <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
              <svg className="w-12 h-3 sm:w-16 sm:h-4" viewBox="0 0 24 12">
                <path
                  d="M 0,10 Q 6,0 12,6 T 24,2"
                  fill="none"
                  stroke="url(#chartLegendGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="chartLegendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(99 102 241)" />
                    <stop offset="100%" stopColor="rgb(16 185 129)" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-600">Yield Growth</span>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-brand-500" />
              <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-600">Latest Value</span>
            </div>
          </div>
        </Card>
        </div>

        {/* Yield Performance by KPI */}
        <Card className={`transition-all duration-500 overflow-visible ${isCardsExpanded ? 'p-6' : 'p-4'}`}>
          <div className={`flex items-start justify-between gap-3 mb-4 ${isCardsExpanded ? '' : 'mb-3'}`}>
            <div>
              <h3 className={`font-bold text-slate-900 ${isCardsExpanded ? 'text-lg' : 'text-base'}`}>Yield Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="appearance-none pl-9 pr-8 py-2 text-sm font-medium rounded-xl border-2 bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-700 border-brand-200 hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all cursor-pointer shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="withdrawable">Withdrawable</option>
                  <option value="in-progress">In Progress</option>
                </select>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsCardsExpanded(!isCardsExpanded)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                title={isCardsExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${isCardsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontal scroll for collapsed view */}
          {!isCardsExpanded ? (
            <div className="relative -mx-6 px-6">
              <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth no-scrollbar"
                style={{ scrollPadding: '0 calc(50% - 160px)' }}
              >
                {filteredCards.map((item, index) => {
                  const isPositive = item.yieldRate >= 0;
                  const isWithdrawable = item.status === 'approved';

                  return (
                    <div
                      key={`${item.kpiId}-${index}`}
                      className={`flex-shrink-0 w-80 p-4 rounded-xl border-2 transition-all duration-300 snap-center ${
                        isWithdrawable
                          ? 'bg-emerald-50 border-emerald-200'
                          : item.status === 'in-progress'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">{item.kpiName}</h4>
                          <p className="text-[10px] text-slate-600 truncate">{item.projectTitle}</p>
                        </div>
                        <div className={`text-right shrink-0`}>
                          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{item.yieldRate.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-white/60 rounded-lg p-1.5 text-center min-w-0">
                          <p className="text-[8px] text-slate-600 truncate">Deposited</p>
                          <p className="text-[9px] font-bold text-slate-900 truncate">
                            <CurrencyDisplay amount={formatCurrency(item.depositedAmount, 'IDRX')} currency="IDRX" className="text-[8px]" />
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-1.5 text-center min-w-0">
                          <p className="text-[8px] text-blue-600 truncate">LP</p>
                          <p className="text-[9px] font-bold text-blue-700 truncate">
                            <CurrencyDisplay amount={formatCurrency(item.lpAmount, 'IDRX')} currency="IDRX" className="text-[8px]" />
                          </p>
                        </div>
                        <div className={`rounded-lg p-1.5 text-center min-w-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          <p className={`text-[8px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Yield</p>
                          <p className={`text-[9px] font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                            <CurrencyDisplay amount={formatCurrency(Math.abs(item.currentYield), 'IDRX')} currency="IDRX" className="text-[8px]" />
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={item.status === 'approved' ? 'success' : item.status === 'in-progress' ? 'warning' : 'default'}
                        className="text-[9px] mt-2 w-full justify-center"
                      >
                        {isWithdrawable ? 'Withdrawable' : item.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Pagination dots/strip */}
              <div className="flex items-center justify-center gap-2 mt-2">
                {baseFilteredCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (carouselRef.current) {
                        const targetScroll = index * (320 + 16);
                        carouselRef.current.scrollTo({
                          left: targetScroll,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeDotIndex === index
                        ? 'w-8 bg-brand-500 shadow-md'
                        : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map((item) => {
                const isPositive = item.yieldRate >= 0;
                const isWithdrawable = item.status === 'approved';
                const isSelected = selectedKpiId === item.kpiId;

                return (
                <div
                  key={item.kpiId}
                  onClick={() => handleCardClick(item.kpiId)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    isSelected
                      ? 'bg-brand-50 border-brand-400 ring-2 ring-brand-200 shadow-md scale-[1.01]'
                      : isWithdrawable
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                      : item.status === 'in-progress'
                      ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{item.kpiName}</h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-brand-500 text-white font-medium animate-pulse shadow-sm">
                            Viewing Chart
                          </span>
                        )}
                        <Badge
                          variant={item.status === 'approved' ? 'success' : item.status === 'in-progress' ? 'warning' : 'default'}
                          className="text-[10px] sm:text-xs shrink-0"
                        >
                          {isWithdrawable ? 'Withdrawable' : item.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 truncate">{item.projectTitle}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">Role: {item.roleTitle}</p>
                    </div>
                    <div className={`text-right shrink-0`}>
                      <p className={`text-xl sm:text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{item.yieldRate.toFixed(2)}%
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600">Yield Rate</p>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                    <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 text-center min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-slate-600 truncate">Deposited</p>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">
                        <span className="inline-flex items-center justify-center gap-0.5 max-w-full overflow-hidden">
                          <CurrencyDisplay amount={formatCurrency(item.depositedAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
                        </span>
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2 text-center min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-blue-600 truncate">LP (10%)</p>
                      <p className="text-[10px] sm:text-xs font-bold text-blue-700 truncate">
                        <span className="inline-flex items-center justify-center gap-0.5 max-w-full overflow-hidden">
                          <CurrencyDisplay amount={formatCurrency(item.lpAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
                        </span>
                      </p>
                    </div>
                    <div className={`rounded-lg p-1.5 sm:p-2 text-center min-w-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <p className={`text-[9px] sm:text-[10px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Current Yield</p>
                      <p className={`text-[10px] sm:text-xs font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                        <span className="inline-flex items-center justify-center gap-0.5 max-w-full overflow-hidden">
                          <CurrencyDisplay amount={formatCurrency(Math.abs(item.currentYield), 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" />
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {item.status === 'in-progress' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                      <p className="text-[10px] sm:text-xs font-medium truncate">Live yield generation</p>
                    </div>
                  )}
                  {isWithdrawable && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-[10px] sm:text-xs font-medium truncate">Available to withdraw</p>
                    </div>
                  )}
                </div>
              );
            })}
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
                <li className="truncate">• 10% of each KPI payment allocated to LP</li>
                <li className="truncate">• LP funds generate yield via DeFi protocols</li>
                <li className="truncate">• Yield fluctuates based on market conditions</li>
                <li className="truncate">• Withdraw your yield anytime from this page</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
