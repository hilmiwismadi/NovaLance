# NovaLance Architecture

## Overview

High-level architecture diagram showing responsibilities, dependencies, and handoffs between the 4 core roles in the NovaLance platform.

## Architecture Diagram

```mermaid
graph TB
    subgraph BUSINESS["BUSINESS (Product Owner)"]
        B1["Financial Logic & Money Flow"]
        B2["KPI Payment Rules"]
        B3["LP Yield Split (40% PO / 40% FL / 20% Platform)"]
        B4["Functional Flow Requirements"]
        B5["USP: KPI Escrow + LP Yield Sharing"]
    end

    subgraph FE["FRONTEND (Web2 App)"]
        FE1["Wallet Connect"]
        FE2["Job Creation UI"]
        FE3["KPI Deposit UI"]
        FE4["KPI Approval UI"]
        FE5["Withdrawal UI (Display Balance)"]
        FE6["User Flows & Screens"]
    end

    subgraph BE["BACKEND"]
        BE1["Authentication & Identity"]
        BE2["Job & KPI Data Model"]
        BE3["Application & Matching"]
        BE4["REST APIs"]
        BE5["Off-chain Approval Logic"]
        BE6["Smart Contract Event Indexing"]
    end

    subgraph SC["SMART CONTRACT"]
        SC1["Vault & Escrow"]
        SC2["KPI Fund Locking"]
        SC3["LP Allocation (10%)"]
        SC4["Yield Calculation"]
        SC5["Yield Distribution"]
        SC6["Withdrawable Balance State"]
        SC7["Event Emission"]
    end

    %% Business defines requirements
    B1 -->|"defines"| SC2
    B1 -->|"defines"| SC3
    B2 -->|"defines"| SC5
    B3 -->|"defines"| SC5
    B4 -->|"declares"| FE6
    B4 -->|"declares"| BE2

    %% FE dependencies
    FE6 -.->|"depends on"| B4
    FE1 -.->|"read/write"| SC6
    FE2 -.->|"consumes"| BE4
    FE3 -.->|"consumes"| BE4
    FE4 -.->|"consumes"| BE4
    FE5 -.->|"read"| SC6

    %% BE dependencies
    BE2 -.->|"depends on"| B4
    BE4 -.->|"consumes"| SC7
    BE6 -.->|"indexes"| SC7

    %% SC dependency
    SC2 -.->|"implements"| B1
    SC3 -.->|"implements"| B1
    SC4 -.->|"implements"| B3
    SC5 -.->|"implements"| B3
```

## Legend

| Arrow Type | Meaning |
|------------|---------|
| `-->` | Defines / Declares (solid) |
| `-.->` | Depends on / Consumes (dashed) |

## Role Responsibilities

### BUSINESS
- Owns financial logic and money flow decisions
- Defines KPI-based payment logic
- Defines LP yield split logic
- Declares functional flow requirements

### FRONTEND
- Wallet connect
- Job creation UI
- KPI deposit UI
- KPI approval UI
- Withdrawal UI

### BACKEND
- Authentication & identity
- Job & KPI data model
- Application & matching logic
- REST APIs
- Smart contract event indexing

### SMART CONTRACT
- Vault & escrow logic
- KPI fund locking
- LP allocation (10%)
- Yield calculation & distribution
- Withdrawable balance state
- Event emission

---

## Application Flow Sequences

### 1. Job Creation & KPI Deposit Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant SC as Smart Contract

    FE->>BE: POST /api/jobs (create job with KPIs)
    BE->>DB: Store job & KPI data
    DB-->>BE: Job created
    BE-->>FE: Return job ID

    Note over FE: User initiates deposit

    FE->>SC: depositKPI(jobId, amount)
    SC->>SC: Split funds (90% escrow, 10% LP)
    SC->>SC: Allocate LP to Nusa Finance
    SC->>SC: Emit KPIDeposited event
    SC-->>FE: Transaction success

    Note over SC: LP Yield grows over time

    FE->>BE: POST /api/jobs/{id}/confirm-deposit
    BE->>DB: Update KPI status to "funded"
    DB-->>BE: Updated
    BE-->>FE: Deposit confirmed
```

### 2. Freelancer Application & Matching Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant SC as Smart Contract

    FE->>BE: GET /api/jobs (browse jobs)
    BE->>DB: Query available jobs
    DB-->>BE: Job list
    BE-->>FE: Return jobs

    Note over FE: Freelancer applies to job

    FE->>BE: POST /api/applications
    BE->>DB: Store application
    DB-->>BE: Application created
    BE-->>FE: Application submitted

    Note over FE: PO reviews applications

    FE->>BE: POST /api/applications/{id}/approve
    BE->>DB: Update application status
    BE->>SC: linkFreelancer(jobId, freelancerAddress)
    SC->>SC: Store freelancer mapping
    SC->>SC: Emit FreelancerAssigned event
    SC-->>BE: Transaction success
    BE->>DB: Update job status to "active"
    BE-->>FE: Freelancer assigned
```

### 3. KPI Approval & Yield Distribution Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant SC as Smart Contract

    Note over FE: KPI timeline ends

    FE->>BE: GET /api/kpis/{id}/status
    BE->>DB: Query KPI status
    DB-->>BE: Return status
    BE-->>FE: Status: pending_approval

    Note over FE: PO approves KPI

    FE->>BE: POST /api/kpis/{id}/approve-by-PO
    BE->>DB: Store PO approval
    DB-->>BE: Approval recorded
    BE-->>FE: Approval recorded

    Note over FE: Freelancer approves KPI

    FE->>BE: POST /api/kpis/{id}/approve-by-FL
    BE->>DB: Store FL approval
    DB-->>BE: Both approvals confirmed

    Note over BE: Trigger smart contract

    BE->>SC: approveKPI(kpiId)
    SC->>SC: Fetch final LP value
    SC->>SC: Calculate yield (profit/loss)
    SC->>SC: Distribute yield (40% PO, 40% FL, 20% Platform)
    SC->>SC: Update withdrawable balances
    SC->>SC: Emit KPIApproved event
    SC-->>BE: Transaction success
    BE->>DB: Update KPI status to "completed"
    BE-->>FE: KPI approved & yield distributed
```

### 4. Withdrawal Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant SC as Smart Contract

    FE->>SC: getWithdrawableBalance(userAddress)
    SC-->>FE: Return balance (escrow + yield share)

    Note over FE: Display withdrawable amount

    FE->>BE: GET /api/withdrawals/history
    BE->>DB: Query withdrawal history
    DB-->>BE: Return history
    BE-->>FE: Display history

    Note over FE: User initiates withdrawal

    FE->>SC: withdraw()
    SC->>SC: Verify balance
    SC->>SC: Transfer funds to wallet
    SC->>SC: Emit Withdrawal event
    SC-->>FE: Transaction success

    FE->>BE: POST /api/withdrawals/sync
    BE->>DB: Store withdrawal record
    DB-->>BE: Recorded
    BE-->>FE: Sync complete
```

### Flow Summary

| Flow | Key Actions | Smart Contract Events |
|------|-------------|----------------------|
| Job Creation | Create job, deposit KPI funds | `KPIDeposited` |
| Application | Apply, approve, link freelancer | `FreelancerAssigned` |
| KPI Approval | Mutual approval, yield distribution | `KPIApproved` |
| Withdrawal | Display balance, withdraw funds | `Withdrawal` |
