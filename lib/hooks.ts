/**
 * NovaLance Smart Contract Hooks
 *
 * Custom React hooks for interacting with the NovaLance smart contracts.
 * These hooks provide a clean interface for components to read/write to the blockchain.
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import {
  NOVALANCE_ABI,
  ERC20_ABI,
} from './abi';
import {
  getContractAddresses,
  getTokenAddresses,
  uploadToIPFS,
  generateProjectId,
  generateKPIId,
  parseTokenAmount,
  formatTokenAmount,
  formatCurrency,
  isNativeCurrency,
  validateProjectData,
  type Project,
  type Role,
  type KPI,
  type YieldInfo,
  type WithdrawableBalance,
} from './contract';
import type { Hash, Address } from 'viem';

// ============================================================================
// Helper hook to get contract address
// ============================================================================

function useContractAddress() {
  const { chain } = useAccount();

  return useMemo(() => {
    if (!chain) return null;
    try {
      const addresses = getContractAddresses(chain.id);
      return addresses.novaLance;
    } catch {
      return null;
    }
  }, [chain]);
}

// ============================================================================
// Project Creation Hook
// ============================================================================

export interface UseCreateProjectResult {
  createProject: (data: {
    title: string;
    description: string;
    totalBudget: number;
    currency: string;
    roles: Array<{
      title: string;
      description: string;
      budget: number;
      skills: string[];
      kpis: Array<{
        name: string;
        percentage: number;
        description: string;
        deadline: string;
      }>;
    }>;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useCreateProject(): UseCreateProjectResult {
  const contractAddress = useContractAddress();
  const { chain, address } = useAccount();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const createProject = async (data: {
    title: string;
    description: string;
    totalBudget: number;
    currency: string;
    roles: Array<{
      title: string;
      description: string;
      budget: number;
      skills: string[];
      kpis: Array<{
        name: string;
        percentage: number;
        description: string;
        deadline: string;
      }>;
    }>;
  }) => {
    if (!contractAddress || !chain || !address) {
      throw new Error('Wallet not connected or unsupported chain');
    }

    // Validate project data
    const validation = validateProjectData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generate project ID
    const projectId = generateProjectId(data.title, address, Date.now());

    // Prepare metadata for IPFS
    const metadata = {
      title: data.title,
      description: data.description,
      totalBudget: data.totalBudget,
      currency: data.currency,
      roles: data.roles.map((role, roleIndex) => ({
        title: role.title,
        description: role.description,
        budget: role.budget,
        skills: role.skills,
        kpis: role.kpis.map((kpi, kpiIndex) => ({
          name: kpi.name,
          percentage: kpi.percentage,
          description: kpi.description,
          deadline: kpi.deadline,
          id: generateKPIId(`role-${roleIndex}`, kpiIndex),
        })),
      })),
      createdAt: new Date().toISOString(),
      createdBy: address,
    };

    // Upload to IPFS
    const metadataHash = await uploadToIPFS(metadata);

    // Get token address
    let paymentToken: Address;
    if (isNativeCurrency(data.currency)) {
      // Use WETH for ETH
      paymentToken = getTokenAddresses(chain.id).WETH;
    } else {
      paymentToken = getTokenAddresses(data.currency, chain.id);
    }

    // Parse budget
    const totalBudget = parseTokenAmount(data.totalBudget.toString(), data.currency);

    // Call contract
    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'createProject',
      args: [projectId, metadataHash, totalBudget, paymentToken],
    });
  };

  return {
    createProject,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// KPI Deposit Hook
// ============================================================================

export interface UseDepositKPIResult {
  deposit: (args: {
    projectId: Hash;
    kpiId: Hash;
    amount: number;
    currency: string;
  }) => Promise<Hash | null>;
  approveToken: (args: {
    tokenAddress: Address;
    amount: bigint;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useDepositKPI(): UseDepositKPIResult {
  const contractAddress = useContractAddress();
  const { chain } = useAccount();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const deposit = async (args: {
    projectId: Hash;
    kpiId: Hash;
    amount: number;
    currency: string;
  }) => {
    if (!contractAddress || !chain) {
      throw new Error('Wallet not connected or unsupported chain');
    }

    const amount = parseTokenAmount(args.amount.toString(), args.currency);

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'depositKPI',
      args: [args.projectId, args.kpiId, amount],
    });
  };

  const approveToken = async (args: {
    tokenAddress: Address;
    amount: bigint;
  }) => {
    if (!chain) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: args.tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractAddress!, args.amount],
    });
  };

  return {
    deposit,
    approveToken,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// KPI Approval Hook
// ============================================================================

export interface UseApproveKPIResult {
  approve: (args: {
    projectId: Hash;
    kpiId: Hash;
    isPO: boolean;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useApproveKPI(): UseApproveKPIResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const approve = async (args: {
    projectId: Hash;
    kpiId: Hash;
    isPO: boolean;
  }) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'approveKPI',
      args: [args.projectId, args.kpiId, args.isPO],
    });
  };

  return {
    approve,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// Job Application Hook
// ============================================================================

export interface UseApplyForJobResult {
  apply: (args: {
    projectId: Hash;
    roleId: Hash;
    coverLetter: string;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useApplyForJob(): UseApplyForJobResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const apply = async (args: {
    projectId: Hash;
    roleId: Hash;
    coverLetter: string;
  }) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    // Upload cover letter to IPFS
    const coverLetterHash = await uploadToIPFS({
      coverLetter: args.coverLetter,
      submittedAt: new Date().toISOString(),
    });

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'applyForJob',
      args: [args.projectId, args.roleId, coverLetterHash],
    });
  };

  return {
    apply,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// Withdraw Hook
// ============================================================================

export interface UseWithdrawResult {
  withdraw: (amount?: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useWithdraw(): UseWithdrawResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const withdraw = async (amount?: bigint) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    if (!amount) {
      // Withdraw full balance (contract will handle this)
      amount = 0n; // Contract will use full balance
    }

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  };

  return {
    withdraw,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// Freelancer Assignment Hook
// ============================================================================

export interface UseAssignFreelancerResult {
  assign: (args: {
    projectId: Hash;
    roleId: Hash;
    freelancer: Address;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useAssignFreelancer(): UseAssignFreelancerResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const assign = async (args: {
    projectId: Hash;
    roleId: Hash;
    freelancer: Address;
  }) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'assignFreelancer',
      args: [args.projectId, args.roleId, args.freelancer],
    });
  };

  return {
    assign,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// KPI Completion Submission Hook
// ============================================================================

export interface UseSubmitKPIResult {
  submit: (args: {
    projectId: Hash;
    kpiId: Hash;
    deliverables: {
      links: string[];
      description: string;
    };
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useSubmitKPI(): UseSubmitKPIResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const submit = async (args: {
    projectId: Hash;
    kpiId: Hash;
    deliverables: {
      links: string[];
      description: string;
    };
  }) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    // Upload deliverables to IPFS
    const deliverablesHash = await uploadToIPFS({
      ...args.deliverables,
      submittedAt: new Date().toISOString(),
    });

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'submitKPICompletion',
      args: [args.projectId, args.kpiId, deliverablesHash],
    });
  };

  return {
    submit,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// Project Cancellation Hook
// ============================================================================

export interface UseCancelProjectResult {
  cancel: (args: {
    projectId: Hash;
    reason: string;
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function useCancelProject(): UseCancelProjectResult {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const cancel = async (args: {
    projectId: Hash;
    reason: string;
  }) => {
    if (!contractAddress) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'cancelProject',
      args: [args.projectId, args.reason],
    });
  };

  return {
    cancel,
    isPending,
    error,
    hash,
    isSuccess,
  };
}

// ============================================================================
// Read Hooks
// ============================================================================

export function useProject(projectId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getProject',
    args: [projectId],
    query: {
      enabled: !!contractAddress && !!projectId,
    },
  });

  return {
    project: result.data as Project | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRole(projectId: Hash, roleId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getRole',
    args: [projectId, roleId],
    query: {
      enabled: !!contractAddress && !!projectId && !!roleId,
    },
  });

  return {
    role: result.data as Role | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useKPI(projectId: Hash, kpiId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getKPI',
    args: [projectId, kpiId],
    query: {
      enabled: !!contractAddress && !!projectId && !!kpiId,
    },
  });

  return {
    kpi: result.data as KPI | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useYieldInfo(kpiId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getYieldInfo',
    args: [kpiId],
    query: {
      enabled: !!contractAddress && !!kpiId,
      refetchInterval: 10000, // Refetch every 10 seconds for live updates
    },
  });

  return {
    yieldInfo: result.data as YieldInfo | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWithdrawableBalance(userAddress?: Address) {
  const contractAddress = useContractAddress();
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getWithdrawableBalance',
    args: [targetAddress!],
    query: {
      enabled: !!contractAddress && !!targetAddress,
      refetchInterval: 15000, // Refetch every 15 seconds
    },
  });

  return {
    balance: result.data as WithdrawableBalance | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useLPValue(kpiId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getLPValue',
    args: [kpiId],
    query: {
      enabled: !!contractAddress && !!kpiId,
      refetchInterval: 10000, // Refetch every 10 seconds for live updates
    },
  });

  return {
    value: result.data as bigint | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useUserProjects(asPO: boolean) {
  const contractAddress = useContractAddress();
  const { address } = useAccount();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getUserProjects',
    args: [address!, asPO],
    query: {
      enabled: !!contractAddress && !!address,
    },
  });

  return {
    projectIds: result.data as Hash[] | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRoleApplications(roleId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getRoleApplications',
    args: [roleId],
    query: {
      enabled: !!contractAddress && !!roleId,
    },
  });

  return {
    applicants: result.data as Address[] | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAllLPPositions(projectId: Hash) {
  const contractAddress = useContractAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    functionName: 'getAllLPPositions',
    args: [projectId],
    query: {
      enabled: !!contractAddress && !!projectId,
      refetchInterval: 10000,
    },
  });

  return {
    positions: result.data as unknown[] | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================================================
// Transaction Wait Hook
// ============================================================================

export function useTransactionWait(hash?: Hash) {
  const { data, error, isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt: data,
    error,
    isLoading,
    isSuccess,
  };
}

// ============================================================================
// Event Watching Hooks
// ============================================================================

export function useWatchProjectCreated(callback: (logs: unknown[]) => void) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    eventName: 'ProjectCreated',
    onLogs: callback,
  });
}

export function useWatchKPIApproved(callback: (logs: unknown[]) => void) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    eventName: 'KPIApproved',
    onLogs: callback,
  });
}

export function useWatchWithdrawal(callback: (logs: unknown[]) => void) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: NOVALANCE_ABI,
    eventName: 'Withdrawal',
    onLogs: callback,
  });
}
