# NovaLance Smart Contract Integration Document

> **For Smart Contract Developer** - Complete frontend integration points and requirements

---

## Quick Reference: FE Endpoint → SC Integration Map

| # | FE Route/Endpoint | File Location | SC Function Needed | Priority |
|---|-------------------|---------------|-------------------|----------|
| 1 | `POST /PO/create-project` | `app/PO/create-project/page.tsx:481` | `createProject()` | P0 |
| 2 | `POST /deposit-kpi` | `app/PO/projects/[id]/page.tsx:544` | `depositKPI()` | P0 |
| 3 | `POST /approve-kpi` | `app/PO/projects/[id]/page.tsx:492` | `approveKPI()` | P0 |
| 4 | `POST /assign-freelancer` | (missing FE, add to `/PO/projects/[id]`) | `assignFreelancer()` | P0 |
| 5 | `POST /submit-kpi` | (missing FE, add to FL workflow) | `submitKPICompletion()` | P0 |
| 6 | `POST /apply-job` | `app/FL/jobs/[id]/page.tsx:233` | `applyForJob()` | P1 |
| 7 | `GET /withdrawable-balance` | `app/FL/profile/page.tsx:138` | `getWithdrawableBalance()` | P0 |
| 8 | `POST /withdraw` | `app/FL/profile/page.tsx:153` | `withdraw()` | P0 |
| 9 | `GET /yield-info` | `app/PO/page.tsx:367` | `getYieldInfo()` | P0 |
| 10 | `POST /cancel-project` | (missing FE, add to `/PO/projects/[id]`) | `cancelProject()` | P1 |
| 11 | `GET /lp-status` | `app/PO/page.tsx:363` | `getLPStatus()` | P0 |
| 12 | `POST /fl-approve-kpi` | (missing FE, add to FL workflow) | `approveKPI()` (FL side) | P0 |

---

## Project Overview

**NovaLance** is a Web3 freelance marketplace on **Base blockchain** with:
- KPI-based escrow payments
- 10% LP allocation for yield generation
- Multi-sig approval (PO + FL)
- Yield distribution: 40% PO / 40% FL / 20% Platform

**Tech Stack**: Next.js 15, TypeScript, Wagmi v2, Viem, RainbowKit, Base mainnet & Sepolia

**Documentation Files**:
- `architecture.md` - Complete system architecture
- `Context/conceptLP-Integrate.md` - Financial flow & yield logic
- `Context/hackathon-req.md` - Hackathon requirements

---

## 1. Wallet Connection ✅ (Implemented)

**FE Location**: `components/web3/ConnectWallet.tsx`, `lib/wagmi.ts`

**Current Status**: RainbowKit implemented, configured for Base

**SC Requirements**:
- Support Base mainnet & Sepolia testnet
- Multi-wallet support (already handled by RainbowKit)

---

## 2. Create Project & KPI Setup

**FE Route**: `/PO/create-project`
**File**: `app/PO/create-project/page.tsx`
**UI Trigger**: "Create Project" button (line 481)

**Current Form Data**:
```typescript
{
  title: string;
  description: string;
  currency: 'IDRX' | 'USDC' | 'USDT' | 'ETH';
  startDate: string;
  endDate: string;
  features: string[];
  roles: Array<{
    title: string;
    description: string;
    budget: number;
    currency: string;
    skills: string[];
    kpis: Array<{
      name: string;
      percentage: number;  // Must sum to 100 per role
      description: string;
      deadline: string;
    }>;
  }>;
  totalBudget: number;
}
```

**SC Function Signature**:
```solidity
function createProject(
    bytes32 projectId,
    bytes metadataHash,  // IPFS hash of project metadata
    address projectOwner,
    uint256 totalBudget,
    address paymentToken
) external returns (uint256)
```

**Event to Emit**:
```solidity
event ProjectCreated(
    bytes32 indexed projectId,
    address indexed poAddress,
    bytes metadataHash,
    uint256 totalBudget,
    address paymentToken,
    uint256 timestamp
);
```

**FE Integration Point**:
```typescript
// In handleSubmit() at line 446
const projectId = keccak256(abi.encode([title, creatorAddress, timestamp]));
const metadataHash = await uploadToIPFS(projectData);
// TODO: Call SC createProject(projectId, metadataHash, totalBudget)
```

---

## 3. KPI Deposit (PO → Escrow + LP)

**FE Route**: `/PO/projects/[id]`
**File**: `app/PO/projects/[id]/page.tsx`
**UI Trigger**: "Deposit to Escrow" button (line 544)
**Modal**: Deposit modal (lines 579-598)

**Current UI Data**:
```typescript
{
  projectId: string;
  totalBudget: number;
  currency: string;
  roles: Array<{
    budget: number;
    kpis: KPI[];
  }>;
}
```

**SC Function Signature**:
```solidity
function depositKPI(
    bytes32 projectId,
    bytes32 kpiId,
    uint256 amount
) external
```

**Logic Required**:
1. Transfer tokens from PO to contract
2. Split automatically:
   - 90% → Vault (escrow)
   - 10% → LP allocation
3. Route LP to DeFi protocol (Aave/Nusa Finance/Morpho)
4. Optional: Filter by APY ≥ 5%

**Event to Emit**:
```solidity
event KPIDeposited(
    bytes32 indexed projectId,
    bytes32 indexed kpiId,
    address indexed poAddress,
    uint256 amount,
    uint256 vaultAmount,      // 90%
    uint256 lpAmount,         // 10%
    uint256 lpProtocolIndex,  // 0=Aave, 1=Nusa, 2=Morpho
    uint256 timestamp
);
```

**FE Integration Point**:
```typescript
// In handleDeposit() at line 43
// TODO: Call SC depositKPI(projectId, kpiId, amount)
// TODO: Show transaction progress
// TODO: Update KPI status to "funded" after confirmation
```

---

## 4. Freelancer Assignment

**FE Route**: `/PO/projects/[id]/applications` (route exists, file missing)
**UI Status**: ❌ Missing - Needs to be added

**Needed FE Implementation**:
1. Create `app/PO/projects/[id]/applications/page.tsx`
2. Show list of applicants for each role
3. "Accept Application" button that triggers SC call

**SC Function Signature**:
```solidity
function assignFreelancer(
    bytes32 projectId,
    bytes32 roleId,
    address freelancer
) external
```

**Validation**:
- Only PO can call
- Role must be in "hiring" status
- Freelancer not already assigned

**Event to Emit**:
```solidity
event FreelancerAssigned(
    bytes32 indexed projectId,
    bytes32 indexed roleId,
    address indexed freelancer,
    uint256 timestamp
);
```

**FE Integration Point** (to be added):
```typescript
// In new applications page
const handleAcceptApplicant = async (applicantAddress: string, roleId: string) => {
  // TODO: Call SC assignFreelancer(projectId, roleId, applicantAddress)
  // TODO: Update role status to "in-progress"
  router.push(`/PO/projects/${projectId}`);
};
```

---

## 5. KPI Completion Submission (FL)

**FE Route**: `/FL/projects/[id]` (or `/FL/active-jobs/[id]`)
**UI Status**: ❌ Missing - Needs to be added

**Needed FE Implementation**:
1. Create FL active job detail page
2. Show assigned KPIs with "Mark Complete" button
3. Form to submit deliverables (links, descriptions)

**SC Function Signature**:
```solidity
function submitKPICompletion(
    bytes32 projectId,
    bytes32 kpiId,
    bytes deliverablesHash  // IPFS hash
) external
```

**Validation**:
- Only assigned FL can submit
- KPI must be in "in-progress" status

**Event to Emit**:
```solidity
event KPISubmitted(
    bytes32 indexed projectId,
    bytes32 indexed kpiId,
    address indexed flAddress,
    bytes deliverablesHash,
    uint256 timestamp
);
```

**State Change**: KPI status → "pending_approval"

**FE Integration Point** (to be added):
```typescript
// In new FL active job page
const handleSubmitKPI = async (kpiId: string, deliverables: any) => {
  const deliverablesHash = await uploadToIPFS(deliverables);
  // TODO: Call SC submitKPICompletion(projectId, kpiId, deliverablesHash)
  // TODO: Update KPI status to "pending_approval"
};
```

---

## 6. KPI Approval (Multi-Signature - PO Side)

**FE Route**: `/PO/projects/[id]`
**File**: `app/PO/projects/[id]/page.tsx`
**UI Trigger**: "Approve" button on completed KPIs (line 492)
**Modal**: Approve KPI modal (lines 601-621)

**Current UI State**:
- Button only shows when `kpi.status === 'completed'`
- Confirmation modal shows warning

**SC Function Signature**:
```solidity
function approveKPI(
    bytes32 projectId,
    bytes32 kpiId,
    bool poApproval  // true for PO, false for FL
) external
```

**Logic Required**:
1. Store separate approvals: `poApproved` and `flApproved`
2. When BOTH are true → trigger yield distribution
3. Calculate yield from LP position
4. Distribute based on profit/loss:
   - **Profit**: 40% PO / 40% FL / 20% Platform
   - **Loss**: FL bears loss, PO gets principal back
5. Update withdrawable balances

**Event to Emit**:
```solidity
event KPIApproved(
    bytes32 indexed projectId,
    bytes32 indexed kpiId,
    uint256 lpInitialValue,
    uint256 lpFinalValue,
    int256 yieldProfit,  // Can be negative
    uint256 poShare,
    uint256 flShare,
    uint256 platformShare,
    uint256 timestamp
);
```

**FE Integration Point**:
```typescript
// In handleApproveKPI() at line 48
// TODO: Call SC approveKPI(projectId, kpiId, true)  // true = PO approval
// TODO: Check if both approvals received
// TODO: Show yield distribution if approved
```

---

## 7. KPI Approval (Multi-Signature - FL Side)

**FE Route**: `/FL/active-jobs/[id]` (needs to be created)
**UI Status**: ❌ Missing - Needs to be added

**Needed FE Implementation**:
1. Show KPIs in "pending_approval" status
2. "Confirm Completion" button for FL to approve
3. Show yield breakdown after both approvals

**SC Function**: Same as PO (section 6), but `poApproval = false`

**FE Integration Point** (to be added):
```typescript
// In new FL active job page
const handleConfirmKPI = async (kpiId: string) => {
  // TODO: Call SC approveKPI(projectId, kpiId, false)  // false = FL approval
  // TODO: Show success message
  // TODO: Display yield distribution
};
```

---

## 8. Yield Calculation & Distribution

**FE Route**: `/PO` (dashboard)
**File**: `app/PO/page.tsx`
**UI Display**: "Yield Performance" card (lines 328-550)

**Current Mock Data** (lines 24-28, 102-108):
```typescript
// Mock yield rates (-5% to 15%)
const mockYieldRates: { [key: string]: number } = {
  'kpi-3-1': 11.44,   // Profit
  'kpi-4-1': -2.35,   // Loss
  'kpi-4-2': 8.72,    // Profit
};
```

**SC Read Function**:
```solidity
function getYieldInfo(bytes32 kpiId) external view returns (
    uint256 lpInitialValue,
    uint256 lpCurrentValue,
    int256 yieldProfit,      // Can be negative
    uint256 yieldPercentage, // Basis points (100 = 1%)
    bool isDistributed,
    uint256 poShare,
    uint256 flShare,
    uint256 platformShare
)
```

**Distribution Logic** (internal function):
```solidity
function _distributeYield(bytes32 kpiId) internal {
    // 1. Fetch current LP value from DeFi protocol
    uint256 currentLPValue = _getLPValue(kpiId);

    // 2. Calculate profit/loss
    int256 profit = int256(currentLPValue) - int256(initialLPValue);

    // 3. Calculate shares
    if (profit > 0) {
        // Profit scenario: 40/40/20 split
        uint256 poShare = uint256(profit) * 40 / 100;
        uint256 flShare = uint256(profit) * 40 / 100;
        uint256 platformShare = uint256(profit) * 20 / 100;

        // 4. Update withdrawable balances
        withdrawableBalances[po] += poShare;
        withdrawableBalances[fl] += flShare;
        withdrawableBalances[platform] += platformShare;
    } else {
        // Loss scenario: FL bears loss
        uint256 flDeduction = uint256(-profit);
        // Deduct from FL's escrow portion
        withdrawableBalances[fl] -= flDeduction;
        // PO gets full principal back (no loss)
    }
}
```

**FE Integration Point**:
```typescript
// In dashboard, replace mock data with SC calls
const fetchYieldData = async (kpiId: string) => {
  // TODO: Call SC getYieldInfo(kpiId)
  // TODO: Update UI with real yield data
  // TODO: Implement live updates (polling or WebSocket)
};
```

---

## 9. Withdrawable Balance Query

**FE Route**: `/FL/profile`
**File**: `app/FL/profile/page.tsx`
**UI Display**: "Available to Withdraw" (line 138)

**Current Mock Display**:
```typescript
<p className="text-3xl font-bold text-slate-900">${totalEarnings}</p>
```

**SC Read Function**:
```solidity
function getWithdrawableBalance(address user) external view returns (
    uint256 totalWithdrawable,
    uint256 escrowAmount,
    uint256 yieldAmount,
    uint256 projectCount
)
```

**Breakdown Option** (per project):
```solidity
function getWithdrawableByProject(address user, bytes32 projectId)
    external view returns (
        uint256 total,
        uint256 escrow,
        uint256 yield
)
```

**FE Integration Point**:
```typescript
// In FL profile page
const [withdrawableBalance, setWithdrawableBalance] = useState(0);

useEffect(() => {
  const fetchBalance = async () => {
    // TODO: Call SC getWithdrawableBalance(userAddress)
    // TODO: Update state with real balance
  };
  fetchBalance();
}, [userAddress]);
```

---

## 10. Withdrawal (FL & PO)

**FE Route**: `/FL/profile`
**File**: `app/FL/profile/page.tsx`
**UI Trigger**: "Withdraw to Wallet" button (line 153)

**Current UI**:
```typescript
{totalEarnings > 0 ? (
  <Button variant="success" className="w-full">
    Withdraw to Wallet
  </Button>
) : (
  <Button variant="outline" className="w-full" disabled>
    No Earnings to Withdraw
  </Button>
)}
```

**SC Function Signature**:
```solidity
function withdraw(uint256 amount) external
```

**Logic Required**:
1. Check user has sufficient withdrawable balance
2. Deduct from user's balance
3. Transfer tokens to user's wallet
4. Emit event for indexing

**Event to Emit**:
```solidity
event Withdrawal(
    address indexed user,
    uint256 amount,
    uint256 escrowPortion,
    uint256 yieldPortion,
    uint256 timestamp
);
```

**FE Integration Point**:
```typescript
// In FL profile page, add click handler
const handleWithdraw = async () => {
  // TODO: Call SC withdraw(withdrawableBalance)
  // TODO: Show transaction progress
  // TODO: Update balance after confirmation
  // TODO: Show success message
};
```

---

## 11. Project Cancellation

**FE Route**: `/PO/projects/[id]`
**UI Status**: ❌ Missing - Needs to be added

**Needed FE Implementation**:
1. Add "Cancel Project" button to project detail page
2. Show cancellation breakdown modal
3. Confirm cancellation

**SC Function Signature**:
```solidity
function cancelProject(
    bytes32 projectId,
    string reason
) external
```

**Cancellation Logic**:

**Scenario A: Before any KPI completion**
```
- 90% Vault → Refund to PO
- 10% LP → Platform keeps
```

**Scenario B: After some KPIs completed**
```
- Completed KPI escrow → FL
- Remaining vault → PO
- LP portion → Platform
```

**Event to Emit**:
```solidity
event ProjectCancelled(
    bytes32 indexed projectId,
    address indexed poAddress,
    uint256 completedKPIs,
    uint256 poRefund,
    uint256 flPayout,
    uint256 platformFee,
    string reason,
    uint256 timestamp
);
```

**FE Integration Point** (to be added):
```typescript
// In project detail page, add cancel button
const handleCancelProject = async () => {
  // TODO: Show cancellation breakdown modal
  // TODO: Call SC cancelProject(projectId, reason)
  // TODO: Update project status to "cancelled"
  // TODO: Redirect to projects list
};
```

---

## 12. LP Protocol Integration

**FE Display**: `/PO` dashboard (line 363) - Shows "LP (10%)" amount

**Supported Protocols**:
- Aave (index 0)
- Nusa Finance (index 1)
- Morpho (index 2)

**SC Functions**:
```solidity
// Allocate LP to protocol
function allocateLP(
    bytes32 kpiId,
    uint256 protocolIndex  // 0, 1, or 2
) external

// Withdraw from LP (when needed)
function withdrawLP(
    bytes32 kpiId,
    uint256 protocolIndex,
    uint256 amount
) external

// Get current LP value
function getLPValue(bytes32 kpiId) external view returns (uint256)

// Get all LP positions
function getAllLPPositions(bytes32 projectId)
    external view returns (LPPosition[] memory)
```

**LP Position Struct**:
```solidity
struct LPPosition {
    uint256 protocolIndex;
    uint256 initialAmount;
    uint256 currentValue;
    uint256 yield;
    bool isActive;
}
```

**Optional: APY Filter** (for PO configuration):
```solidity
function setMinAPY(uint256 minAPY) external  // e.g., 500 = 5%

function allocateLPWithFilter(bytes32 kpiId) internal {
    // Check each protocol's APY
    for (uint i = 0; i < protocols.length; i++) {
        uint256 apy = protocols[i].getAPY();
        if (apy >= minAPY) {
            allocateLP(kpiId, i);
            break;
        }
    }
}
```

**FE Integration Point**:
```typescript
// Dashboard LP status display
const fetchLPStatus = async (projectId: string) => {
  // TODO: Call SC getAllLPPositions(projectId)
  // TODO: Display total LP amount and current value
  // TODO: Show allocation per protocol
};
```

---

## 13. Job Application

**FE Route**: `/FL/jobs/[id]`
**File**: `app/FL/jobs/[id]/page.tsx`
**UI Trigger**: "Submit Application" button (line 233)
**Modal**: Apply modal (lines 204-238)

**Current Form Data**:
```typescript
{
  coverLetter: string;  // Required
  // Profile info auto-shared
}
```

**SC Function Signature**:
```solidity
function applyForJob(
    bytes32 jobId,
    bytes32 roleId,
    bytes coverLetterHash  // IPFS hash
) external
```

**Optional: Application Staking** (if required):
```solidity
function applyForJobWithStake(
    bytes32 jobId,
    bytes32 roleId,
    bytes coverLetterHash,
    uint256 stakeAmount  // Refundable if not accepted
) external
```

**Event to Emit**:
```solidity
event JobApplicationSubmitted(
    bytes32 indexed jobId,
    bytes32 indexed roleId,
    address indexed freelancer,
    bytes coverLetterHash,
    uint256 timestamp
);
```

**FE Integration Point**:
```typescript
// In handleApply() at line 41
const coverLetterHash = await uploadToIPFS({ coverLetter, profile: mockUser });
// TODO: Call SC applyForJob(jobId, roleId, coverLetterHash)
// TODO: Navigate to applications page
```

---

## 14. Read Functions (View-Only)

**FE Locations**: Multiple pages display project/job data

**SC Read Functions Needed**:

```solidity
// Get full project details
function getProject(bytes32 projectId) external view returns (
    address po,
    string memory title,
    bytes metadataHash,
    uint256 totalBudget,
    ProjectStatus status,
    uint256 createdAt
)

// Get role details
function getRole(bytes32 projectId, bytes32 roleId) external view returns (
    string memory title,
    uint256 budget,
    address assignedFreelancer,
    RoleStatus status,
    uint256 kpiCount
)

// Get KPI details
function getKPI(bytes32 projectId, bytes32 kpiId) external view returns (
    string memory name,
    uint256 percentage,
    uint256 deadline,
    KPIStatus status,
    bool poApproved,
    bool flApproved,
    uint256 depositedAmount,
    int256 yield
)

// Get user's projects (PO or FL)
function getUserProjects(address user, bool asPO) external view returns (
    bytes32[] memory projectIds
)

// Get applications for a role
function getRoleApplications(bytes32 roleId) external view returns (
    address[] memory applicants
)
```

**Enums**:
```solidity
enum ProjectStatus { Hiring, InProgress, Completed, Cancelled }
enum RoleStatus { Hiring, Assigned, Completed, Cancelled }
enum KPIStatus { Pending, InProgress, Completed, Approved, Rejected }
```

---

## 15. Events for Backend Indexing

**All events to emit for BE indexing**:

```solidity
// Project lifecycle
event ProjectCreated(bytes32 indexed projectId, address indexed po, bytes metadataHash, uint256 totalBudget, uint256 timestamp);
event ProjectCancelled(bytes32 indexed projectId, address indexed po, uint256 poRefund, uint256 flPayout, uint256 platformFee, uint256 timestamp);

// Freelancer assignment
event FreelancerAssigned(bytes32 indexed projectId, bytes32 indexed roleId, address indexed freelancer, uint256 timestamp);

// Deposit & LP
event KPIDeposited(bytes32 indexed projectId, bytes32 indexed kpiId, address indexed po, uint256 amount, uint256 vaultAmount, uint256 lpAmount, uint256 protocolIndex, uint256 timestamp);
event LPAllocated(bytes32 indexed kpiId, uint256 protocolIndex, uint256 amount, uint256 timestamp);
event LPWithdrawn(bytes32 indexed kpiId, uint256 protocolIndex, uint256 amount, uint256 timestamp);

// KPI workflow
event KPISubmitted(bytes32 indexed projectId, bytes32 indexed kpiId, address indexed fl, bytes deliverablesHash, uint256 timestamp);
event KPIApproved(bytes32 indexed projectId, bytes32 indexed kpiId, uint256 lpInitial, uint256 lpFinal, int256 yield, uint256 poShare, uint256 flShare, uint256 platformShare, uint256 timestamp);

// Withdrawals
event Withdrawal(address indexed user, uint256 amount, uint256 escrowPortion, uint256 yieldPortion, uint256 timestamp);

// Applications
event JobApplicationSubmitted(bytes32 indexed jobId, bytes32 indexed roleId, address indexed freelancer, bytes coverLetterHash, uint256 timestamp);
```

**Backend Use Cases**:
- Sync on-chain state with database
- Real-time UI updates via WebSocket
- Transaction history display
- Analytics & reporting
- Notification triggers

---

## 16. Token Integration (IDRX)

**FE Reference**: Currency selector in create project (line 556-565)

**Options**: IDRX, USDC, USDT, ETH

**SC Requirements**:

**Option A: Use existing tokens (simpler)**
```solidity
interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

// In contract
IERC20 public immutable paymentToken;
```

**Option B: Deploy mock IDRX for hackathon**
```solidity
contract MockIDRX is IERC20 {
    string public constant name = "IDRX";
    string public constant symbol = "IDRX";
    uint8 public constant decimals = 18;
    // ... standard ERC20 implementation
}
```

**FE Integration**:
```typescript
// Get token contract address based on selected currency
const tokenAddresses = {
  IDRX: '0x...',  // Mock or real
  USDC: '0x...833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base
  USDT: '0x...',
  ETH: address(0)  // Native
};
```

---

## Missing Frontend Features (To Be Added)

### High Priority

| Feature | FE Location | SC Function | Status |
|---------|-------------|-------------|--------|
| Freelancer Assignment UI | `/PO/projects/[id]/applications` | `assignFreelancer()` | ❌ Missing |
| KPI Completion Submit UI | `/FL/active-jobs/[id]` | `submitKPICompletion()` | ❌ Missing |
| FL KPI Approval UI | `/FL/active-jobs/[id]` | `approveKPI()` (FL side) | ❌ Missing |
| Project Cancellation UI | `/PO/projects/[id]` | `cancelProject()` | ❌ Missing |
| PO Yield/Withdraw UI | `/PO/profile` | `getWithdrawableBalance()`, `withdraw()` | ❌ Missing |

### Medium Priority

| Feature | FE Location | SC Function | Status |
|---------|-------------|-------------|--------|
| Application List | `/PO/projects/[id]/applications` | View function | ❌ Missing |
| FL Active Jobs List | `/FL/active-jobs` | View function | ❌ Missing |
| Transaction History | `/FL/profile`, `/PO/profile` | Event indexing | ❌ Missing |
| Real-time Yield Updates | `/PO` dashboard | `getYieldInfo()` | ⚠️ Mock only |

---

## Data Structures

### Project (on-chain reference only)
```solidity
struct Project {
    bytes32 id;
    address po;
    bytes metadataHash;  // IPFS hash of full project data
    uint256 totalBudget;
    address paymentToken;
    ProjectStatus status;
    uint256 createdAt;
    mapping(bytes32 => Role) roles;
}
```

### Role
```solidity
struct Role {
    bytes32 id;
    bytes32 projectId;
    string title;  // Stored off-chain, hash in metadata
    uint256 budget;
    address assignedFreelancer;
    RoleStatus status;
    mapping(bytes32 => KPI) kpis;
}
```

### KPI
```solidity
struct KPI {
    bytes32 id;
    bytes32 roleId;
    string name;  // Stored off-chain, hash in metadata
    uint256 percentage;  // Of role budget
    uint256 deadline;
    uint256 depositedAmount;
    uint256 lpAmount;
    KPIStatus status;
    bool poApproved;
    bool flApproved;
    int256 yield;  // Can be negative
}
```

### LP Position
```solidity
struct LPPosition {
    bytes32 kpiId;
    uint256 protocolIndex;
    uint256 initialAmount;
    uint256 currentValue;
    int256 yield;
    bool isActive;
}
```

---

## Key Smart Contract Functions Summary

### Core Functions
```solidity
// Project Management
function createProject(bytes32 projectId, bytes metadataHash, address paymentToken) external
function cancelProject(bytes32 projectId, string reason) external

// Deposit & Allocation
function depositKPI(bytes32 projectId, bytes32 kpiId, uint256 amount) external
function allocateLP(bytes32 kpiId, uint256 protocolIndex) external

// Assignment & Submission
function assignFreelancer(bytes32 projectId, bytes32 roleId, address freelancer) external
function submitKPICompletion(bytes32 projectId, bytes32 kpiId, bytes deliverablesHash) external

// Approval & Distribution
function approveKPI(bytes32 projectId, bytes32 kpiId, bool poApproval) external
function _distributeYield(bytes32 kpiId) internal

// Withdrawals
function getWithdrawableBalance(address user) external view returns (uint256, uint256, uint256)
function withdraw(uint256 amount) external
```

### View/Read Functions
```solidity
function getProject(bytes32 projectId) external view returns (Project memory)
function getRole(bytes32 projectId, bytes32 roleId) external view returns (Role memory)
function getKPI(bytes32 projectId, bytes32 kpiId) external view returns (KPI memory)
function getYieldInfo(bytes32 kpiId) external view returns (YieldInfo memory)
function getLPValue(bytes32 kpiId) external view returns (uint256)
function getUserProjects(address user, bool asPO) external view returns (bytes32[] memory)
```

---

## Gas Optimization Recommendations (Optional)

1. **Batch Operations**: Allow approving multiple KPIs in one transaction
2. **Meta-transactions**: Enable gasless transactions for better UX
3. **State Packing**: Optimize struct storage to reduce gas
4. **Event Indexing**: Use `indexed` parameters for efficient filtering

---

## Testing Checklist

- [ ] Create project with multiple roles and KPIs
- [ ] Deposit funds to KPI escrow (90/10 split)
- [ ] Allocate LP to DeFi protocol
- [ ] Assign freelancer to role
- [ ] Submit KPI completion as FL
- [ ] Approve KPI as PO
- [ ] Approve KPI as FL
- [ ] Verify yield calculation (profit scenario)
- [ ] Verify yield calculation (loss scenario)
- [ ] Withdraw funds as FL
- [ ] Withdraw yield as PO
- [ ] Cancel project before KPI completion
- [ ] Cancel project after KPI completion
- [ ] Test with different tokens (IDRX, USDC, ETH)

---

## File Locations Summary

**Wallet Connection**:
- `components/web3/ConnectWallet.tsx`
- `lib/wagmi.ts`

**PO Pages**:
- `app/PO/page.tsx` - Dashboard with KPI progress & yield
- `app/PO/create-project/page.tsx` - Create project form
- `app/PO/projects/page.tsx` - Projects list
- `app/PO/projects/[id]/page.tsx` - Project detail + deposit + approve
- `app/PO/profile/page.tsx` - Profile (needs withdraw UI)

**FL Pages**:
- `app/FL/page.tsx` - Dashboard
- `app/FL/jobs/page.tsx` - Browse jobs
- `app/FL/jobs/[id]/page.tsx` - Job detail + apply
- `app/FL/applications/page.tsx` - Track applications
- `app/FL/profile/page.tsx` - Profile + withdraw UI

**Components**:
- `components/ui/Card.tsx`
- `components/ui/Button.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Badge.tsx`

**Documentation**:
- `architecture.md` - Complete architecture
- `Context/conceptLP-Integrate.md` - Financial flow
- `Context/hackathon-req.md` - Requirements

---

## Next Steps for Smart Contract Developer

1. **Review Architecture**: Read `architecture.md` for complete flow diagrams
2. **Understand Yield Logic**: Read `Context/conceptLP-Integrate.md` for financial rules
3. **Implement Core Functions**: Start with `createProject`, `depositKPI`, `approveKPI`
4. **Implement LP Integration**: Connect to Aave/Nusa Finance/Morpho
5. **Test Locally**: Use Base Sepolia for testing
6. **Provide ABI**: Share contract ABI with FE team
7. **Deploy**: Deploy to Base Sepolia (testnet) then Base mainnet
