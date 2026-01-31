'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import {
  usePLProject,
  usePLDepositFunds,
  usePLVaultBalance,
  usePLLendingBalance,
  useIDRXBalance,
  useTransactionWait,
  useTokenApproval,
} from '@/lib/hooks';
import { getContractAddresses, getTokenAddresses } from '@/lib/contract';
import { Address } from 'viem';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showError,
} from '@/lib/transactions';
import { formatCurrency, parseTokenAmount, formatTokenAmount } from '@/lib/contract';
import { formatUnits } from 'viem';

export default function FundProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [useMaxBalance, setUseMaxBalance] = useState(false);
  const [pendingDepositAmount, setPendingDepositAmount] = useState<bigint | null>(null);

  const projectId = params.id as string;
  const projectLanceId = BigInt(parseInt(projectId) || 0);

  // Get token addresses
  const idrxTokenAddress = chain ? getTokenAddresses(chain.id).IDRX : undefined;
  const projectLanceAddress = chain ? getContractAddresses(chain.id).projectLance : undefined;

  // Project data
  const { project, isLoading: isProjectLoading, refetch: refetchProject } = usePLProject(projectLanceId);
  const { balance: vaultBalance } = usePLVaultBalance(projectLanceId);
  const { balance: lendingBalance } = usePLLendingBalance(projectLanceId);
  const { balance: walletBalance, formatted: walletBalanceFormatted } = useIDRXBalance(address);

  // Token approval hook
  const {
    allowance,
    isApproved,
    isLoading: allowanceLoading,
    refetch: refetchAllowance,
    approve,
    isApproving,
    approveHash,
    approveIsSuccess,
  } = useTokenApproval(idrxTokenAddress!, projectLanceAddress!, address);

  // Deposit hook
  const { deposit, isPending, error, hash, isSuccess } = usePLDepositFunds();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useTransactionWait(approveHash ?? undefined);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Refetch allowance after approval is confirmed and auto-deposit if pending
  useEffect(() => {
    if (isApproveConfirmed && approveHash) {
      showTransactionSuccess(approveHash, 'Token approved! Depositing funds...');
      refetchAllowance();

      // Auto-trigger deposit if there's a pending amount
      if (pendingDepositAmount) {
        setTimeout(async () => {
          try {
            await deposit(projectLanceId, pendingDepositAmount);
            setPendingDepositAmount(null);
          } catch (err) {
            const error = err as Error;
            showError('Deposit Failed', error.message);
            setPendingDepositAmount(null);
          }
        }, 500);
      }
    }
  }, [isApproveConfirmed, approveHash, refetchAllowance, pendingDepositAmount, projectLanceId]);

  // Handle deposit success
  useEffect(() => {
    if (isSuccess && hash) {
      showTransactionPending(hash, 'Deposit Funds', chain?.id || 84532);
    }
  }, [isSuccess, hash, chain]);

  // Handle deposit confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Funds deposited successfully!');
      refetchProject();
      // Navigate immediately after showing success
      router.push(`/PO/projects/${projectId}`);
    }
  }, [isConfirmed, hash, router, projectId, refetchProject]);

  // Handle deposit error
  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to deposit funds');
    }
  }, [error, hash]);

  // Auto-fill max balance
  useEffect(() => {
    if (useMaxBalance && walletBalance !== undefined) {
      // Keep 1 IDRX for gas fees
      const maxAmount = walletBalance > BigInt(1e18) ? walletBalance - BigInt(1e18) : walletBalance;
      // Format to human-readable amount (e.g., "1000" instead of "1000000000000000000000")
      const formatted = formatUnits(maxAmount, 18);
      // Remove trailing zeros after decimal point for cleaner display
      const cleaned = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
      setDepositAmount(cleaned);
    }
  }, [useMaxBalance, walletBalance]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      showError('Wallet Not Connected', 'Please connect your wallet to deposit funds');
      return;
    }

    if (!chain || (chain.id !== 8453 && chain.id !== 84532)) {
      showError('Wrong Network', 'Please switch to Base or Base Sepolia');
      return;
    }

    // Clean the deposit amount: remove any non-numeric characters except decimal point
    const cleanAmount = (depositAmount || '0').replace(/[^\d.]/g, '').replace(/^(\d*\.\d*)\./, '$1');

    // Parse the deposit amount with correct decimals (18 for IDRX)
    const amount = parseTokenAmount(cleanAmount || '0', 'IDRX');
    if (amount <= 0) {
      showError('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (walletBalance && amount > walletBalance) {
      showError('Insufficient Balance', `You only have ${walletBalanceFormatted} IDRX`);
      return;
    }

    try {
      // Check if we need to approve tokens first
      if (!isApproved || (allowance !== undefined && allowance < amount)) {
        showInfo('Approving Tokens', 'Please approve IDRX spending in your wallet...');
        setPendingDepositAmount(amount);
        await approve(amount);
        // Deposit will auto-trigger after approval is confirmed
        return;
      }

      showInfo('Depositing Funds', 'Please confirm the transaction in your wallet...');
      await deposit(projectLanceId, amount);
    } catch (err) {
      const error = err as Error;
      showError('Transaction Failed', error.message);
      setPendingDepositAmount(null);
    }
  };

  if (!mounted) return null;

  const totalDeposited = (vaultBalance || 0n) + (lendingBalance || 0n);

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-slate-900">Fund Project</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Project Info Card */}
        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Project #{projectId}</h2>
          {isProjectLoading ? (
            <p className="text-sm text-slate-500">Loading project details...</p>
          ) : project ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Milestones:</span>
                <span className="font-medium text-slate-900">{(project as any)[6] || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Status:</span>
                <Badge variant="default">Hiring</Badge>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Your Wallet Balance */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Your IDRX Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {walletBalanceFormatted !== '0' ? new Intl.NumberFormat('id-ID').format(parseFloat(walletBalanceFormatted)) : '...'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseMaxBalance(!useMaxBalance)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
            >
              {useMaxBalance ? 'Max' : 'Max'}
            </button>
          </div>
        </Card>

        {/* Deposit Form */}
        <Card className="p-4">
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount to Deposit (IDRX) *
              </label>
              <input
                type="number"
                step="0.000000000000000001"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount (e.g., 1000)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Available: {walletBalanceFormatted !== '0' ? new Intl.NumberFormat('id-ID').format(parseFloat(walletBalanceFormatted)) : '...'} IDRX
              </p>
            </div>

            {/* Distribution Preview */}
            {depositAmount && (() => {
              try {
                const cleanAmount = depositAmount.replace(/[^\d.]/g, '').replace(/^(\d*\.\d*)\./, '$1');
                const parsedAmount = parseTokenAmount(cleanAmount || '0', 'IDRX');
                return parsedAmount > 0n;
              } catch {
                return false;
              }
            })() && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">Smart Contract Will Automatically:</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Split 90% to vault (escrow for milestone payments)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Split 10% to lending protocol (yield generation)</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <p className="text-xs text-slate-500">
                    Total: <span className="font-semibold text-slate-900">
                      {(() => {
                        try {
                          const cleanAmount = depositAmount.replace(/[^\d.]/g, '').replace(/^(\d*\.\d*)\./, '$1');
                          const parsedAmount = parseTokenAmount(cleanAmount || '0', 'IDRX');
                          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(formatUnits(parsedAmount, 18)));
                        } catch {
                          return '0';
                        }
                      })()} IDRX
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base font-semibold"
                disabled={isPending || isConfirming || isApproving || isApproveConfirming}
              >
                {isApproving || isApproveConfirming ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Approving...
                  </span>
                ) : isPending || isConfirming ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Depositing...
                  </span>
                ) : !isApproved ? (
                  'Approve & Deposit'
                ) : (
                  'Deposit Funds'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/PO/projects/${projectId}`)}
                className="w-full h-11 text-sm"
                disabled={isPending || isConfirming || isApproving || isApproveConfirming}
              >
                Skip for Now
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">About Fund Distribution</p>
              <p className="text-sm text-blue-700 mt-1">
                Your deposited funds are automatically split: 90% goes to the vault (escrow for milestone payments) and 10% goes to lending protocol for yield generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
