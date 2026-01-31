# NovaLance Frontend - Complete User Flow Guide

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Setup & Prerequisites](#2-setup--prerequisites)
3. [Happy Path - Complete Flow](#3-happy-path---complete-flow)
4. [Late Penalty Scenarios](#4-late-penalty-scenarios)
5. [Cancellation Scenarios](#5-cancellation-scenarios)
6. [Page-by-Page Guide](#6-page-by-page-guide)
7. [Smart Contract Integration](#7-smart-contract-integration)
8. [Status Badges & States](#8-status-badges--states)
9. [Revenue Distribution](#9-revenue-distribution)

---

## 1. Overview & Architecture

### What is NovaLance?

NovaLance is a freelance marketplace with milestone-based escrow payments and **yield generation** on deposited funds. It combines:

- **Traditional freelance marketplace features** (project posting, applications, milestones)
- **Smart contract escrow** (funds locked on-chain, released upon completion)
- **DeFi yield generation** (10% of deposits go to lending protocol, earning ~5-11% APY)
- **Multi-sig approval workflow** (freelancer submits → both PO and FL approve → freelancer withdraws)

### Two User Types

| Role | Prefix | Purpose | Key Actions |
|------|--------|---------|-------------|
| **Project Owner (PO)** | `/PO` | Posts projects, hires freelancers, approves work | Create projects, deposit funds, review milestones |
| **Freelancer (FL)** | `/FL` | Applies to jobs, submits deliverables | Browse jobs, submit milestones, withdraw earnings |

### Smart Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NovaLance Frontend                       │
│                    (Next.js 15 + Wagmi)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   lib/hooks.ts (Custom Hooks)                │
│  • usePLCreateProject, usePLDepositFunds                     │
│  • usePLSubmitMilestone, usePLAcceptMilestone                │
│  • usePLWithdrawMilestone, usePLYield                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ProjectLance Smart Contract                      │
│           Deployed on Base Sepolia (chainId: 84532)          │
│  Address: 0x87c5C1a665cE300B13Cf5DE7a5d206386E93049c          │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────────┐
│   MockIDRX (Token)    │   │   MockLendingProtocol         │
│   IDRX Token (6 dec)  │   │   ~5-11% APY Yield           │
│ 0x026632AcAAc18B...   │   │ 0xcAD07A2741E3C08D79452F...   │
└───────────────────────┘   └───────────────────────────────┘
```

---

## 2. Setup & Prerequisites

### Step 2.1: Install Dependencies

```bash
cd NovaLance
npm install
```

### Step 2.2: Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Step 2.3: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Step 2.4: Connect Wallet

1. Click **"Connect Wallet"** button (top-right)
2. Choose your wallet (MetaMask, Coinbase Wallet, etc.)
3. Switch to **Base Sepolia testnet**
4. Get testnet IDRX from faucet (if available)

---

## 3. Happy Path - Complete Flow

### Scenario: Complete a 3-Milestone Project

#### Step 3.1: PO Creates Project

**Navigate to:** `/PO/create-project` or click **"Create Project"** from dashboard

**Form Fields:**
```
Milestone 1:
  Deadline: [Date picker - 30 days from now]
  Percentage: 30%

Milestone 2:
  Deadline: [Date picker - 60 days from now]
  Percentage: 30%

Milestone 3:
  Deadline: [Date picker - 90 days from now]
  Percentage: 40% (must be >= 10% for yield)

Total: 100%
```

**Frontend Action:**
```typescript
// app/PO/create-project/page.tsx
const { createProject } = usePLCreateProject();

await createProject({
  deadlines: [
    BigInt(Math.floor(new Date('2025-03-01').getTime() / 1000)),
    BigInt(Math.floor(new Date('2025-04-01').getTime() / 1000)),
    BigInt(Math.floor(new Date('2025-05-01').getTime() / 1000)),
  ],
  percentages: [BigInt(3000), BigInt(3000), BigInt(4000)] // 30%, 30%, 40%
});
```

**Smart Contract Call:**
```solidity
ProjectLance.createProject(deadlines, percentages)
→ emits ProjectCreated(projectId, creator, milestoneCount)
→ Returns: projectId (0, 1, 2, ...)
```

**Result:**
- Project created with ID
- PO redirected to `/PO/projects/[id]`
- Status: `Active` (no freelancer assigned yet)

---

#### Step 3.2: FL Discovers and Applies

**Navigate to:** `/FL/jobs` (Browse Jobs)

**What FL Sees:**
```
┌─────────────────────────────────────────┐
│  Build DEX Frontend                     │
│  Looking for experienced React dev...    │
│                                         │
│  Budget: 1,000 IDRX                     │
│  Milestones: 3                          │
│                                         │
│  Skills: React, TypeScript, Web3        │
│                                         │
│  [View Details] [Apply]                 │
└─────────────────────────────────────────┘
```

**FL Clicks "Apply":**
```typescript
// app/FL/jobs/[id]/page.tsx
const { apply } = usePLApplyForProject();

await apply(projectId);
```

**Smart Contract Call:**
```solidity
ProjectLance.applyForProject(projectId)
→ emits FreelancerApplied(projectId, freelancer, timestamp)
→ Freelancer added to applicants array
```

**Result:**
- Application status: `Pending`
- PO sees application on `/PO/projects/[id]/applications`

---

#### Step 3.3: PO Accepts Freelancer

**Navigate to:** `/PO/projects/[id]/applications`

**What PO Sees:**
```
┌─────────────────────────────────────────┐
│  Applicants for "Build DEX Frontend"    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 0x1234...abcd (you.eth)           │  │
│  │                                   │  │
│  │ "I have 5 years experience..."    │  │
│  │                                   │  │
│  │ Completed: 5 projects             │  │
│  │ Rating: ⭐⭐⭐⭐⭐ (4.8)          │  │
│  │                                   │  │
│  │ [Accept] [Reject]                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**PO Clicks "Accept":**
```typescript
// components/contract/POMilestoneActions.tsx
const { accept } = usePLAcceptFreelancer();

await accept(projectId, freelancerAddress);
```

**Smart Contract Call:**
```solidity
ProjectLance.acceptFreelancer(projectId, freelancer)
→ emits FreelancerAccepted(projectId, creator, freelancer)
→ project.freelancer = freelancer
→ project.status = Assigned
```

**Result:**
- Freelancer now assigned
- Project status changes to `Assigned`
- Other applicants automatically rejected

---

#### Step 3.4: PO Deposits Funds

**Navigate to:** `/PO/projects/[id]`

**What PO Sees:**
```
┌─────────────────────────────────────────┐
│  Project: Build DEX Frontend            │
│  Status: Assigned                       │
│  Freelancer: 0x1234...abcd              │
│                                         │
│  💰 Deposit Required                    │
│                                         │
│  Total Budget: 1,000 IDRX               │
│  ┌─ 900 IDRX (90%) → Vault             │
│  └─ 100 IDRX (10%) → Lending Yield     │
│                                         │
│  [Deposit Funds]                        │
└─────────────────────────────────────────┘
```

**PO Clicks "Deposit Funds":**

**Step 1: Approve Token Spend**
```typescript
// First approve IDRX spend
await publicClient.simulateContract({
  address: IDRX_ADDRESS,
  abi: erc20Abi,
  functionName: 'approve',
  args: [PROJECT_LANCE_ADDRESS, parseUnits('1000', 6)]
});
```

**Step 2: Deposit to Project**
```typescript
// components/contract/POMilestoneActions.tsx
const { deposit } = usePLDepositFunds();

await deposit(projectId, parseUnits('1000', 6)); // 1,000 IDRX
```

**Smart Contract Call:**
```solidity
ProjectLance.depositFunds(projectId, amount)
→ IDRX transferred from PO to ProjectLance
→ 900 IDRX kept in vault
→ 100 IDRX sent to MockLendingProtocol
→ emits FundsDeposited(projectId, creator, 1000, 900, 100)
```

**Result:**
- Vault: 900 IDRX (for milestone payments)
- Lending: 100 IDRX (generating yield at ~5-11% APY)
- Milestones now visible to FL

---

#### Step 3.5: FL Submits Milestone 1

**Navigate to:** `/FL/projects/[id]`

**What FL Sees:**
```
┌─────────────────────────────────────────┐
│  Milestone 1: Setup & Wallet Connection │
│  Deadline: 2025-03-01                   │
│  Payment: 270 IDRX (30% of vault)       │
│  Status: Pending                        │
│                                         │
│  Deliverables:                          │
│  ☐ Initialize Next.js project           │
│  ☐ Setup Wagmi wallet connection        │
│  ☐ Deploy to Base Sepolia               │
│                                         │
│  [Submit Milestone]                     │
└─────────────────────────────────────────┘
```

**FL Clicks "Submit Milestone":**
```typescript
// app/FL/projects/[id]/page.tsx
const { submit } = usePLSubmitMilestone();

await submit(projectId, BigInt(0)); // milestone index 0
```

**Smart Contract Call:**
```solidity
ProjectLance.submitMilestone(projectId, 0)
→ milestone[0].submissionTime = block.timestamp
→ emits MilestoneSubmitted(projectId, 0, freelancer, timestamp)
```

**Result:**
- Milestone status: `Submitted`
- PO can now review

---

#### Step 3.6: PO Accepts Milestone 1

**Navigate to:** `/PO/projects/[id]`

**What PO Sees:**
```
┌─────────────────────────────────────────┐
│  Milestone 1: Setup & Wallet Connection │
│  Status: Submitted ✓                    │
│  Submitted: 2 days ago                  │
│                                         │
│  Check deliverables:                    │
│  ☑ Next.js project initialized          │
│  ☑ Wallet connection working            │
│  ☑ Deployed to 0x1234...                │
│                                         │
│  [Approve] [Request Changes]            │
└─────────────────────────────────────────┘
```

**PO Clicks "Approve":**
```typescript
// components/contract/POMilestoneActions.tsx
const { accept } = usePLAcceptMilestone();

await accept(projectId, BigInt(0));
```

**Smart Contract Calculation:**
```solidity
// Calculate payment
milestoneVaultAmount = (vaultAmount * milestone.percentage) / BASIS_POINTS
                     = (900 * 3000) / 10000
                     = 270 IDRX

// Check for late penalty
penalty = calculateLatePenalty(deadline, submissionTime)
if (onTime) penalty = 0
if (1 day late) penalty = 500 (5%)

actualAmount = milestoneVaultAmount * (10000 - penalty) / 10000
            = 270 * 10000 / 10000
            = 270 IDRX (no penalty)

→ emits MilestoneAccepted(projectId, 0, creator, 270, 0, 270, 0)
→ milestone.accepted = true
```

**Result:**
- Milestone status: `Accepted`
- FL can now withdraw
- Payment calculated: 270 IDRX

---

#### Step 3.7: FL Withdraws Milestone 1 Payment

**Navigate to:** `/FL/projects/[id]`

**What FL Sees:**
```
┌─────────────────────────────────────────┐
│  Milestone 1: Ready to Withdraw!        │
│  Status: Approved                       │
│                                         │
│  You will receive:                      │
│  ┌─────────────────────────────────┐    │
│  │ Vault: 270 IDRX                 │    │
│  │ Yield: 0 IDRX (not last milestone)│   │
│  │ Total: 270 IDRX                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Withdraw Funds]                       │
└─────────────────────────────────────────┘
```

**FL Clicks "Withdraw Funds":**
```typescript
// components/contract/MilestoneActions.tsx
const { withdraw } = usePLWithdrawMilestone();

await withdraw(projectId, BigInt(0));
```

**Smart Contract Execution:**
```solidity
ProjectLance.withdrawMilestone(projectId, 0)
→ Check: msg.sender == project.freelancer ✓
→ Check: milestone.accepted == true ✓
→ Check: milestone.released == false ✓

// Calculate distribution (NON-LAST milestone)
vaultPortion = (vaultAmount * percentage) / BASIS_POINTS
            = (900 * 3000) / 10000
            = 270 IDRX

freelancerShare = vaultPortion = 270 IDRX
  // No 40-40-40 split for non-last milestones!
  // Freelancer gets 100% of vault portion

→ Transfer 270 IDRX to freelancer
→ milestone.released = true
→ emits MilestoneWithdrawn(projectId, 0, freelancer, 270, 0, 0, 0)
```

**Result:**
- FL receives: **270 IDRX**
- Creator receives: **0 IDRX** (no split on non-last milestones)
- Platform receives: **0 IDRX**
- Milestone 1: `Withdrawn`

---

#### Step 3.8: Complete Milestone 2 (Same Flow)

Repeat steps 3.5 to 3.7 for Milestone 2:
- FL submits milestone
- PO accepts
- FL withdraws

**Milestone 2 Distribution:**
- FL receives: **270 IDRX** (30% of 900 vault)
- Total so far: 270 + 270 = **540 IDRX**

---

#### Step 3.9: Complete Milestone 3 (LAST MILESTONE - With Yield!)

**Step 3.9a: FL Submits Milestone 3**
```typescript
await submit(projectId, BigInt(2)); // Last milestone
```

**Step 3.9b: PO Accepts (calculates YIELD!)**
```typescript
await accept(projectId, BigInt(2));
```

**Smart Contract Calculation:**
```solidity
// Vault portion (same as always)
milestoneVaultAmount = (900 * 4000) / 10000 = 360 IDRX

// YIELD portion (ONLY for last milestone!)
lendingBalance = lendingProtocol.getBalance(projectLance)
                = 105 IDRX (100 principal + ~5 yield)

milestoneYieldAmount = lendingBalance - project.lendingAmount
                     = 105 - 100
                     = 5 IDRX

totalBeforePenalty = 360 + 5 = 365 IDRX

// Apply late penalty if any
actualAmount = totalBeforePenalty * (10000 - penalty) / 10000

→ emits MilestoneAccepted(projectId, 2, creator, 360, 5, 365, 0)
```

**Step 3.9c: FL Withdraws (with 40-40-20 YIELD split!)**
```typescript
await withdraw(projectId, BigInt(2));
```

**Smart Contract Distribution:**
```solidity
// VAULT portion: Freelancer gets 100%
vaultPortion = 360 IDRX
freelancerVaultShare = 360 IDRX

// YIELD portion: 40-40-20 split
totalYield = 5 IDRX

freelancerYieldShare = (5 * 40) / 100 = 2 IDRX
creatorYieldShare = (5 * 40) / 100 = 2 IDRX
platformYieldShare = (5 * 20) / 100 = 1 IDRX

// TOTAL to Freelancer
freelancerTotal = 360 + 2 = 362 IDRX

→ Transfer 360 IDRX to freelancer (vault)
→ Transfer 2 IDRX to freelancer (yield)
→ Transfer 2 IDRX to creator (yield)
→ Transfer 1 IDRX to platform (yield)
→ emits MilestoneWithdrawn(projectId, 2, freelancer, 360, 2, 1, 2)
→ project.status = Completed
```

**Final Distribution Summary:**
| Party | Milestone 1 | Milestone 2 | Milestone 3 | **Total** |
|-------|-------------|-------------|-------------|-----------|
| Freelancer | 270 IDRX | 270 IDRX | 362 IDRX | **902 IDRX** |
| Creator | 0 | 0 | 2 IDRX | **2 IDRX** |
| Platform | 0 | 0 | 1 IDRX | **1 IDRX** |
| Lending Principal | — | — | 100 IDRX (stays) | **100 IDRX** |

---

## 4. Late Penalty Scenarios

### Penalty Rules

- **Rate:** 5% per day late (500 basis points)
- **Max:** 100% (capped at 20 days late)
- **Who gets penalty:** Project Creator (NOT platform)
- **What gets penalized:** Vault portion + Yield portion

### Test Case: Submit 1 Day Late

**Scenario:**
- Deadline: 2025-03-01 00:00:00
- Submitted: 2025-03-02 01:00:00 (1 day + 1 hour late)

**Penalty Calculation:**
```solidity
daysLate = (submissionTime - deadline) / 1 day
         = 1 day
penalty = daysLate * 500 = 500 (5%)
```

**Payment Calculation (270 IDRX milestone):**
```solidity
originalAmount = 270 IDRX
penaltyAmount = 270 * 500 / 10000 = 13.5 IDRX
reducedAmount = 270 - 13.5 = 256.5 IDRX

→ Freelancer receives: 256.5 IDRX
→ Creator receives: 13.5 IDRX (penalty)
```

**What FL Sees (Late Warning):**
```
┌─────────────────────────────────────────┐
│  ⚠️ LATE SUBMISSION WARNING             │
│                                         │
│  Submitted 1 day late                   │
│  Penalty: 5% (13.5 IDRX)                │
│                                         │
│  Original: 270 IDRX                     │
│  Penalty: -13.5 IDRX                    │
│  ───────────────────                    │
│  You receive: 256.5 IDRX                │
│                                         │
│  Creator receives: 13.5 IDRX            │
│                                         │
│  [Withdraw]                              │
└─────────────────────────────────────────┘
```

---

## 5. Cancellation Scenarios

### Who Can Cancel?

**Only the Project Creator** can cancel a project at any time, EXCEPT when:
- Project status is `Completed`
- All milestones are `Withdrawn`

### Cancellation Formula

```solidity
// Calculate what freelancer has already withdrawn
releasedTotal = sum of all released milestone amounts

// Calculate remaining vault
remainingVault = vaultAmount - releasedTotal

// Return 100% of remaining to creator (no 10% fee!)
returnAmount = remainingVault

// Lending (10%) always belongs to platform
platformKeeps = lendingAmount + anyAccumulatedYield
```

### Test Case: Cancel Before Any Milestones

**Scenario:**
- PO deposited: 1,000 IDRX
- Vault: 900 IDRX
- Lending: 100 IDRX
- No milestones completed

**Cancellation:**
```typescript
await cancelProject(projectId);
```

**Smart Contract Execution:**
```solidity
releasedTotal = 0
remainingVault = 900 - 0 = 900 IDRX

→ Transfer 900 IDRX to creator (100% refund!)
→ project.status = Cancelled
→ emits ProjectCancelled(projectId, creator, 900, 0)
```

**Platform Dev Withdraws Lending:**
```solidity
withdrawCancelledProjectYield(projectId)
→ Withdraw 100 IDRX from lending
→ Transfer to platform dev
→ emits CancelledProjectYieldWithdrawn(projectId, platformDev, 100)
```

**Result:**
- Creator gets back: **900 IDRX** (100% of vault)
- Platform keeps: **100 IDRX** (lending principal)

### Test Case: Cancel After 1 Milestone Withdrawn

**Scenario:**
- Milestone 1: 270 IDRX paid to freelancer
- Remaining vault: 900 - 270 = 630 IDRX

**Cancellation:**
```solidity
remainingVault = 630 IDRX

→ Transfer 630 IDRX to creator
→ Freelancer keeps: 270 IDRX (already paid)
```

---

## 6. Page-by-Page Guide

### Landing Page (`/`)

**Purpose:** Entry point, user role selection

**Components:**
- Hero section with app description
- "Connect Wallet" button
- Navigation to PO or FL dashboards (after connection)

**Smart Contract Interaction:** None

---

### PO Dashboard (`/PO`)

**Purpose:** Overview of created projects and yield performance

**Data Displayed:**
```
┌─────────────────────────────────────────┐
│  Project Owner Dashboard                │
│                                         │
│  Active Projects: 3                     │
│  Total Deposited: 5,000 IDRX            │
│  Total Yield Earned: 25 IDRX            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Project 1: DEX Frontend         │    │
│  │ Status: In Progress             │    │
│  │ Yield: +5.2% 📈                │    │
│  │ [View]                           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Create New Project]                   │
└─────────────────────────────────────────┘
```

**Smart Contract Calls:**
- `usePLProjectCount()` - Get total projects
- `usePLProject(id)` - Get each project details
- `usePLYield(id)` - Get yield for each project

---

### PO Projects List (`/PO/projects`)

**Purpose:** List all created projects

**Filters:**
- All Projects
- Active (Assigned, in progress)
- Draft (Not yet assigned freelancer)
- Completed

**Smart Contract Calls:**
```typescript
for (let i = 0; i < projectCount; i++) {
  const { project } = usePLProject(BigInt(i));
  if (project[0] === address) { // If creator
    // Add to list
  }
}
```

---

### PO Project Detail (`/PO/projects/[id]`)

**Purpose:** Manage a single project

**Sections:**
1. Project Info (title, budget, status)
2. Freelancer Assignment (if not assigned)
3. Fund Deposit (if not deposited)
4. Milestones List
5. Applicants (tab to `/PO/projects/[id]/applications`)

**Smart Contract Calls:**
- `usePLProject(projectId)` - Get project details
- `usePLAllMilestones(projectId)` - Get all milestones
- `usePLApplicants(projectId)` - Get applicants
- `usePLVaultBalance(projectId)` - Get vault balance
- `usePLLendingBalance(projectId)` - Get lending balance

**Actions:**
| Action | Hook | When Available |
|--------|------|----------------|
| Accept Freelancer | `usePLAcceptFreelancer()` | Has applicants |
| Deposit Funds | `usePLDepositFunds()` | No deposit yet |
| Accept Milestone | `usePLAcceptMilestone()` | Milestone submitted |
| Cancel Project | `usePLCancelProject()` | Not completed |

---

### PO Applications (`/PO/projects/[id]/applications`)

**Purpose:** Review and accept/reject applicants

**What PO Sees:**
```
┌─────────────────────────────────────────┐
│  Applicants for "Build DEX"             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 0x1234...abcd                      │  │
│  │                                   │  │
│  │ "I'm a React expert with 5 years..."│ │
│  │                                   │  │
│  │ Skills: React, TS, Web3           │  │
│  │ Projects: 12 completed             │  │
│  │ Rating: ⭐⭐⭐⭐⭐ (4.9)          │  │
│  │                                   │  │
│  │ [Accept] [Reject]                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Smart Contract Calls:**
- `usePLApplicants(projectId)` - Get applicant addresses
- For each applicant, fetch profile from backend API

---

### PO Portfolio (`/PO/portfolio`)

**Purpose:** View completed projects and lifetime yield earnings

**Data Displayed:**
- Completed projects list
- Total earned (creator's share of yield)
- Yield APY history
- Vault withdrawals

**Smart Contract Calls:**
- Filter projects by `status === Completed`
- Sum up yield earnings from last milestones

---

### FL Dashboard (`/FL`)

**Purpose:** Overview of active assignments and yield earnings

**Data Displayed:**
```
┌─────────────────────────────────────────┐
│  Freelancer Dashboard                   │
│                                         │
│  Active Jobs: 2                         │
│  Pending Applications: 3                │
│  Total Earned: 1,500 IDRX               │
│  Yield Earned: 35 IDRX                  │
│                                         │
│  Live Yield Carousel:                   │
│  ┌──────────────────────────────────┐  │
│  │ Project A: +5.2% 📈             │  │
│  │ 270 IDRX → 284 IDRX              │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Smart Contract Calls:**
- `usePLProjectCount()` - Get total projects
- Filter where `project[1] === address` (freelancer)
- `usePLYield(id)` - Get yield for each project

---

### FL Browse Jobs (`/FL/jobs`)

**Purpose:** Discover available projects

**Filters:**
- Skill matching (frontend filter, not API)
- Budget range
- Status (Hiring only)

**Smart Contract Calls:**
```typescript
// Get all projects, filter by:
// - status === Active (no freelancer yet)
// - has deposit
for (let i = 0; i < projectCount; i++) {
  const { project } = usePLProject(BigInt(i));
  if (project[1] === address(0)) { // No freelancer
    // Show in list
  }
}
```

---

### FL Job Detail (`/FL/jobs/[id]`)

**Purpose:** View project details and apply

**Sections:**
1. Project description
2. Milestones (deadlines, payments)
3. Requirements (skills, budget)
4. "Apply" button (if not applied)

**Smart Contract Calls:**
- `usePLProject(projectId)` - Get project details
- `usePLAllMilestones(projectId)` - Get milestones
- Check if already applied (backend API)

**Actions:**
| Action | Hook | Condition |
|--------|------|-----------|
| Apply | `usePLApplyForProject()` | Not yet applied |

---

### FL Active Jobs (`/FL/active-jobs`)

**Purpose:** View and work on assigned projects

**What FL Sees:**
```
┌─────────────────────────────────────────┐
│  Active Assignments                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Build DEX Frontend                 │  │
│  │                                   │  │
│  │ Milestone 1: Submitted ✓          │  │
│  │   Waiting for PO approval...       │  │
│  │                                   │  │
│  │ Milestone 2: Pending               │  │
│  │   Deadline: 2025-04-01            │  │
│  │   [Submit Milestone]              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Smart Contract Calls:**
- Filter where `project[1] === address` (freelancer)
- `usePLAllMilestones(projectId)` - Get milestones
- `usePLMilestonePenalty()` - Check late penalty

**Actions:**
| Action | Hook | Condition |
|--------|------|-----------|
| Submit Milestone | `usePLSubmitMilestone()` | Not submitted yet |
| Withdraw | `usePLWithdrawMilestone()` | Accepted & not withdrawn |

---

### FL Applications (`/FL/applications`)

**Purpose:** Track application status

**Status Types:**
- `Pending` - Waiting for PO review
- `Accepted` - Got the job!
- `Rejected` - Not selected

**Backend API Call:**
```typescript
GET /api/applications/my
```

---

### FL Portfolio (`/FL/portfolio`)

**Purpose:** Showcase completed work

**Data Displayed:**
- Completed projects
- Total earnings (vault + yield)
- Yield percentage earned
- Withdrawal history

**Smart Contract Calls:**
- Filter where `project[1] === address` AND `status === Completed`
- Calculate earnings from milestones

---

## 7. Smart Contract Integration

### Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| ProjectLance | `0x87c5C1a665cE300B13Cf5DE7a5d206386E93049c` |
| MockIDRX | `0x026632AcAAc18Bc99c3f7fa930116189B6ba8432` |
| MockLendingProtocol | `0xcAD07A2741E3C08D79452F9CA337DE3a3947eae5` |

### Custom Hooks (lib/hooks.ts)

| Hook | Purpose | Returns |
|------|---------|---------|
| `usePLCreateProject()` | Create new project | `{ createProject, isPending }` |
| `usePLApplyForProject()` | Apply to project | `{ apply, isPending }` |
| `usePLAcceptFreelancer()` | Accept applicant | `{ accept, isPending }` |
| `usePLDepositFunds()` | Deposit to vault | `{ deposit, isPending }` |
| `usePLSubmitMilestone()` | Submit work | `{ submit, isPending }` |
| `usePLAcceptMilestone()` | Approve work | `{ accept, isPending }` |
| `usePLWithdrawMilestone()` | Withdraw payment | `{ withdraw, isPending }` |
| `usePLCancelProject()` | Cancel project | `{ cancel, isPending }` |
| `usePLProject(id)` | Get project details | `{ project, isLoading }` |
| `usePLAllMilestones(id)` | Get all milestones | `{ milestones, isLoading }` |
| `usePLMilestone(id, index)` | Get single milestone | `{ milestone, isLoading }` |
| `usePLVaultBalance(id)` | Get vault balance | `{ balance, isLoading }` |
| `usePLLendingBalance(id)` | Get lending balance | `{ balance, isLoading }` |
| `usePLYield(id)` | Get yield data | `{ vaultAmount, lendingAmount, yield% }` |
| `usePLMilestonePenalty(id, idx)` | Calculate penalty | `{ penalty, isLoading }` |
| `usePLApplicants(id)` | Get applicants | `{ applicants, isLoading }` |
| `usePLProjectCount()` | Total projects | `{ count, isLoading }` |

### Transaction UI Helpers

**Show Pending:**
```typescript
import { showTransactionPending } from '@/lib/transactions';

showTransactionPending(hash, 'Deposit Funds', chainId);
→ Shows toast notification
→ Auto-updates when confirmed
```

**Show Error:**
```typescript
import { showTransactionError } from '@/lib/transactions';

showTransactionError('0x0', error, 'Failed to deposit');
→ Shows error toast
```

---

## 8. Status Badges & States

### Project Status

| Status | Value | Color | Description |
|--------|-------|-------|-------------|
| Active | 0 | Gray | Created, no freelancer |
| Assigned | 1 | Blue | Freelancer assigned |
| Completed | 2 | Green | All milestones withdrawn |
| Cancelled | 3 | Red | Cancelled by creator |

### Milestone Status

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Gray | Not submitted |
| Submitted | Yellow | Waiting for approval |
| Accepted | Blue | Approved, ready to withdraw |
| Withdrawn | Green | Payment complete |

### Application Status

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Yellow | Under review |
| Accepted | Green | Got the job! |
| Rejected | Red | Not selected |

---

## 9. Revenue Distribution

### Non-Last Milestones (1 to N-1)

```
┌─────────────────────────────────────────┐
│  Milestone 1 (30% of 900 = 270 IDRX)   │
│                                         │
│  Vault Portion: 270 IDRX                │
│  └─ Freelancer: 270 IDRX (100%)        │
│                                         │
│  Yield Portion: 0 IDRX                  │
│  └─ (Only last milestone gets yield)    │
│                                         │
│  TOTAL DISTRIBUTION:                    │
│  Freelancer: 270 IDRX                   │
│  Creator: 0 IDRX                        │
│  Platform: 0 IDRX                       │
└─────────────────────────────────────────┘
```

### Last Milestone (N)

```
┌─────────────────────────────────────────┐
│  Milestone 3 (40% of 900 = 360 IDRX)   │
│                                         │
│  Vault Portion: 360 IDRX                │
│  └─ Freelancer: 360 IDRX (100%)        │
│                                         │
│  Yield Portion: 5 IDRX (5% APY earned) │
│  ├─ Freelancer: 2 IDRX (40%)           │
│  ├─ Creator: 2 IDRX (40%)              │
│  └─ Platform: 1 IDRX (20%)             │
│                                         │
│  TOTAL DISTRIBUTION:                    │
│  Freelancer: 362 IDRX                   │
│  Creator: 2 IDRX                        │
│  Platform: 1 IDRX                       │
└─────────────────────────────────────────┘
```

### With Late Penalty (5%)

```
┌─────────────────────────────────────────┐
│  Milestone 1 (1 day late)               │
│                                         │
│  Original: 270 IDRX                     │
│  Penalty: 13.5 IDRX (5%)                │
│  ─────────────────────                  │
│  Reduced: 256.5 IDRX                    │
│                                         │
│  DISTRIBUTION:                          │
│  Freelancer: 256.5 IDRX                 │
│  Creator: 13.5 IDRX (penalty)           │
└─────────────────────────────────────────┘
```

---

## 10. Quick Reference Commands

### For Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run build
npm run build

# Run tests
npm test
```

### For Smart Contract Testing

```bash
cd ../BaseHackathon

# Run all tests (71 test cases)
forge test -vv

# Run specific test
forge test --match-test testHappyPath -vvvv

# Deploy to Base Sepolia
forge script script/Deploy.s.s:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## Summary Checklist

Use this checklist to verify all functionality:

### PO (Project Owner) Flow
- [ ] Create project with 3+ milestones
- [ ] Last milestone >= 10% (for yield)
- [ ] Review freelancer applications
- [ ] Accept freelancer applicant
- [ ] Deposit funds (splits 90:10)
- [ ] Receive milestone submission
- [ ] Accept milestone (checks for penalty)
- [ ] See yield distribution on last milestone
- [ ] Cancel project (if needed)
- [ ] View portfolio of completed projects

### FL (Freelancer) Flow
- [ ] Browse available jobs
- [ ] Apply to project
- [ ] Get accepted by PO
- [ ] Submit milestone
- [ ] See late penalty warning (if applicable)
- [ ] Withdraw milestone payment
- [ ] See 100% of vault (non-last milestones)
- [ ] See yield share (last milestone only)
- [ ] View portfolio of completed work
- [ ] Track active yield generation

### Common Both Flows
- [ ] Connect wallet (Base Sepolia)
- [ ] Get IDRX tokens from faucet
- [ ] Approve token spend
- [ ] Confirm transaction in wallet
- [ ] View transaction confirmations
- [ ] Check yield percentages live

---

## Troubleshooting

### Issue: "Transaction reverted"

**Causes:**
- Not enough token balance
- Not approved token spend
- Already applied to project
- Not project creator/owner
- Milestone already withdrawn

**Solution:**
1. Check error message in toast
2. Verify wallet has enough IDRX
3. Approve token spend first
4. Check if action already completed

### Issue: "Wrong network"

**Solution:**
1. Open wallet
2. Switch to Base Sepolia (chainId: 84532)
3. Refresh page

### Issue: "Can't see projects"

**Causes:**
- No projects created yet
- Wrong account connected
- Not on Base Sepolia

**Solution:**
1. Create a project first
2. Check connected address
3. Verify network

---

## Next Steps

1. ✅ Complete all happy path tests
2. ✅ Test late submission scenarios
3. ✅ Test cancellation scenarios
4. ✅ Verify yield calculations
5. ✅ Check all status badges
6. ⬜ Add on-chain profile/reviews
7. ⬜ Implement notifications
8. ⬜ Add skill-based filtering
9. ⬜ Deploy to production

---

## Questions?

- **Smart Contracts:** See `../BaseHackathon/REMIX_DEMO_GUIDE.md`
- **API Integration:** See `FE_API_INTEGRATION_GUIDE.md`
- **Contract Addresses:** See `lib/contract-adapter.ts`
- **Issues:** Create GitHub issue or contact dev team
