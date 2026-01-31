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
  PROJECTLANCE_ABI,
  LENDING_PROTOCOL_ABI,
  ERC20_ABI,
} from './abi';
import { getContractAddresses as getAdapterAddresses } from './contract-adapter';
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
import { formatUnits } from 'viem';

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
          id: generateKPIId(`0x${roleIndex}` as Hash, kpiIndex),
        })),
      })),
      createdAt: new Date().toISOString(),
      createdBy: address,
    };

    // Upload to IPFS
    const metadataHash = await uploadToIPFS(metadata);

    // Get token address
    let paymentToken: Address;
    const tokenAddresses = getTokenAddresses(chain.id);
    if (isNativeCurrency(data.currency)) {
      // Use WETH for ETH
      paymentToken = tokenAddresses.WETH;
    } else if (data.currency === 'USDC') {
      paymentToken = tokenAddresses.USDC;
    } else if (data.currency === 'USDT') {
      paymentToken = tokenAddresses.USDT;
    } else {
      // Default to USDC
      paymentToken = tokenAddresses.USDC;
    }

    // Parse budget
    const totalBudget = parseTokenAmount(data.totalBudget.toString(), data.currency);

    // Call contract
    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'createProject',
      args: [projectId, metadataHash, totalBudget, paymentToken],
    });
    return hash || null;
  };

  return {
    createProject,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'depositKPI',
      args: [args.projectId, args.kpiId, amount],
    });
    return hash || null;
  };

  const approveToken = async (args: {
    tokenAddress: Address;
    amount: bigint;
  }) => {
    if (!chain) {
      throw new Error('Wallet not connected');
    }

    writeContract({
      address: args.tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractAddress!, args.amount],
    });
    return hash || null;
  };

  return {
    deposit,
    approveToken,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'approveKPI',
      args: [args.projectId, args.kpiId, args.isPO],
    });
    return hash || null;
  };

  return {
    approve,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'applyForJob',
      args: [args.projectId, args.roleId, coverLetterHash],
    });
    return hash || null;
  };

  return {
    apply,
    isPending,
    error,
    hash: hash || null,
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
      amount = BigInt(0); // Contract will use full balance
    }

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
    return hash || null;
  };

  return {
    withdraw,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'assignFreelancer',
      args: [args.projectId, args.roleId, args.freelancer],
    });
    return hash || null;
  };

  return {
    assign,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'submitKPICompletion',
      args: [args.projectId, args.kpiId, deliverablesHash],
    });
    return hash || null;
  };

  return {
    submit,
    isPending,
    error,
    hash: hash || null,
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

    writeContract({
      address: contractAddress,
      abi: NOVALANCE_ABI,
      functionName: 'cancelProject',
      args: [args.projectId, args.reason],
    });
    return hash || null;
  };

  return {
    cancel,
    isPending,
    error,
    hash: hash || null,
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

// ============================================================================
// ProjectLance Hooks (BaseHackathon Integration)
// ============================================================================

/**
 * Get ProjectLance contract address for current chain
 */
function useProjectLanceAddress() {
  const { chain } = useAccount();

  return useMemo(() => {
    if (!chain) return null;
    try {
      const addresses = getAdapterAddresses(chain.id);
      return addresses.projectLance;
    } catch {
      return null;
    }
  }, [chain]);
}

/**
 * Get MockLendingProtocol contract address
 */
function useLendingProtocolAddress() {
  const { chain } = useAccount();

  return useMemo(() => {
    if (!chain) return null;
    try {
      const addresses = getAdapterAddresses(chain.id);
      return addresses.mockLendingProtocol;
    } catch {
      return null;
    }
  }, [chain]);
}

// ============================================================================
// ProjectLance Write Hooks
// ============================================================================

/**
 * Hook for creating a project with milestones (ProjectLance)
 */
export interface UsePLCreateProjectResult {
  createProject: (args: {
    deadlines: bigint[];
    percentages: bigint[];
  }) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLCreateProject(): UsePLCreateProjectResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const createProject = async (args: {
    deadlines: bigint[];
    percentages: bigint[];
  }) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'createProject',
      args: [args.deadlines, args.percentages],
    });

    return hash || null;
  };

  return { createProject, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for applying to a project (ProjectLance)
 */
export interface UsePLApplyForProjectResult {
  apply: (projectId: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLApplyForProject(): UsePLApplyForProjectResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const apply = async (projectId: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'applyForProject',
      args: [projectId],
    });

    return hash || null;
  };

  return { apply, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for accepting a freelancer (ProjectLance)
 */
export interface UsePLAcceptFreelancerResult {
  accept: (projectId: bigint, freelancer: Address) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLAcceptFreelancer(): UsePLAcceptFreelancerResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const accept = async (projectId: bigint, freelancer: Address) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'acceptFreelancer',
      args: [projectId, freelancer],
    });

    return hash || null;
  };

  return { accept, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for depositing funds to a project (ProjectLance)
 */
export interface UsePLDepositFundsResult {
  deposit: (projectId: bigint, amount: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLDepositFunds(): UsePLDepositFundsResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const deposit = async (projectId: bigint, amount: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'depositFunds',
      args: [projectId, amount],
    });

    return hash || null;
  };

  return { deposit, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for submitting a milestone (ProjectLance)
 */
export interface UsePLSubmitMilestoneResult {
  submit: (projectId: bigint, milestoneIndex: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLSubmitMilestone(): UsePLSubmitMilestoneResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const submit = async (projectId: bigint, milestoneIndex: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'submitMilestone',
      args: [projectId, milestoneIndex],
    });

    return hash || null;
  };

  return { submit, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for accepting a milestone (ProjectLance)
 */
export interface UsePLAcceptMilestoneResult {
  accept: (projectId: bigint, milestoneIndex: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLAcceptMilestone(): UsePLAcceptMilestoneResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const accept = async (projectId: bigint, milestoneIndex: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'acceptMilestone',
      args: [projectId, milestoneIndex],
    });

    return hash || null;
  };

  return { accept, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for withdrawing a milestone (ProjectLance)
 */
export interface UsePLWithdrawMilestoneResult {
  withdraw: (projectId: bigint, milestoneIndex: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLWithdrawMilestone(): UsePLWithdrawMilestoneResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const withdraw = async (projectId: bigint, milestoneIndex: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'withdrawMilestone',
      args: [projectId, milestoneIndex],
    });

    return hash || null;
  };

  return { withdraw, isPending, error, hash: hash || null, isSuccess };
}

/**
 * Hook for canceling a project (ProjectLance)
 */
export interface UsePLCancelProjectResult {
  cancel: (projectId: bigint) => Promise<Hash | null>;
  isPending: boolean;
  error: Error | null;
  hash: Hash | null;
  isSuccess: boolean;
}

export function usePLCancelProject(): UsePLCancelProjectResult {
  const contractAddress = useProjectLanceAddress();
  const { writeContract, data: hash, isPending, error, isSuccess } = useWriteContract();

  const cancel = async (projectId: bigint) => {
    if (!contractAddress) {
      throw new Error('ProjectLance contract not found on this chain');
    }

    writeContract({
      address: contractAddress,
      abi: PROJECTLANCE_ABI,
      functionName: 'cancelProject',
      args: [projectId],
    });

    return hash || null;
  };

  return { cancel, isPending, error, hash: hash || null, isSuccess };
}

// ============================================================================
// ProjectLance Read Hooks
// ============================================================================

/**
 * Hook for getting project details (ProjectLance)
 */
export function usePLProject(projectId: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getProject',
    args: [projectId],
    query: {
      enabled: !!contractAddress && projectId !== undefined,
    },
  });

  return {
    project: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting a milestone (ProjectLance)
 */
export function usePLMilestone(projectId: bigint, milestoneIndex: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getMilestone',
    args: [projectId, milestoneIndex],
    query: {
      enabled: !!contractAddress && projectId !== undefined && milestoneIndex !== undefined,
    },
  });

  return {
    milestone: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting all milestones for a project (ProjectLance)
 */
export function usePLAllMilestones(projectId: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getAllMilestones',
    args: [projectId],
    query: {
      enabled: !!contractAddress && projectId !== undefined,
      refetchInterval: 10000, // Poll every 10 seconds
    },
  });

  return {
    milestones: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting vault balance (ProjectLance)
 */
export function usePLVaultBalance(projectId: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getVaultBalance',
    args: [projectId],
    query: {
      enabled: !!contractAddress && projectId !== undefined,
      refetchInterval: 15000,
    },
  });

  return {
    balance: result.data as bigint | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting lending balance (ProjectLance)
 */
export function usePLLendingBalance(projectId: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getLendingBalance',
    args: [projectId],
    query: {
      enabled: !!contractAddress && projectId !== undefined,
      refetchInterval: 10000, // Poll more frequently for yield updates
    },
  });

  return {
    balance: result.data as bigint | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for calculating withdrawal amounts (ProjectLance)
 */
export function usePLWithdrawalAmounts(projectId: bigint, milestoneIndex: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'calculateWithdrawalAmounts',
    args: [projectId, milestoneIndex],
    query: {
      enabled: !!contractAddress && projectId !== undefined && milestoneIndex !== undefined,
    },
  });

  return {
    amounts: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting milestone penalty (ProjectLance)
 */
export function usePLMilestonePenalty(projectId: bigint, milestoneIndex: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getMilestonePenalty',
    args: [projectId, milestoneIndex],
    query: {
      enabled: !!contractAddress && projectId !== undefined && milestoneIndex !== undefined,
    },
  });

  return {
    penalty: result.data as bigint | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting project applicants (ProjectLance)
 */
export function usePLApplicants(projectId: bigint) {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'getApplicants',
    args: [projectId],
    query: {
      enabled: !!contractAddress && projectId !== undefined,
    },
  });

  return {
    applicants: result.data as Address[] | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting project count (ProjectLance)
 */
export function usePLProjectCount() {
  const contractAddress = useProjectLanceAddress();

  const result = useReadContract({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    functionName: 'projectCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return {
    count: result.data as bigint | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================================================
// Combined Yield Hook
// ============================================================================

/**
 * Hook for getting complete yield information for a project
 */
export function usePLYield(projectId: bigint) {
  const vaultBalance = usePLVaultBalance(projectId);
  const lendingBalance = usePLLendingBalance(projectId);
  const project = usePLProject(projectId);

  // Calculate yield percentage
  const yieldPercentage = useMemo(() => {
    if (!project.project || !lendingBalance.balance) return 0;
    const projectArray = project.project as any[];
    const lendingAmount = projectArray[5] as bigint; // lendingAmount
    if (lendingAmount === BigInt(0)) return 0;
    if (lendingBalance.balance <= lendingAmount) return 0;
    const yieldAmount = lendingBalance.balance - lendingAmount;
    return Number((yieldAmount * BigInt(10000)) / lendingAmount) / 100; // Basis points to percentage
  }, [project.project, lendingBalance.balance]);

  // Calculate total value
  const totalValue = useMemo(() => {
    const vault = vaultBalance.balance || BigInt(0);
    const lending = lendingBalance.balance || BigInt(0);
    return vault + lending;
  }, [vaultBalance.balance, lendingBalance.balance]);

  return {
    vaultAmount: vaultBalance.balance,
    lendingAmount: lendingBalance.balance,
    lendingPrincipal: (project.project as any[])?.[5] as bigint | undefined,
    yieldPercentage,
    totalValue,
    isLoading: vaultBalance.isLoading || lendingBalance.isLoading,
    error: vaultBalance.error || lendingBalance.error,
    refetch: () => {
      vaultBalance.refetch();
      lendingBalance.refetch();
    },
  };
}

// ============================================================================
// ProjectLance Event Watching Hooks
// ============================================================================

/**
 * Watch for project created events
 */
export function useWatchPLProjectCreated(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'ProjectCreated',
    onLogs: callback,
  });
}

/**
 * Watch for freelancer applied events
 */
export function useWatchPLFreelancerApplied(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'FreelancerApplied',
    onLogs: callback,
  });
}

/**
 * Watch for funds deposited events
 */
export function useWatchPLFundsDeposited(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'FundsDeposited',
    onLogs: callback,
  });
}

/**
 * Watch for milestone submitted events
 */
export function useWatchPLMilestoneSubmitted(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'MilestoneSubmitted',
    onLogs: callback,
  });
}

/**
 * Watch for milestone accepted events
 */
export function useWatchPLMilestoneAccepted(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'MilestoneAccepted',
    onLogs: callback,
  });
}

/**
 * Watch for milestone withdrawn events
 */
export function useWatchPLMilestoneWithdrawn(callback: (logs: unknown[]) => void) {
  const contractAddress = useProjectLanceAddress();

  useWatchContractEvent({
    address: contractAddress!,
    abi: PROJECTLANCE_ABI,
    eventName: 'MilestoneWithdrawn',
    onLogs: callback,
  });
}

// ============================================================================
// Token Balance Hooks
// ============================================================================

/**
 * Hook for getting user's IDRX token balance
 */
export interface UseIDRXBalanceResult {
  balance: bigint | undefined;
  formatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useIDRXBalance(userAddress?: Address): UseIDRXBalanceResult {
  const { chain, address: connectedAddress } = useAccount();
  const targetAddress = userAddress || connectedAddress;

  // Get IDRX token address based on chain
  const tokenAddress = useMemo(() => {
    if (!chain) return null;
    try {
      const addresses = getTokenAddresses(chain.id);
      const idrxAddress = addresses.IDRX;
      // Check if it's a zero address (placeholder for baseMainnet)
      if (idrxAddress === '0x0000000000000000000000000000000000000000' as Address) {
        return null;
      }
      return idrxAddress;
    } catch {
      return null;
    }
  }, [chain]);

  const result = useReadContract({
    address: tokenAddress!,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!targetAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Format the balance (IDRX uses 18 decimals)
  const formatted = useMemo(() => {
    if (!result.data) return '0';
    return formatUnits(result.data as bigint, 18);
  }, [result.data]);

  return {
    balance: result.data as bigint | undefined,
    formatted,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================================================
// Token Approval Hook (for ERC20 token approvals)
// ============================================================================

export interface UseTokenApprovalResult {
  allowance: bigint | undefined;
  isApproved: boolean;
  isLoading: boolean;
  refetch: () => void;
  approve: (amount: bigint) => Promise<Hash | null>;
  isApproving: boolean;
  approveHash: Hash | null;
  approveIsSuccess: boolean;
}

export function useTokenApproval(tokenAddress: Address, spenderAddress: Address, ownerAddress?: Address): UseTokenApprovalResult {
  const { chain } = useAccount();
  const { writeContract, data: approveHash, isPending: isApproving, isSuccess: approveIsSuccess, error: approveError } = useWriteContract();

  // Check allowance
  const allowanceResult = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
      refetchInterval: 10000,
    },
  });

  const approve = async (amount: bigint): Promise<Hash | null> => {
    if (!chain) {
      throw new Error('Wallet not connected');
    }

    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, amount],
    });
    return approveHash || null;
  };

  return {
    allowance: allowanceResult.data as bigint | undefined,
    isApproved: (allowanceResult.data as bigint | undefined) ? (allowanceResult.data as bigint) > 0n : false,
    isLoading: allowanceResult.isLoading,
    refetch: allowanceResult.refetch,
    approve,
    isApproving,
    approveHash: approveHash || null,
    approveIsSuccess,
  };
}
