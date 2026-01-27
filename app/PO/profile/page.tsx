'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { mockUser, mockPOProjects, calculateProjectProgress, formatCurrency } from '@/lib/mockData';
import { useWithdrawableBalance, useWithdraw, useTransactionWait } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

// Get projects owned by current user
const ownerProjects = mockPOProjects.filter(
  p => p.owner.toLowerCase() === mockUser.address.toLowerCase()
);

// Separate active and completed projects
const activeProjects = ownerProjects.filter(p => p.status === 'hiring' || p.status === 'in-progress');
const completedProjects = ownerProjects.filter(p => p.status === 'completed');

export default function POProfilePage() {
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Smart contract hooks
  const { balance, isLoading: isBalanceLoading } = useWithdrawableBalance();
  const { withdraw, isPending, error, hash, isSuccess } = useWithdraw();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash);

  // Calculate withdrawable balance from smart contract or fall back to mock
  const withdrawableBalance = balance
    ? Number(balance.totalWithdrawable) / 1e6 // Assuming USDC/IDRX decimals (6)
    : 0;

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5 sm:mt-1">
          Manage your profile and earnings as a Project Owner
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
              {mockUser.ens || `${mockUser.address.slice(0, 8)}...${mockUser.address.slice(-4)}`}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">{mockUser.bio}</p>

            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-slate-900 text-sm">{mockUser.reviewCount}</span>
                <span className="text-slate-600 text-xs">reviews</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600 text-xs">Since {mockUser.memberSince}</span>
              </div>

              {/* Completion Rate Badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-emerald-700">
                  {completedProjects.length > 0 ? '100% completion' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl p-3 sm:p-4 text-center border border-brand-200/50">
          <p className="text-xl sm:text-2xl font-bold text-brand-600">{ownerProjects.length}</p>
          <p className="text-xs text-slate-600">Projects</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200/50">
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{ownerProjects.reduce((sum, p) => sum + p.roles.length, 0)}</p>
          <p className="text-xs text-slate-600">Roles Hired</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 sm:p-4 text-center border border-amber-200/50">
          <p className="text-xl sm:text-2xl font-bold text-amber-600">
            {ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0) > 0
              ? formatCurrency(ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0), 'IDRX').split(',')[0]
              : '0'}
          </p>
          <p className="text-xs text-slate-600">Total Budget</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 text-center border border-blue-200/50">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-slate-600">Active</p>
        </div>
      </div>

      {/* Project History - Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Active Projects</h2>
            <span className="text-xs sm:text-sm text-slate-500">{activeProjects.length} in progress</span>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => {
              const progress = calculateProjectProgress(project);
              const hiredRoles = project.roles.filter(r => r.assignedTo).length;

              return (
                <Link key={project.id} href={`/PO/projects/${project.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-brand-200">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                          <Badge
                            variant={project.status === 'in-progress' ? 'warning' : 'primary'}
                            className="text-xs shrink-0"
                          >
                            {project.status === 'in-progress' ? 'Active' : 'Hiring'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-bold text-brand-600">{progress}%</p>
                        <p className="text-xs text-slate-500">Progress</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-gradient-to-r from-brand-400 to-brand-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{project.roles.length} role{project.roles.length > 1 ? 's' : ''}</span>
                      <span>{hiredRoles} hired</span>
                      <span className="font-semibold text-brand-600">
                        {formatCurrency(project.totalBudget, 'IDRX')}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Project History - Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Completed Projects</h2>
            <span className="text-xs sm:text-sm text-emerald-600 font-medium">
              ✓ {completedProjects.length} delivered
            </span>
          </div>

          <div className="space-y-3">
            {completedProjects.map((project) => (
              <Card key={project.id} className="p-4 border-l-4 border-emerald-500">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                      <Badge variant="success" className="text-xs shrink-0">Completed</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-base font-bold text-emerald-600">✓ 100%</p>
                    <p className="text-xs text-slate-500">Delivered</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>{project.roles.length} role{project.roles.length > 1 ? 's' : ''}</span>
                  <span>All positions filled</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(project.totalBudget, 'IDRX')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Wallet / Withdrawal */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Wallet & Earnings</h2>

        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-slate-600 mb-1">Wallet Address</p>
          <p className="font-mono text-slate-900 text-xs sm:text-sm break-all">{mockUser.address}</p>
        </div>

        {/* Yield Earnings Section */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 sm:p-6 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Yield Earnings</h3>

          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-600">Available to Withdraw</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                {isBalanceLoading ? '...' : `$${withdrawableBalance.toLocaleString()}`}
              </p>
              {balance && (
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Escrow:</span>
                    <span>${(Number(balance.escrowAmount) / 1e6).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yield:</span>
                    <span className="text-emerald-600 font-semibold">${(Number(balance.yieldAmount) / 1e6).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          {withdrawableBalance > 0 ? (
            <Button
              variant="success"
              className="w-full"
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Withdrawing...
                </span>
              ) : (
                'Withdraw Yield Earnings'
              )}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              No Earnings to Withdraw
            </Button>
          )}
        </div>

        <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-600">Total Project Budget</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {formatCurrency(ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0), 'IDRX')}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <Button variant="outline" className="w-full text-xs sm:text-sm">
            View on Base Explorer
          </Button>
        </div>
      </Card>

      {/* No projects yet state */}
      {ownerProjects.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-600 mb-6">Create your first project to start building your reputation</p>
          <Link href="/PO/create-project">
            <Button variant="primary">Create Your First Project</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
