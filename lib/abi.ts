/**
 * NovaLance Smart Contract ABI
 *
 * This file contains the complete ABI for the NovaLance smart contract.
 * It includes all functions, events, and errors needed for frontend integration.
 */

import type { Abi } from 'viem';

// ============================================================================
// NovaLance Contract ABI
// ============================================================================

export const NOVALANCE_ABI = [
  // Enums
  {
    type: 'enum',
    name: 'ProjectStatus',
    inputs: [
      { name: 'Draft', type: 'uint8' },
      { name: 'Hiring', type: 'uint8' },
      { name: 'InProgress', type: 'uint8' },
      { name: 'Completed', type: 'uint8' },
      { name: 'Cancelled', type: 'uint8' },
    ],
  },
  {
    type: 'enum',
    name: 'RoleStatus',
    inputs: [
      { name: 'Hiring', type: 'uint8' },
      { name: 'Assigned', type: 'uint8' },
      { name: 'Completed', type: 'uint8' },
      { name: 'Cancelled', type: 'uint8' },
    ],
  },
  {
    type: 'enum',
    name: 'KPIStatus',
    inputs: [
      { name: 'Pending', type: 'uint8' },
      { name: 'InProgress', type: 'uint8' },
      { name: 'Completed', type: 'uint8' },
      { name: 'Approved', type: 'uint8' },
      { name: 'Rejected', type: 'uint8' },
    ],
  },
  {
    type: 'enum',
    name: 'LPProtocol',
    inputs: [
      { name: 'Aave', type: 'uint8' },
      { name: 'NusaFinance', type: 'uint8' },
      { name: 'Morpho', type: 'uint8' },
    ],
  },

  // Structs
  {
    type: 'struct',
    name: 'Project',
    properties: [
      { name: 'id', type: 'bytes32' },
      { name: 'po', type: 'address' },
      { name: 'metadataHash', type: 'bytes' },
      { name: 'totalBudget', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'status', type: 'ProjectStatus' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  {
    type: 'struct',
    name: 'Role',
    properties: [
      { name: 'id', type: 'bytes32' },
      { name: 'projectId', type: 'bytes32' },
      { name: 'budget', type: 'uint256' },
      { name: 'assignedFreelancer', type: 'address' },
      { name: 'status', type: 'RoleStatus' },
      { name: 'kpiCount', type: 'uint256' },
    ],
  },
  {
    type: 'struct',
    name: 'KPI',
    properties: [
      { name: 'id', type: 'bytes32' },
      { name: 'roleId', type: 'bytes32' },
      { name: 'percentage', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'depositedAmount', type: 'uint256' },
      { name: 'lpAmount', type: 'uint256' },
      { name: 'status', type: 'KPIStatus' },
      { name: 'poApproved', type: 'bool' },
      { name: 'flApproved', type: 'bool' },
      { name: 'yield', type: 'int256' },
    ],
  },
  {
    type: 'struct',
    name: 'LPPosition',
    properties: [
      { name: 'kpiId', type: 'bytes32' },
      { name: 'protocolIndex', type: 'uint256' },
      { name: 'initialAmount', type: 'uint256' },
      { name: 'currentValue', type: 'uint256' },
      { name: 'yield', type: 'int256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    type: 'struct',
    name: 'YieldInfo',
    properties: [
      { name: 'lpInitialValue', type: 'uint256' },
      { name: 'lpCurrentValue', type: 'uint256' },
      { name: 'yieldProfit', type: 'int256' },
      { name: 'yieldPercentage', type: 'uint256' },
      { name: 'isDistributed', type: 'bool' },
      { name: 'poShare', type: 'uint256' },
      { name: 'flShare', type: 'uint256' },
      { name: 'platformShare', type: 'uint256' },
    ],
  },
  {
    type: 'struct',
    name: 'WithdrawableBalance',
    properties: [
      { name: 'totalWithdrawable', type: 'uint256' },
      { name: 'escrowAmount', type: 'uint256' },
      { name: 'yieldAmount', type: 'uint256' },
      { name: 'projectCount', type: 'uint256' },
    ],
  },

  // Write Functions
  {
    name: 'createProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'metadataHash', type: 'bytes' },
      { name: 'totalBudget', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'depositKPI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'kpiId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'assignFreelancer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'roleId', type: 'bytes32' },
      { name: 'freelancer', type: 'address' },
    ],
  },
  {
    name: 'submitKPICompletion',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'kpiId', type: 'bytes32' },
      { name: 'deliverablesHash', type: 'bytes' },
    ],
  },
  {
    name: 'approveKPI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'kpiId', type: 'bytes32' },
      { name: 'poApproval', type: 'bool' },
    ],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'applyForJob',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'roleId', type: 'bytes32' },
      { name: 'coverLetterHash', type: 'bytes' },
    ],
  },
  {
    name: 'cancelProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'reason', type: 'string' },
    ],
  },
  {
    name: 'allocateLP',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'kpiId', type: 'bytes32' },
      { name: 'protocolIndex', type: 'uint256' },
    ],
  },
  {
    name: 'withdrawLP',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'kpiId', type: 'bytes32' },
      { name: 'protocolIndex', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
  },

  // View/Read Functions
  {
    name: 'getProject',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'po', type: 'address' },
          { name: 'metadataHash', type: 'bytes' },
          { name: 'totalBudget', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getRole',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'roleId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'projectId', type: 'bytes32' },
          { name: 'budget', type: 'uint256' },
          { name: 'assignedFreelancer', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'kpiCount', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getKPI',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'kpiId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'roleId', type: 'bytes32' },
          { name: 'percentage', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'depositedAmount', type: 'uint256' },
          { name: 'lpAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'poApproved', type: 'bool' },
          { name: 'flApproved', type: 'bool' },
          { name: 'yield', type: 'int256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getYieldInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'kpiId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'lpInitialValue', type: 'uint256' },
          { name: 'lpCurrentValue', type: 'uint256' },
          { name: 'yieldProfit', type: 'int256' },
          { name: 'yieldPercentage', type: 'uint256' },
          { name: 'isDistributed', type: 'bool' },
          { name: 'poShare', type: 'uint256' },
          { name: 'flShare', type: 'uint256' },
          { name: 'platformShare', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getLPValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'kpiId', type: 'bytes32' },
    ],
    outputs: [
      { name: '', type: 'uint256' },
    ],
  },
  {
    name: 'getWithdrawableBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
    ],
    outputs: [
      {
        components: [
          { name: 'totalWithdrawable', type: 'uint256' },
          { name: 'escrowAmount', type: 'uint256' },
          { name: 'yieldAmount', type: 'uint256' },
          { name: 'projectCount', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getWithdrawableByProject',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'projectId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'total', type: 'uint256' },
          { name: 'escrow', type: 'uint256' },
          { name: 'yield', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getUserProjects',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'asPO', type: 'bool' },
    ],
    outputs: [
      { name: '', type: 'bytes32[]' },
    ],
  },
  {
    name: 'getRoleApplications',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roleId', type: 'bytes32' },
    ],
    outputs: [
      { name: '', type: 'address[]' },
    ],
  },
  {
    name: 'getAllLPPositions',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
    ],
    outputs: [
      {
        components: [
          { name: 'kpiId', type: 'bytes32' },
          { name: 'protocolIndex', type: 'uint256' },
          { name: 'initialAmount', type: 'uint256' },
          { name: 'currentValue', type: 'uint256' },
          { name: 'yield', type: 'int256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
  },

  // Events
  {
    type: 'event',
    name: 'ProjectCreated',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'po', type: 'address', indexed: true },
      { name: 'metadataHash', type: 'bytes', indexed: false },
      { name: 'totalBudget', type: 'uint256', indexed: false },
      { name: 'paymentToken', type: 'address', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProjectCancelled',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'po', type: 'address', indexed: true },
      { name: 'completedKPIs', type: 'uint256', indexed: false },
      { name: 'poRefund', type: 'uint256', indexed: false },
      { name: 'flPayout', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FreelancerAssigned',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'roleId', type: 'bytes32', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'KPIDeposited',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'kpiId', type: 'bytes32', indexed: true },
      { name: 'po', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'vaultAmount', type: 'uint256', indexed: false },
      { name: 'lpAmount', type: 'uint256', indexed: false },
      { name: 'protocolIndex', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'LPAllocated',
    inputs: [
      { name: 'kpiId', type: 'bytes32', indexed: true },
      { name: 'protocolIndex', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'LPWithdrawn',
    inputs: [
      { name: 'kpiId', type: 'bytes32', indexed: true },
      { name: 'protocolIndex', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'KPISubmitted',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'kpiId', type: 'bytes32', indexed: true },
      { name: 'fl', type: 'address', indexed: true },
      { name: 'deliverablesHash', type: 'bytes', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'KPIApproved',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'kpiId', type: 'bytes32', indexed: true },
      { name: 'lpInitial', type: 'uint256', indexed: false },
      { name: 'lpFinal', type: 'uint256', indexed: false },
      { name: 'yield', type: 'int256', indexed: false },
      { name: 'poShare', type: 'uint256', indexed: false },
      { name: 'flShare', type: 'uint256', indexed: false },
      { name: 'platformShare', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Withdrawal',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'escrowPortion', type: 'uint256', indexed: false },
      { name: 'yieldPortion', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobApplicationSubmitted',
    inputs: [
      { name: 'projectId', type: 'bytes32', indexed: true },
      { name: 'roleId', type: 'bytes32', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'coverLetterHash', type: 'bytes', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },

  // Errors
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidProject',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidKPI',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAllowance',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidStatus',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AlreadyAssigned',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
] as const;

// ============================================================================
// ERC20 ABI (for token approvals and transfers)
// ============================================================================

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============================================================================
// Type Exports
// ============================================================================

export type NovaLanceContract = {
  createProject: (args: {
    projectId: `0x${string}`;
    metadataHash: `0x${string}`;
    totalBudget: bigint;
    paymentToken: `0x${string}`;
  }) => Promise<`0x${string}`>;

  depositKPI: (args: {
    projectId: `0x${string}`;
    kpiId: `0x${string}`;
    amount: bigint;
  }) => Promise<`0x${string}`>;

  assignFreelancer: (args: {
    projectId: `0x${string}`;
    roleId: `0x${string}`;
    freelancer: `0x${string}`;
  }) => Promise<`0x${string}`>;

  submitKPICompletion: (args: {
    projectId: `0x${string}`;
    kpiId: `0x${string}`;
    deliverablesHash: `0x${string}`;
  }) => Promise<`0x${string}`>;

  approveKPI: (args: {
    projectId: `0x${string}`;
    kpiId: `0x${string}`;
    poApproval: boolean;
  }) => Promise<`0x${string}`>;

  withdraw: (args: {
    amount: bigint;
  }) => Promise<`0x${string}`>;

  applyForJob: (args: {
    projectId: `0x${string}`;
    roleId: `0x${string}`;
    coverLetterHash: `0x${string}`;
  }) => Promise<`0x${string}`>;

  cancelProject: (args: {
    projectId: `0x${string}`;
    reason: string;
  }) => Promise<`0x${string}`>;
};

export type ERC20Contract = {
  approve: (args: {
    spender: `0x${string}`;
    amount: bigint;
  }) => Promise<`0x${string}`>;

  allowance: (args: {
    owner: `0x${string}`;
    spender: `0x${string}`;
  }) => Promise<bigint>;

  balanceOf: (args: {
    account: `0x${string}`;
  }) => Promise<bigint>;
};
