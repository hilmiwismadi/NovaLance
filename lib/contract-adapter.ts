/**
 * NovaLance Contract Adapter
 *
 * This file adapts the BaseHackathon ProjectLance contract functions
 * to the NovaLance frontend's KPI-based terminology.
 *
 * Mapping:
 * - KPI -> Milestone
 * - Role -> Project (simplified - single freelancer per project)
 * - depositKPI() -> depositFunds()
 * - approveKPI() -> acceptMilestone()
 * - submitKPICompletion() -> submitMilestone()
 * - withdrawMilestone() -> withdrawMilestone() (same)
 */

import { Address, Hash } from 'viem';

// ============================================================================
// Contract Addresses (BaseHackathon Deployment)
// ============================================================================

export const CONTRACT_ADDRESSES = {
  baseMainnet: {
    projectLance: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after mainnet deployment
    mockLendingProtocol: '0x0000000000000000000000000000000000000000' as Address,
  },
  baseSepolia: {
    // Deployed to Base Sepolia on 2025-01-31
    projectLance: '0x87c5C1a665cE300B13Cf5DE7a5d206386E93049c' as Address,
    mockLendingProtocol: '0xcAD07A2741E3C08D79452F9CA337DE3a3947eae5' as Address,
    mockIDRX: '0x026632AcAAc18Bc99c3f7fa930116189B6ba8432' as Address,
  },
  localhost: {
    // Local anvil deployment - from temp_address.txt
    projectLance: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4' as Address,
    mockLendingProtocol: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,
  },
} as const;

export function getContractAddresses(chainId: number) {
  if (chainId === 8453) return CONTRACT_ADDRESSES.baseMainnet;
  if (chainId === 84532) return CONTRACT_ADDRESSES.baseSepolia;
  if (chainId === 31337) return CONTRACT_ADDRESSES.localhost;
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

// ============================================================================
// Contract Function Name Mappings
// ============================================================================

/**
 * Maps frontend KPI function names to actual contract function names
 */
export const CONTRACT_FUNCTIONS = {
  // Project Management
  createProject: 'createProject',
  applyForProject: 'applyForProject',
  acceptFreelancer: 'acceptFreelancer',
  cancelProject: 'cancelProject',

  // Fund Management
  depositFunds: 'depositFunds', // Mapped from depositKPI

  // Milestone Management (was KPI)
  submitMilestone: 'submitMilestone', // Mapped from submitKPICompletion
  acceptMilestone: 'acceptMilestone', // Mapped from approveKPI
  withdrawMilestone: 'withdrawMilestone', // Same name

  // View Functions
  getProject: 'getProject',
  getMilestone: 'getMilestone', // Mapped from getKPI
  getAllMilestones: 'getAllMilestones', // Mapped from getAllKPIs
  getVaultBalance: 'getVaultBalance',
  getLendingBalance: 'getLendingBalance',
  getMilestonePenalty: 'getMilestonePenalty', // Mapped from getKPIPenalty
  calculateWithdrawalAmounts: 'calculateWithdrawalAmounts',
  getApplicants: 'getApplicants',
} as const;

// ============================================================================
// Enum Mappings
// ============================================================================

/**
 * Project status enum matching the contract
 */
export enum ProjectStatus {
  Active = 0,    // Hiring
  Assigned = 1,  // InProgress
  Completed = 2,
  Cancelled = 3,
}

/**
 * Milestone status (derived from contract state)
 */
export enum MilestoneStatus {
  Pending = 0,      // Not submitted
  Submitted = 1,    // Submitted, not accepted
  Accepted = 2,     // Accepted, ready for withdrawal
  Withdrawn = 3,    // Funds released
}

// ============================================================================
// Type Mappings
// ============================================================================

/**
 * Contract Milestone struct
 */
export interface ContractMilestone {
  deadline: bigint;
  percentage: bigint;
  released: boolean;
  accepted: boolean;
  submissionTime: bigint;
  actualAmount: bigint;
  yieldAmount: bigint;
  isLastMilestone: boolean;
}

/**
 * Contract Project struct
 */
export interface ContractProject {
  creator: Address;
  freelancer: Address;
  status: ProjectStatus;
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
  cancelledTimestamp: bigint;
}

/**
 * Frontend KPI type (mapped from Milestone)
 */
export interface KPI {
  id: Hash;
  projectId: Hash;
  milestoneIndex: number;
  percentage: number; // 0-100
  deadline: Date;
  depositedAmount: bigint;
  yieldAmount: bigint;
  status: MilestoneStatus;
  poApproved: boolean;
  flApproved: boolean;
  penalty: number; // 0-100 (percentage)
}

/**
 * Frontend Project type (mapped from Contract)
 */
export interface Project {
  id: number;
  creator: Address;
  freelancer: Address | null;
  status: ProjectStatus;
  totalBudget: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestones: KPI[];
  createdAt: bigint;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert contract milestone to frontend KPI
 */
export function milestoneToKPI(
  milestone: ContractMilestone,
  milestoneIndex: number,
  projectId: number
): KPI {
  // Determine status
  let status: MilestoneStatus;
  if (milestone.released) {
    status = MilestoneStatus.Withdrawn;
  } else if (milestone.accepted) {
    status = MilestoneStatus.Accepted;
  } else if (milestone.submissionTime > 0) {
    status = MilestoneStatus.Submitted;
  } else {
    status = MilestoneStatus.Pending;
  }

  // Generate KPI ID from projectId and milestone index
  const kpiId = `${projectId}-${milestoneIndex}` as Hash;

  return {
    id: kpiId,
    projectId: projectId as unknown as Hash,
    milestoneIndex,
    percentage: Number(milestone.percentage) / 100, // Convert basis points to percentage
    deadline: new Date(Number(milestone.deadline) * 1000),
    depositedAmount: milestone.actualAmount,
    yieldAmount: milestone.yieldAmount,
    status,
    poApproved: milestone.accepted,
    flApproved: milestone.released, // FL "confirms" by withdrawing
    penalty: 0, // Will be calculated separately
  };
}

/**
 * Convert contract project to frontend project
 */
export function contractProjectToProject(
  contractProject: ContractProject,
  milestones: ContractMilestone[],
  projectId: number
): Project {
  return {
    id: projectId,
    creator: contractProject.creator,
    freelancer: contractProject.freelancer || null,
    status: contractProject.status,
    totalBudget: contractProject.totalDeposited,
    vaultAmount: contractProject.vaultAmount,
    lendingAmount: contractProject.lendingAmount,
    milestones: milestones.map((m, i) => milestoneToKPI(m, i, projectId)),
    createdAt: BigInt(0), // Not tracked in contract
  };
}

/**
 * Calculate yield percentage
 */
export function calculateYieldPercentage(
  lendingAmount: bigint,
  currentLendingBalance: bigint
): number {
  if (lendingAmount === BigInt(0)) return 0;
  if (currentLendingBalance <= lendingAmount) return 0;

  const yieldAmount = currentLendingBalance - lendingAmount;
  return Number((yieldAmount * BigInt(10000)) / lendingAmount) / 100; // Basis points to percentage
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate milestone percentages sum to 100%
 */
export function validateMilestonePercentages(percentages: number[]): boolean {
  const total = percentages.reduce((sum, p) => sum + p, 0);
  return Math.abs(total - 100) < 0.01; // Allow for floating point errors
}

/**
 * Convert percentage array to basis points array
 */
export function percentagesToBasisPoints(percentages: number[]): bigint[] {
  return percentages.map(p => BigInt(Math.round(p * 100)));
}

/**
 * Convert deadlines to timestamps
 */
export function deadlinesToTimestamps(deadlines: Date[]): bigint[] {
  return deadlines.map(d => BigInt(Math.floor(d.getTime() / 1000)));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format basis points to percentage
 */
export function basisPointsToPercentage(basisPoints: bigint): number {
  return Number(basisPoints) / 100;
}

/**
 * Format percentage to basis points
 */
export function percentageToBasisPoints(percentage: number): bigint {
  return BigInt(Math.round(percentage * 100));
}

/**
 * Calculate penalty from basis points
 */
export function calculatePenaltyPercentage(penaltyBps: bigint): number {
  return Number(penaltyBps) / 100;
}

/**
 * Check if milestone is last
 */
export function isLastMilestone(milestoneIndex: number, totalMilestones: number): boolean {
  return milestoneIndex === totalMilestones - 1;
}

/**
 * Format withdrawal amounts for display
 */
export interface WithdrawalBreakdown {
  freelancerVaultAmount: string;
  freelancerYieldAmount: string;
  creatorYieldAmount: string;
  platformYieldAmount: string;
  totalFreelancerAmount: string;
  penaltyAmount: string;
}

export function formatWithdrawalAmounts(
  freelancerVaultAmount: bigint,
  freelancerYieldAmount: bigint,
  creatorYieldAmount: bigint,
  platformYieldAmount: bigint,
  penalty: bigint
): WithdrawalBreakdown {
  return {
    freelancerVaultAmount: formatEther(freelancerVaultAmount),
    freelancerYieldAmount: formatEther(freelancerYieldAmount),
    creatorYieldAmount: formatEther(creatorYieldAmount),
    platformYieldAmount: formatEther(platformYieldAmount),
    totalFreelancerAmount: formatEther(freelancerVaultAmount + freelancerYieldAmount),
    penaltyAmount: formatEther(penalty),
  };
}

/**
 * Format bigint to ether string (6 decimals for USDC/IDRX)
 */
function formatEther(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}
