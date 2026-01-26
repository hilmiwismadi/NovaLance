# NovaLance — Project Context (Source-Aligned)

## 1. Definitions & Roles

- **PO (Project Owner)**  
  Party that creates projects, defines job requirements, sets KPIs, deposits funds, and approves milestones.

- **FL (Freelancer)**  
  Developer who applies to jobs, completes KPI-based tasks, and withdraws funds when allowed.

- **AV / DW3 (Platform / Web3 Team)**  
  Platform operator responsible for smart contract logic, LP integration, and yield distribution.

- **FD (Further Development)**  
  Features planned beyond MVP / hackathon scope.

---

## 2. Core Financial Flow (PO Funds Lifecycle)

### 2.1 User Entry

1. User enters the platform.
2. User connects wallet.
3. Wallet must hold **IDRX**.
4. Platform checks available balance based on IDRX amount.

---

### 2.2 Project & KPI Setup

1. PO creates a project.
2. PO defines job details:
   - Requirements
   - Timeline
3. Project can contain multiple KPIs.
   - Example:
     - Total KPIs: 3
     - KPI #1 deposit: IDRX 20,000,000
     - Timeline: 2 months

---

### 2.3 Vault & LP Allocation

1. KPI deposit enters **NovaLance Vault (smart contract)**.
2. Smart contract automatically splits funds:
   - **90%** → Vault (escrow for freelancer payment)
   - **10%** → LP allocation
3. LP allocation options:
   - AAVE
   - Nusa Finance
   - Morpho
4. LP routing may involve **LayerZero**.
5. Smart contract applies LP filters:
   - Example: deploy only if APY ≥ 5%.

---

## 3. KPI Completion & Yield Logic

### 3.1 KPI Approval

- KPI completion requires approval from:
  - PO
  - FL
- Approval is handled via:
  - Multi-signature logic (PO + FL)

---

### 3.2 Yield Profit Scenario

- LP allocation example:
  - Initial LP: 2,000,000
  - Final LP: 2,200,000
  - Profit: 200,000

#### Yield Distribution

- 40% → PO (80,000)
- 40% → FL (80,000)
- 20% → AV / DW3 (40,000)

#### Result

- FL withdraws:
  - Core payment + yield adjustment
- PO:
  - No loss on principal
- Platform:
  - Receives protocol revenue from yield

---

### 3.3 Yield Loss Scenario

- LP result:
  - Initial: 2,000,000
  - Final: 1,800,000

#### Rules

- Project completed:
  - PO: no loss, no gain
  - FL: yield deduction applied
- Project cancelled:
  - Handled by cancellation rules

---

## 4. Withdrawal Model

- Platform **does not auto-transfer funds**.
- Platform:
  - Calculates split logic
  - Displays **withdrawable amount** on FE
- Users manually withdraw funds from smart contract.

---

## 5. Main User Flow

### 5.1 PO Flow

1. Login & wallet connect.
2. Post job:
   - Job description
   - Requirements
   - Timeline
3. Set KPI structure:
   - Termin count
   - Deposit amount per KPI
4. Select freelancer(s).
5. Monitor progress.
6. Approve or cancel KPI.

---

### 5.2 Freelancer Flow

1. Login & wallet connect.
2. Browse and apply for jobs.
3. Submit required profiles:
   - GitHub
   - LinkedIn
   - Past projects (on-platform)
4. Complete assigned KPIs.
5. Withdraw funds when allowed.

---

## 6. Cancellation & Fault Rules

### 6.1 Developer Fault

- Work not completed but marked done:
  - PO rejects
  - Work must be repeated
- Developer exits early:
  - Penalty applied (% per day, set by PO)

---

### 6.2 PO Fault

- PO delays approval beyond X days:
  - Auto-allow withdrawal
- PO rejects completed work:
  - Freelancer not required to continue

---

### 6.3 Project Cancellation

- Cancel before termin completion:
  - 90% Vault → refund to PO
  - 10% LP → platform
- Cancel after some termins:
  - Completed termins → FL
  - Remaining vault → PO
  - LP portion → platform

---

## 7. Smart Contract Scope (MVP)

- Mock IDRX
- Vault contract
- 90 : 10 split logic
- LP integration
- Fixed milestone & termin checkpoints
- Multi-sig approval (PO + FL)
- Withdrawal request logic
- Yield distribution (+ / -)
- Late penalties
- Cancellation logic
- Event emission for BE indexing

---

## 8. Backend Scope

- Authentication & user management
- Project management
- Multi-role projects
- KPI & milestone management
- Freelancer application flow
- Deposit management
- Settlement & distribution logic
- Withdrawal system
- Portfolio & reputation
- Smart contract integration
- Database & indexing

---

## 9. Business Scope

- Escrow logic definition
- PO & FL fault rules
- Yield fairness rules
- Cancellation flow definition
- Ecosystem narrative:
  - IDRX
  - LayerZero
  - Nusa Finance
- Hackathon deliverables:
  - Pitch deck
  - Demo video
  - Flow script

---

## 10. Frontend Scope

### PO Flow

- Login & wallet connect
- Post jobs
- Set job description
- Set timeline
- Set KPI termin
- Select freelancer
- Monitor progress
- Approve / cancel KPI
- Profile
- Off-chain data update
- On-chain data display

---

### FL Flow

- Login & wallet connect
- Search & apply jobs
- View requirements
- Profile
- Off-chain data update
- On-chain data display
- Withdraw funds

---

## End of Context
