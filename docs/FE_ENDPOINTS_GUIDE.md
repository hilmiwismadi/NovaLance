# NovaLance Frontend Integration Guide
## For Smart Contract Team - Page by Page Mapping

> **Quick Reference**: Navigate to any URL below to see the exact frontend location that needs smart contract integration.

---

## 🚀 Quick Start

1. Run the dev server: `npm run dev`
2. Navigate to any URL below
3. Look for `// TODO:` comments in the code
4. Each section shows the exact file location and button/element to integrate

---

## 📋 Complete Endpoint Mapping

### 1. Create Project
**URL**: `http://localhost:3000/PO/create-project`

**File**: `app/PO/create-project/page.tsx`

**What to Integrate**:
```
Line ~448: handleSubmit() function
Line ~933: "Create Project" button
```

**Smart Contract Function**:
```solidity
function createProject(
    bytes32 projectId,
    bytes metadataHash,
    uint256 totalBudget,
    address paymentToken
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useCreateProject()` hook
- Click "Create Project" button
- Fills form → Uploads to IPFS → Calls contract
- Shows transaction progress toast

---

### 2. Deposit KPI (Escrow + LP)
**URL**: `http://localhost:3000/PO/projects/1`

**File**: `app/PO/projects/[id]/page.tsx`

**What to Integrate**:
```
Line ~43: handleDeposit() function
Line ~544: "Deposit to Escrow" button
Line ~579: Deposit modal
```

**Smart Contract Function**:
```solidity
function depositKPI(
    bytes32 projectId,
    bytes32 kpiId,
    uint256 amount
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useDepositKPI()` hook
- Click "Deposit to Escrow" button in sidebar
- Shows 90/10 split breakdown (Vault/LP)
- Approves tokens → Calls contract

---

### 3. Approve KPI (PO Side)
**URL**: `http://localhost:3000/PO/projects/2`

**File**: `app/PO/projects/[id]/page.tsx`

**What to Integrate**:
```
Line ~48: handleApproveKPI() function
Line ~489: "Approve" button (appears when KPI status = 'completed')
Line ~601: Approve KPI modal
```

**Smart Contract Function**:
```solidity
function approveKPI(
    bytes32 projectId,
    bytes32 kpiId,
    bool poApproval  // true for PO
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useApproveKPI()` hook
- Expand role to see KPIs
- Click "Approve" button on completed KPIs
- Multi-sig: waits for FL approval too

---

### 4. Assign Freelancer
**URL**: `http://localhost:3000/PO/projects/1/applications`

**File**: `app/PO/projects/[id]/applications/page.tsx`

**What to Integrate**:
```
Line ~XXX: handleAcceptApplicant() function
Line ~XXX: "Accept Application" button on each applicant card
```

**Smart Contract Function**:
```solidity
function assignFreelancer(
    bytes32 projectId,
    bytes32 roleId,
    address freelancer
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useAssignFreelancer()` hook
- Shows all applicants for each hiring role
- Click "Accept Application"
- Calls contract to assign freelancer

---

### 5. Submit KPI Completion (FL)
**URL**: `http://localhost:3000/FL/active-jobs`

**File**: `app/FL/active-jobs/page.tsx`

**What to Integrate**:
```
Line ~XXX: handleSubmitKPI() function
Line ~XXX: "Submit Work" button (on in-progress KPIs)
Line ~XXX: Submit KPI modal with deliverables form
```

**Smart Contract Function**:
```solidity
function submitKPICompletion(
    bytes32 projectId,
    bytes32 kpiId,
    bytes deliverablesHash
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useSubmitKPI()` hook
- Shows all active jobs
- Click "Submit Work" on in-progress KPIs
- Enter deliverable links + description
- Uploads to IPFS → Calls contract

---

### 6. Approve KPI (FL Side)
**URL**: `http://localhost:3000/FL/active-jobs`

**File**: `app/FL/active-jobs/page.tsx`

**What to Integrate**:
```
Line ~XXX: handleConfirmKPI() function
Line ~XXX: "Confirm" button (on completed KPIs)
```

**Smart Contract Function**:
```solidity
function approveKPI(
    bytes32 projectId,
    bytes32 kpiId,
    bool poApproval  // false for FL
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useApproveKPI()` hook
- Shows KPIs with "Ready for Review" status
- Click "Confirm" button
- Multi-sig: completes when PO also approved

---

### 7. Apply for Job
**URL**: `http://localhost:3000/FL/jobs/1`

**File**: `app/FL/jobs/[id]/page.tsx`

**What to Integrate**:
```
Line ~41: handleApply() function
Line ~233: "Submit Application" button
Line ~204: Application modal
```

**Smart Contract Function**:
```solidity
function applyForJob(
    bytes32 projectId,
    bytes32 roleId,
    bytes coverLetterHash
) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useApplyForJob()` hook
- Browse to any job
- Click "Apply for this Job"
- Write cover letter → Submit

---

### 8. View Withdrawable Balance (FL)
**URL**: `http://localhost:3000/FL/profile`

**File**: `app/FL/profile/page.tsx`

**What to Integrate**:
```
Line ~138: "Available to Withdraw" display
Line ~153: "Withdraw to Wallet" button
```

**Smart Contract Function**:
```solidity
function getWithdrawableBalance(address user) external view returns (
    uint256 totalWithdrawable,
    uint256 escrowAmount,
    uint256 yieldAmount,
    uint256 projectCount
)
```

**Current State**: ✅ **INTEGRATED** - Uses `useWithdrawableBalance()` hook
- Shows real-time balance from contract
- Breakdown: Escrow + Yield amounts

---

### 9. Withdraw Earnings (FL)
**URL**: `http://localhost:3000/FL/profile`

**File**: `app/FL/profile/page.tsx`

**What to Integrate**:
```
Line ~XXX: handleWithdraw() function
Line ~153: "Withdraw to Wallet" button
```

**Smart Contract Function**:
```solidity
function withdraw(uint256 amount) external
```

**Current State**: ✅ **INTEGRATED** - Uses `useWithdraw()` hook
- Click "Withdraw to Wallet"
- Calls contract to transfer funds

---

### 10. View Yield Info (PO Dashboard)
**URL**: `http://localhost:3000/PO`

**File**: `app/PO/page.tsx`

**What to Integrate**:
```
Line ~328: "Yield Performance" card
Line ~363: LP status display
```

**Smart Contract Function**:
```solidity
function getYieldInfo(bytes32 kpiId) external view returns (
    uint256 lpInitialValue,
    uint256 lpCurrentValue,
    int256 yieldProfit,
    uint256 yieldPercentage,
    bool isDistributed,
    uint256 poShare,
    uint256 flShare,
    uint256 platformShare
)
```

**Current State**: ⚠️ **MOCK DATA** - Ready for `useYieldInfo()` hook
- Currently shows mock yield rates
- Hook is ready, just needs contract deployment

---

### 11. Get LP Status
**URL**: `http://localhost:3000/PO`

**File**: `app/PO/page.tsx`

**What to Integrate**:
```
Line ~363: LP (10%) display
```

**Smart Contract Function**:
```solidity
function getLPValue(bytes32 kpiId) external view returns (uint256)
```

**Current State**: ⚠️ **MOCK DATA** - Ready for `useLPValue()` hook

---

### 12. Cancel Project
**URL**: `http://localhost:3000/PO/projects/1`

**File**: `app/PO/projects/[id]/page.tsx`

**What to Integrate**:
```
// TODO: Add "Cancel Project" button to page
// Should be in sidebar or header
```

**Smart Contract Function**:
```solidity
function cancelProject(
    bytes32 projectId,
    string reason
) external
```

**Current State**: ❌ **NOT IMPLEMENTED** - UI needs to be added
- Hook `useCancelProject()` is ready
- Just needs button and modal in the UI

---

### 13. Withdraw Earnings (PO)
**URL**: `http://localhost:3000/PO/profile` (page exists)

**File**: `app/PO/profile/page.tsx`

**What to Integrate**:
```
// TODO: Add "Yield Earnings" section similar to FL profile
// TODO: Add "Withdraw" button
```

**Smart Contract Function**:
```solidity
function getWithdrawableBalance(address user) external view
function withdraw(uint256 amount) external
```

**Current State**: ❌ **NOT IMPLEMENTED** - UI needs to be added
- Same hooks work for PO too
- Just needs UI implementation

---

### 14. Job Application List
**URL**: `http://localhost:3000/FL/applications`

**File**: `app/FL/applications/page.tsx`

**What to Integrate**:
```
// Fetch applications from contract
```

**Smart Contract Function**:
```solidity
function getRoleApplications(bytes32 roleId) external view returns (address[])
```

**Current State**: ⚠️ **MOCK DATA** - Hook `useRoleApplications()` ready

---

## 🎯 Priority Order for Smart Contract Team

### Phase 1: Core Flow (P0)
1. **Deploy contract** to Base Sepolia
2. **Test Create Project** → `http://localhost:3000/PO/create-project`
3. **Test Deposit** → `http://localhost:3000/PO/projects/[id]`
4. **Test Freelancer Assignment** → `http://localhost:3000/PO/projects/[id]/applications`
5. **Test KPI Submission** → `http://localhost:3000/FL/active-jobs`

### Phase 2: Approval Flow (P0)
6. **Test PO Approval** → `http://localhost:3000/PO/projects/[id]`
7. **Test FL Approval** → `http://localhost:3000/FL/active-jobs`
8. **Test Yield Distribution** → Both approvals complete

### Phase 3: Financial Flow (P0)
9. **Test Withdraw (FL)** → `http://localhost:3000/FL/profile`
10. **Test Withdraw (PO)** → `http://localhost:3000/PO/profile`

### Phase 4: Additional Features (P1)
11. **Test Cancel Project** → Add UI to `http://localhost:3000/PO/projects/[id]`
12. **Test Job Applications** → `http://localhost:3000/FL/jobs/[id]`

---

## 🔍 How to Test Each Integration

### Example 1: Create Project
```bash
# 1. Navigate to
http://localhost:3000/PO/create-project

# 2. Click "Fill Data" button (auto-fills form)

# 3. Click "Create Project"

# 4. Check browser console for transaction hash

# 5. Check BaseScan: https://sepolia.basescan.org/tx/[hash]
```

### Example 2: Deposit Funds
```bash
# 1. Navigate to
http://localhost:3000/PO/projects/1

# 2. Click "Deposit to Escrow" in sidebar

# 3. Review 90/10 split in modal

# 4. Click "Deposit"

# 5. Wait for confirmation toast
```

### Example 3: Approve KPI
```bash
# 1. Navigate to
http://localhost:3000/PO/projects/2

# 2. Expand role to see KPIs

# 3. Find KPI with "Ready for Review" badge

# 4. Click "Approve" button

# 5. Confirm in modal
```

---

## 📁 File Structure Overview

```
app/
├── PO/                          # Project Owner Pages
│   ├── page.tsx                 # Dashboard → http://localhost:3000/PO
│   ├── create-project/          # → http://localhost:3000/PO/create-project
│   │   └── page.tsx             # ✅ Integrated
│   ├── projects/                # Projects List
│   │   ├── page.tsx             # → http://localhost:3000/PO/projects
│   │   └── [id]/               # Project Detail
│   │       ├── page.tsx         # → http://localhost:3000/PO/projects/1
│   │       │   # ✅ Deposit integrated (line 544)
│   │       │   # ✅ Approve integrated (line 492)
│   │       │   # ❌ Cancel UI missing
│   │       └── applications/    # → http://localhost:3000/PO/projects/1/applications
│   │           └── page.tsx     # ✅ Assign integrated
│   └── profile/
│       └── page.tsx             # → http://localhost:3000/PO/profile
│                               # ❌ Withdraw UI missing
│
└── FL/                          # Freelancer Pages
    ├── page.tsx                 # Dashboard → http://localhost:3000/FL
    ├── jobs/                    # Browse Jobs
    │   ├── page.tsx             # → http://localhost:3000/FL/jobs
    │   └── [id]/               # Job Detail
    │       └── page.tsx         # → http://localhost:3000/FL/jobs/1
    │                           # ✅ Apply integrated (line 233)
    ├── active-jobs/             # → http://localhost:3000/FL/active-jobs
    │   └── page.tsx             # ✅ Submit KPI integrated
    │                           # ✅ Approve KPI integrated
    ├── applications/            # → http://localhost:3000/FL/applications
    │   └── page.tsx             # ⚠️ Mock data
    └── profile/
        └── page.tsx             # → http://localhost:3000/FL/profile
                                # ✅ Withdraw integrated (line 153)
```

---

## ✅ Integration Checklist

Use this to track progress:

- [ ] **Contract Deployed** to Base Sepolia
- [ ] **Contract Address** updated in `lib/contract.ts`
- [ ] `/PO/create-project` - Create project working
- [ ] `/PO/projects/[id]` - Deposit working
- [ ] `/PO/projects/[id]/applications` - Assign freelancer working
- [ ] `/FL/active-jobs` - Submit KPI working
- [ ] `/FL/active-jobs` - FL approve KPI working
- [ ] `/PO/projects/[id]` - PO approve KPI working
- [ ] `/FL/jobs/[id]` - Apply for job working
- [ ] `/FL/profile` - Withdraw balance showing
- [ ] `/FL/profile` - Withdraw working
- [ ] `/PO` - Yield data showing (real-time)
- [ ] `/PO/profile` - Withdraw UI added
- [ ] `/PO/projects/[id]` - Cancel project UI added

---

## 🛠️ Developer Notes

### How to Find Integration Points

1. **Open the file** mentioned for each endpoint
2. **Search for** `// TODO:` or `// Smart Contract` comments
3. **Look for** hooks like `useCreateProject()`, `useDepositKPI()`, etc.
4. **Check the button onClick handlers** - they trigger contract calls

### Transaction Flow

Every integration follows this pattern:
```typescript
1. User clicks button
2. Frontend validates input
3. Show info toast
4. Call smart contract function via hook
5. Show pending toast with tx hash
6. Wait for confirmation
7. Show success toast
8. Update UI / navigate
```

### Error Handling

All integrations include:
- ✅ Wallet connection check
- ✅ Chain ID check (Base mainnet/Sepolia)
- ✅ Input validation
- ✅ Try/catch with error toasts
- ✅ Loading states during transactions
- ✅ Success/error feedback

---

## 📞 Need Help?

**For Smart Contract Team:**
- See `lib/abi.ts` for complete contract ABI
- See `lib/contract.ts` for type definitions
- Each page has inline comments showing what to integrate

**For Frontend Team:**
- All hooks are in `lib/hooks.ts`
- Transaction system in `lib/transactions.ts`
- Toast notifications in `components/ui/Toast.tsx`

---

**Last Updated**: Implementation complete - ready for contract deployment testing
