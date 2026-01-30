'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { mockPOProjects, formatCurrency } from '@/lib/mockData';

// Get projects where FL user (alice.eth) is assigned
const assignedRoles = mockPOProjects.flatMap(project =>
  project.roles
    .filter(r => r.assignedTo && r.assignedToEns === 'alice.eth')
    .map(role => ({ project, role }))
);

// Mock yield performance data for FL user's KPIs
interface YieldPerformanceData {
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

const mockYieldData: YieldPerformanceData[] = [
  {
    kpiId: 'kpi-4-1',
    kpiName: 'Frontend Development',
    projectTitle: 'DeFi Escrow Platform',
    roleTitle: 'Frontend Developer',
    depositedAmount: 4500000,
    lpAmount: 450000,
    currentYield: 51480,
    yieldRate: 11.44,
    status: 'approved',
    depositDate: '2024-01-15',
  },
  {
    kpiId: 'kpi-5-1',
    kpiName: 'React Components',
    projectTitle: 'NFT Marketplace',
    roleTitle: 'Frontend Developer',
    depositedAmount: 2500000,
    lpAmount: 250000,
    currentYield: -5875,
    yieldRate: -2.35,
    status: 'in-progress',
    depositDate: '2024-01-20',
  },
  {
    kpiId: 'kpi-5-2',
    kpiName: 'Web3 Integration',
    projectTitle: 'NFT Marketplace',
    roleTitle: 'Frontend Developer',
    depositedAmount: 2000000,
    lpAmount: 200000,
    currentYield: 17440,
    yieldRate: 8.72,
    status: 'in-progress',
    depositDate: '2024-01-25',
  },
];

interface ChartDataPoint {
  date: string;
  totalDeposited: number;
  totalYield: number;
  yieldRate: number;
}

// Memoized chart data generation - moved outside component and memoized
const generateAggregateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const startDate = new Date('2024-01-15');
  let totalDeposited = 0;
  let totalYield = 0;

  totalDeposited += 4500000;

  for (let i = 0; i < 16; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 4));

    if (i === 3) totalDeposited += 2500000;
    if (i === 7) totalDeposited += 2000000;

    const lpAmount = totalDeposited * 0.1;
    const dailyYield = (lpAmount * (8 / 100)) / 365;

    const trend = Math.sin(i * 0.3) * 0.3;
    const volatility = Math.sin(i * 0.8) * 0.6 + (Math.random() - 0.5) * 0.7;
    const marketMultiplier = 1 + volatility;

    let correction = 1;
    if (i === 4 || i === 9) {
      correction = -0.4;
    } else if (i === 5 || i === 10) {
      correction = 1.8;
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

// Memoized chart data
const mockAggregateChartData = generateAggregateChartData();

type StatusFilter = 'all' | 'withdrawable' | 'in-progress';

// Memoized yield card component
const YieldCard = memo(({
  item,
  index,
}: {
  item: YieldPerformanceData;
  index: number;
}) => {
  const isPositive = item.yieldRate >= 0;
  const isWithdrawable = item.status === 'approved';

  return (
    <div key={`${item.kpiId}-${index}`} className={`flex-shrink-0 w-80 p-4 rounded-xl border-2 transition-all snap-center ${isWithdrawable ? 'bg-emerald-50 border-emerald-200' : item.status === 'in-progress' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm truncate">{item.kpiName}</h4>
          <p className="text-[10px] text-slate-600 truncate">{item.projectTitle}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}{item.yieldRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-white/60 rounded-lg p-1.5 text-center">
          <p className="text-[8px] text-slate-600 truncate">Deposited</p>
          <p className="text-[9px] font-bold text-slate-900 truncate"><CurrencyDisplay amount={formatCurrency(item.depositedAmount, 'IDRX')} currency="IDRX" className="text-[8px]" /></p>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 text-center">
          <p className="text-[8px] text-blue-600 truncate">LP</p>
          <p className="text-[9px] font-bold text-blue-700 truncate"><CurrencyDisplay amount={formatCurrency(item.lpAmount, 'IDRX')} currency="IDRX" className="text-[8px]" /></p>
        </div>
        <div className={`rounded-lg p-1.5 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[8px] ${isPositive ? 'text-emerald-600' : 'text-red-600'} truncate`}>Yield</p>
          <p className={`text-[9px] font-bold truncate ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}><CurrencyDisplay amount={formatCurrency(Math.abs(item.currentYield), 'IDRX')} currency="IDRX" className="text-[8px]" /></p>
        </div>
      </div>

      <Badge variant={item.status === 'approved' ? 'success' : item.status === 'in-progress' ? 'warning' : 'default'} className="text-[9px] mt-2 w-full justify-center">
        {isWithdrawable ? 'Withdrawable' : item.status}
      </Badge>
    </div>
  );
});
YieldCard.displayName = 'YieldCard';

// Memoized expanded yield card component
const ExpandedYieldCard = memo(({
  item,
}: {
  item: YieldPerformanceData;
}) => {
  const isPositive = item.yieldRate >= 0;
  const isWithdrawable = item.status === 'approved';

  return (
    <div key={item.kpiId} className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${isWithdrawable ? 'bg-emerald-50 border-emerald-200' : item.status === 'in-progress' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{item.kpiName}</h4>
          <p className="text-[10px] sm:text-xs text-slate-600 truncate">{item.projectTitle}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">Role: {item.roleTitle}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl sm:text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}{item.yieldRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
        <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 text-center">
          <p className="text-[9px] sm:text-[10px] text-slate-600">Deposited</p>
          <p className="text-[10px] sm:text-xs font-bold text-slate-900"><CurrencyDisplay amount={formatCurrency(item.depositedAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" /></p>
        </div>
        <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2 text-center">
          <p className="text-[9px] sm:text-[10px] text-blue-600">LP (10%)</p>
          <p className="text-[10px] sm:text-xs font-bold text-blue-700"><CurrencyDisplay amount={formatCurrency(item.lpAmount, 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" /></p>
        </div>
        <div className={`rounded-lg p-1.5 sm:p-2 text-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[9px] sm:text-[10px] ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>Current Yield</p>
          <p className={`text-[10px] sm:text-xs font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}><CurrencyDisplay amount={formatCurrency(Math.abs(item.currentYield), 'IDRX')} currency="IDRX" className="text-[9px] sm:text-[10px]" /></p>
        </div>
      </div>
    </div>
  );
});
ExpandedYieldCard.displayName = 'ExpandedYieldCard';

export default function FLPortfolioContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [isChartTransitioning, setIsChartTransitioning] = useState(false);
  const [displayedChartData, setDisplayedChartData] = useState(mockAggregateChartData);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartDataPoint; x: number; y: number } | null>(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate chart transition when selection changes - memoized callback
  useEffect(() => {
    const newChartData = mockAggregateChartData;

    setIsChartTransitioning(true);

    const timer = setTimeout(() => {
      setDisplayedChartData(newChartData);
      setTimeout(() => {
        setIsChartTransitioning(false);
      }, 50);
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedKpiId]);

  // Memoized calculations
  const portfolioCalculations = useMemo(() => {
    const totalDeposited = mockYieldData.reduce((sum, item) => sum + item.depositedAmount, 0);
    const totalLP = mockYieldData.reduce((sum, item) => sum + item.lpAmount, 0);
    const totalYield = mockYieldData.reduce((sum, item) => sum + item.currentYield, 0);
    const avgYieldRate = totalLP > 0 ? (totalYield / totalLP) * 100 : 0;
    const withdrawableBalance = totalYield * 0.3;

    return { totalDeposited, totalLP, totalYield, avgYieldRate, withdrawableBalance };
  }, []);

  // Memoized chart data and paths
  const chartData = displayedChartData;
  const chartPaths = useMemo(() => {
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

    return { areaPath, linePath, maxYield };
  }, [chartData]);

  // Memoized filtered cards
  const filteredCards = useMemo(() => {
    const baseFilteredCards = mockYieldData.filter(item => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'withdrawable') return item.status === 'approved';
      if (statusFilter === 'in-progress') return item.status === 'in-progress';
      return true;
    });
    return [...baseFilteredCards, ...baseFilteredCards, ...baseFilteredCards];
  }, [statusFilter]);

  const baseFilteredCards = useMemo(() => mockYieldData.filter(item => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'withdrawable') return item.status === 'approved';
    if (statusFilter === 'in-progress') return item.status === 'in-progress';
    return true;
  }), [statusFilter]);

  // Detect centered card in carousel
  useEffect(() => {
    if (isCardsExpanded || !carouselRef.current) return;

    const carousel = carouselRef.current;
    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = 320 + 16;
      const centerIndex = Math.round(scrollLeft / cardWidth) % baseFilteredCards.length;
      setActiveDotIndex(centerIndex);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [isCardsExpanded, baseFilteredCards]);

  // Memoized callbacks
  const handlePointClick = useCallback((point: ChartDataPoint, x: number, y: number, event: React.MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    setHoveredPoint({ point, x, y });
  }, []);

  const handleChartClick = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const handleCardClick = useCallback((kpiId: string | null) => {
    if (kpiId !== selectedKpiId) {
      setSelectedKpiId(kpiId);
      setTimeout(() => {
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedKpiId]);

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
                Total yield earned
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="success" size="lg" className="flex-1 text-xs sm:text-sm md:text-base py-2 md:py-3">
                Withdraw
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
      <div ref={chartRef}>
      <Card className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`transition-all duration-300 ${isChartTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900">
                Portfolio Performance
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-600">
                Yield growth over time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 md:gap-3">
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
                  onClick={() => toggleTimeframe(timeframe)}
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
              const x = (i / (chartData.length - 1)) * 100;
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

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6 mt-3 md:mt-4 lg:mt-6">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-brand-500" />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-600">Latest Value</span>
          </div>
        </div>
      </Card>
      </div>

      {/* Yield Performance by KPI */}
      <Card className={`transition-all duration-500 ${isCardsExpanded ? 'p-6' : 'p-4'}`}>
        <div className={`flex items-start justify-between gap-3 mb-4 ${isCardsExpanded ? '' : 'mb-3'}`}>
          <div>
            <h3 className={`font-bold text-slate-900 ${isCardsExpanded ? 'text-lg' : 'text-base'}`}>Yield Performance</h3>
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

        {/* Horizontal scroll for collapsed view */}
        {!isCardsExpanded ? (
          <div className="relative -mx-4 px-4">
            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth no-scrollbar" style={{ scrollPadding: '0 calc(50% - 160px)' }}>
              {filteredCards.map((item, index) => (
                <YieldCard key={`${item.kpiId}-${index}`} item={item} index={index} />
              ))}
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {baseFilteredCards.map((_, index) => (
                <button key={index} className={`h-1.5 rounded-full transition-all ${activeDotIndex === index ? 'w-8 bg-brand-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {baseFilteredCards.map((item) => (
              <ExpandedYieldCard key={item.kpiId} item={item} />
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
            <p className="font-semibold mb-1">How your yield works:</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• 10% of each KPI payment allocated to LP</li>
              <li>• LP funds generate yield via DeFi protocols</li>
              <li>• Yield fluctuates based on market conditions</li>
              <li>• Withdraw your yield anytime from this page</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
