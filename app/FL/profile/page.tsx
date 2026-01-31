'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useMyProfile, useMyApplications, useFreelancerBalance } from '@/lib/api-hooks';
import { useWithdrawableBalance, useWithdraw, useTransactionWait } from '@/lib/hooks';
import { formatCurrency } from '@/lib/contract';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

export default function FLProfilePage() {
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  // API hooks for user data
  const { data: user, isLoading: userLoading, error: userError } = useMyProfile();
  const { data: applications } = useMyApplications();
  const { data: freelancerBalance } = useFreelancerBalance();

  // Smart contract hooks
  const { balance, isLoading: isBalanceLoading } = useWithdrawableBalance();
  const { withdraw, isPending, error, hash, isSuccess } = useWithdraw();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  // Calculate earnings from API data
  const totalEarnings = freelancerBalance?.totalEarned ? BigInt(freelancerBalance.totalEarned) : 0n;
  const pendingEarnings = 0n; // Can be calculated from approved KPIs

  // Calculate real withdrawable balance from smart contract or fall back to mock
  const withdrawableBalance = balance
    ? BigInt(balance.totalWithdrawable) / 1000000n // Assuming USDC/IDRX decimals (6)
    : totalEarnings;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      showTransactionPending(hash, 'Withdraw Earnings', chain?.id || 84532);
    }
  }, [isSuccess, hash, chain]);

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

  const handleWithdraw = async () => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to withdraw');
      return;
    }

    try {
      await withdraw();
    } catch (err) {
      const error = err as Error;
      showError('Withdrawal Failed', error.message);
    }
  };

  if (!mounted) return null;

  // Show loading state
  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage your freelancer profile and track earnings</p>
        </div>
        <Card className="p-8 text-center">
          <div className="animate-pulse">Loading profile...</div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (userError || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage your freelancer profile and track earnings</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-red-600">Failed to load profile data</p>
        </Card>
      </div>
    );
  }

  const { ens, bio, skills, reviewCount, memberSince, completedProjects } = user;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Profile
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Manage your freelancer profile and track earnings
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-4 sm:p-5 border-2 border-transparent bg-gradient-to-br from-white to-slate-50/30 shadow-sm overflow-hidden relative">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-100/50 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-200/50 flex-shrink-0">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {ens ? ens[0].toUpperCase() : address?.slice(2, 3).toUpperCase() || '?'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {ens || `${address?.slice(0, 8)}...${address?.slice(-4)}`}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 line-clamp-2">{bio || 'No bio yet'}</p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
              <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-full">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-slate-900 text-sm">{reviewCount}</span>
                <span className="text-slate-600 text-xs sm:text-sm">reviews</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600 text-xs sm:text-sm">Since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200/60">
          <h3 className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">
            Skills & Expertise
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills && skills.length > 0 ? (
              skills.map((skill) => (
                <Badge key={skill} variant="success" className="text-xs bg-emerald-100/80 hover:bg-emerald-200/80 transition-colors">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No skills listed yet</p>
            )}
          </div>
        </div>
      </Card>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border-2 border-transparent hover:border-emerald-300/60 transition-all duration-200 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 inline-flex items-center gap-1">
                <CurrencyDisplay amount={formatCurrency(totalEarnings, 'IDRX')} currency="IDRX" />
              </p>
              <p className="text-xs text-slate-600">Total Earned</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-2 border-transparent hover:border-amber-300/60 transition-all duration-200 bg-gradient-to-br from-white to-amber-50/30 hover:shadow-md group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 inline-flex items-center gap-1">
                <CurrencyDisplay amount={formatCurrency(pendingEarnings, 'IDRX')} currency="IDRX" />
              </p>
              <p className="text-xs text-slate-600">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-2 border-transparent hover:border-brand-300/60 transition-all duration-200 bg-gradient-to-br from-white to-brand-50/30 hover:shadow-md group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-200/50 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-brand-600">{completedProjects}</p>
              <p className="text-xs text-slate-600">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal */}
      <Card className="p-4 sm:p-5 border-2 border-transparent">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Withdraw Earnings</h2>
        <div className="bg-gradient-to-br from-green-50 via-emerald-50/80 to-green-50/60 rounded-xl p-4 sm:p-6 mb-4 border border-emerald-200/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-slate-600">Available to Withdraw</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 inline-flex items-center gap-1">
                {isBalanceLoading ? '...' : (
                  <CurrencyDisplay amount={formatCurrency(withdrawableBalance, 'IDRX')} currency="IDRX" />
                )}
              </p>
              {balance && (
                <div className="text-xs text-slate-500 mt-1.5 sm:mt-2 space-y-0.5">
                  <div className="flex justify-between gap-4">
                    <span>Escrow:</span>
                    <span className="font-medium text-slate-700 inline-flex items-center gap-1">
                      <CurrencyDisplay amount={formatCurrency(BigInt(balance.escrowAmount) / 1000000n, 'IDRX')} currency="IDRX" />
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Yield:</span>
                    <span className="font-medium text-slate-700 inline-flex items-center gap-1">
                      <CurrencyDisplay amount={formatCurrency(BigInt(balance.yieldAmount) / 1000000n, 'IDRX')} currency="IDRX" />
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 flex-shrink-0">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-3 sm:p-3 mb-4 border border-emerald-200/30">
            <p className="text-xs text-slate-600 mb-1">Wallet Address</p>
            <p className="font-mono text-slate-900 text-xs break-all">{address}</p>
          </div>

          {withdrawableBalance > 0 ? (
            <Button
              variant="success"
              className="w-full shadow-md shadow-emerald-200/50"
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Withdrawing...
                </span>
              ) : (
                'Withdraw to Wallet'
              )}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              No Earnings to Withdraw
            </Button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Withdrawals are processed instantly on the Base network. Gas fees apply.
        </p>
      </Card>

      {/* Portfolio / On-chain CV */}
      <Card className="p-4 sm:p-5 border-2 border-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">On-Chain CV</h2>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Share Link
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-br from-slate-50 via-white to-brand-50/30 rounded-xl p-4 border border-brand-200/40 hover:border-brand-300/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-200/50 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Your On-Chain Profile</p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">novalance.eth/profile/{address?.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl p-3 sm:p-4 text-center border border-brand-200/60 hover:shadow-sm transition-shadow">
              <p className="text-xl sm:text-2xl font-bold text-brand-700">{completedProjects}</p>
              <p className="text-xs text-brand-600 uppercase tracking-wide font-medium mt-1">Completed Projects</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200/60 hover:shadow-sm transition-shadow">
              <p className="text-xl sm:text-2xl font-bold text-emerald-700">{reviewCount}</p>
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium mt-1">Reviews Received</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Experience - Hidden for now since not in backend */}
      {false && (
        <Card className="p-4 sm:p-5 border-2 border-transparent">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Experience</h2>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-slate-500 italic">Experience data coming soon</p>
          </div>
        </Card>
      )}
    </div>
  );
}
