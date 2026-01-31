/**
 * NovaLance Smart Contract Integration
 *
 * This file provides all utilities for interacting with the NovaLance smart contracts
 * on Base mainnet and Base Sepolia testnet.
 */

import { Address, parseUnits, formatUnits, Hash } from 'viem';
import { wagmiConfig } from './wagmi';

// ============================================================================
// Contract Addresses
// ============================================================================

export const CONTRACT_ADDRESSES = {
  baseMainnet: {
    novaLance: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
    // ProjectLance contracts (BaseHackathon)
    projectLance: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
    mockLendingProtocol: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
  },
  baseSepolia: {
    novaLance: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
    // ProjectLance contracts (BaseHackathon) - Deployed 2025-01-31 (Fixed vault amount tracking)
    // Uses existing MockIDRX and MockLendingProtocol
    projectLance: '0xc6237A54029351DFcbcF374698DAB3681964809a' as Address,
    mockLendingProtocol: '0xcAD07A2741E3C08D79452F9CA337DE3a3947eae5' as Address,
    mockIDRX: '0x026632AcAAc18Bc99c3f7fa930116189B6ba8432' as Address,
  },
  localhost: {
    // Local anvil deployment - update these after local deployment
    projectLance: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4' as Address,
    mockLendingProtocol: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,
  },
} as const;

// Token addresses on Base
export const TOKEN_ADDRESSES = {
  baseMainnet: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    // IDRX would be deployed separately - using zero address as placeholder
    IDRX: '0x0000000000000000000000000000000000000000' as Address,
  },
  baseSepolia: {
    USDC: '0x036CbD5A42F7E87138939B31B4eb07330dD618E9' as Address,
    USDT: '0x616f6BE5f799c45A83bC0F75B8BdBc08f8C2fB5a' as Address,
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    // Deployed MockIDRX token
    IDRX: '0x026632AcAAc18Bc99c3f7fa930116189B6ba8432' as Address,
  },
} as const;

// Get the appropriate addresses based on current chain
export function getContractAddresses(chainId: number) {
  if (chainId === 8453) return CONTRACT_ADDRESSES.baseMainnet; // Base mainnet
  if (chainId === 84532) return CONTRACT_ADDRESSES.baseSepolia; // Base Sepolia
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

export function getTokenAddresses(chainId: number) {
  if (chainId === 8453) return TOKEN_ADDRESSES.baseMainnet;
  if (chainId === 84532) return TOKEN_ADDRESSES.baseSepolia;
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

// ============================================================================
// Types
// ============================================================================

export enum ProjectStatus {
  Draft = 0,
  Hiring = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum RoleStatus {
  Hiring = 0,
  Assigned = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum KPIStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Approved = 3,
  Rejected = 4,
}

export enum LPProtocol {
  Aave = 0,
  NusaFinance = 1,
  Morpho = 2,
}

// Solidity structs mirrored in TypeScript
export interface Project {
  id: Hash;
  po: Address;
  metadataHash: Hash;
  totalBudget: bigint;
  paymentToken: Address;
  status: ProjectStatus;
  createdAt: bigint;
}

export interface Role {
  id: Hash;
  projectId: Hash;
  budget: bigint;
  assignedFreelancer: Address;
  status: RoleStatus;
  kpiCount: bigint;
}

export interface KPI {
  id: Hash;
  roleId: Hash;
  percentage: bigint;
  deadline: bigint;
  depositedAmount: bigint;
  lpAmount: bigint;
  status: KPIStatus;
  poApproved: boolean;
  flApproved: boolean;
  yield: bigint; // Can be negative (in Solidity, would be int256)
}

export interface LPPosition {
  kpiId: Hash;
  protocolIndex: number;
  initialAmount: bigint;
  currentValue: bigint;
  yield: bigint;
  isActive: boolean;
}

export interface YieldInfo {
  lpInitialValue: bigint;
  lpCurrentValue: bigint;
  yieldProfit: bigint; // Can be negative
  yieldPercentage: bigint; // Basis points (100 = 1%)
  isDistributed: boolean;
  poShare: bigint;
  flShare: bigint;
  platformShare: bigint;
}

export interface WithdrawableBalance {
  totalWithdrawable: bigint;
  escrowAmount: bigint;
  yieldAmount: bigint;
  projectCount: bigint;
}

// ============================================================================
// IPFS Utilities
// ============================================================================

/**
 * Upload metadata to IPFS (mock implementation)
 * In production, this would use a service like Pinata, NFT.Storage, or Web3.Storage
 */
export async function uploadToIPFS(data: unknown): Promise<Hash> {
  // Mock implementation - returns a fake IPFS hash
  // In production, use actual IPFS upload:
  // const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', { ... });
  // const result = await response.json();
  // return result.IpfsHash;

  const dataStr = JSON.stringify(data);
  const hashValue = '0x' + Array.from(dataStr)
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(64, '0');
  const hash = hashValue as Hash;

  return hash;
}

/**
 * Generate a project ID from project data
 */
export function generateProjectId(title: string, creator: Address, timestamp: number): Hash {
  const data = `${title}-${creator}-${timestamp}`;
  const hashValue = '0x' + Array.from(data)
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(64, '0');
  const hash = hashValue as Hash;

  return hash;
}

/**
 * Generate a KPI ID from role data and index
 */
export function generateKPIId(roleId: Hash, index: number): Hash {
  const data = `${roleId}-${index}`;
  const hashValue = '0x' + Array.from(data)
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(64, '0');
  const hash = hashValue as Hash;

  return hash;
}

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Get token decimals for a currency
 */
export function getTokenDecimals(currency: string): number {
  switch (currency.toUpperCase()) {
    case 'IDRX':
      return 18; // MockIDRX on Base Sepolia uses 18 decimals
    case 'USDC':
    case 'USDT':
      return 6; // These stablecoins typically use 6 decimals
    case 'ETH':
      return 18;
    default:
      return 18; // Default to 18 for ERC20 tokens
  }
}

/**
 * Parse a human-readable amount to token units (wei)
 */
export function parseTokenAmount(amount: string | number, currency: string): bigint {
  const decimals = getTokenDecimals(currency);
  const amountStr = typeof amount === 'string' ? amount : amount.toString();
  return parseUnits(amountStr, decimals);
}

/**
 * Format token units (wei) to human-readable amount
 */
export function formatTokenAmount(amount: bigint, currency: string): string {
  const decimals = getTokenDecimals(currency);
  return formatUnits(amount, decimals);
}

/**
 * Get token address for a currency symbol
 */
export function getTokenAddress(currency: string, chainId: number): Address {
  const tokens = getTokenAddresses(chainId);
  const symbol = currency.toUpperCase();

  switch (symbol) {
    case 'USDC':
      return tokens.USDC;
    case 'USDT':
      return tokens.USDT;
    case 'ETH':
    case 'WETH':
      return tokens.WETH;
    case 'IDRX':
      // IDRX would need to be deployed
      throw new Error('IDRX token not deployed on this chain');
    default:
      throw new Error(`Unknown currency: ${currency}`);
  }
}

/**
 * Check if a currency is native ETH
 */
export function isNativeCurrency(currency: string): boolean {
  return currency.toUpperCase() === 'ETH';
}

// ============================================================================
// Yield Calculation Utilities
// ============================================================================

/**
 * Calculate the 90/10 split for deposits
 */
export function calculateDepositSplit(amount: bigint): {
  vaultAmount: bigint;
  lpAmount: bigint;
} {
  const vaultAmount = (amount * BigInt(90)) / BigInt(100);
  const lpAmount = (amount * BigInt(10)) / BigInt(100);

  return { vaultAmount, lpAmount };
}

/**
 * Calculate yield distribution based on profit/loss
 */
export function calculateYieldDistribution(
  profit: bigint, // Can be negative
  totalAmount: bigint
): {
  poShare: bigint;
  flShare: bigint;
  platformShare: bigint;
  flDeduction: bigint;
} {
  if (profit > 0) {
    // Profit scenario: 40/40/20 split
    const poShare = (profit * BigInt(40)) / BigInt(100);
    const flShare = (profit * BigInt(40)) / BigInt(100);
    const platformShare = (profit * BigInt(20)) / BigInt(100);

    return {
      poShare,
      flShare,
      platformShare,
      flDeduction: BigInt(0),
    };
  } else {
    // Loss scenario: FL bears loss
    const loss = -profit;
    return {
      poShare: BigInt(0),
      flShare: BigInt(0),
      platformShare: BigInt(0),
      flDeduction: loss,
    };
  }
}

/**
 * Convert yield percentage to basis points
 */
export function yieldToBasisPoints(yieldPercent: number): bigint {
  return BigInt(Math.round(yieldPercent * 100));
}

/**
 * Convert basis points to yield percentage
 */
export function basisPointsToYield(basisPoints: bigint): number {
  return Number(basisPoints) / 100;
}

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: bigint, currency: string): string {
  const decimals = getTokenDecimals(currency);
  const formatted = formatUnits(amount, decimals);

  if (currency.toUpperCase() === 'IDRX') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(formatted));
  }

  return `${new Intl.NumberFormat('en-US').format(Number(formatted))} ${currency}`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that KPI percentages sum to 100
 */
export function validateKPIPercentages(kpis: Array<{ percentage: number }>): boolean {
  const total = kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);
  return total === 100;
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate project data before contract call
 */
export function validateProjectData(data: {
  title: string;
  description: string;
  totalBudget: number;
  currency: string;
  roles: Array<{ kpis: Array<{ percentage: number }> }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Project title is required');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Project description is required');
  }

  if (data.totalBudget <= 0) {
    errors.push('Total budget must be greater than 0');
  }

  if (!['IDRX', 'USDC', 'USDT', 'ETH'].includes(data.currency.toUpperCase())) {
    errors.push('Invalid currency. Must be IDRX, USDC, USDT, or ETH');
  }

  if (data.roles.length === 0) {
    errors.push('Project must have at least one role');
  }

  for (let i = 0; i < data.roles.length; i++) {
    const role = data.roles[i];
    if (!validateKPIPercentages(role.kpis)) {
      errors.push(`Role ${i + 1} KPIs must sum to 100%`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Gas Estimation Utilities
// ============================================================================

/**
 * Estimate gas for a transaction (mock implementation)
 */
export async function estimateGas(
  functionName: string,
  args: unknown[]
): Promise<bigint> {
  // Mock gas estimation
  const baseGas = BigInt(100000);

  switch (functionName) {
    case 'createProject':
      return baseGas + BigInt(args.length * 50000);
    case 'depositKPI':
      return baseGas + BigInt(50000);
    case 'approveKPI':
      return baseGas + BigInt(30000);
    case 'withdraw':
      return baseGas + BigInt(40000);
    case 'assignFreelancer':
      return baseGas + BigInt(35000);
    default:
      return baseGas;
  }
}

// ============================================================================
// Transaction Helpers
// ============================================================================

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(
  hash: Hash,
  confirmations: number = 1
): Promise<{ status: 'success' | 'reverted'; blockNumber: bigint }> {
  // In production, use actual transaction watching:
  // const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations });

  // Mock implementation
  return {
    status: 'success',
    blockNumber: BigInt(0),
  };
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(hash: Hash, chainId: number): string {
  if (chainId === 8453) {
    return `https://basescan.org/tx/${hash}`;
  }
  if (chainId === 84532) {
    return `https://sepolia.basescan.org/tx/${hash}`;
  }
  return '#';
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: Address, chainId: number): string {
  if (chainId === 8453) {
    return `https://basescan.org/address/${address}`;
  }
  if (chainId === 84532) {
    return `https://sepolia.basescan.org/address/${address}`;
  }
  return '#';
}
