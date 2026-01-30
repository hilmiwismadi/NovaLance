# NovaLance FE - BE Integration Guide

This document provides a comprehensive guide for integrating the NovaLance Backend API with the Frontend application.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.novalance.com/api
```

## Authentication Flow

All endpoints (except `/api/auth/*`) require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

### Authentication Steps

1. **Get Nonce**
   ```http
   POST /api/auth/wallet/nonce
   Content-Type: application/json

   {
     "address": "0x..."
   }

   Response:
   {
     "nonce": "random-string",
     "message": "Sign this message to verify your wallet..."
   }
   ```

2. **User Signs Message** (Client-side wallet interaction)

3. **Verify & Get Token**
   ```http
   POST /api/auth/wallet/verify
   Content-Type: application/json

   {
     "address": "0x...",
     "signature": "0x..."
   }

   Response:
   {
     "token": "jwt-token",
     "address": "0x..."
   }
   ```

4. **Include token in subsequent requests**

---

## API Endpoints by Page/Feature

### PO (Project Owner) Pages

#### Dashboard - `/PO`

**Active Projects Overview:**
```http
GET /api/projects?status=in_progress&status=hiring
Authorization: Bearer <token>

Response:
[
  {
    "id": "project-id",
    "title": "Project Title",
    "description": "...",
    "status": "in-progress",
    "totalBudget": "100000000",
    "currency": "IDRX",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-03-01T00:00:00Z",
    "roles": [...]
  }
]
```

**Project Progress:**
```http
GET /api/projects/:id/progress
Authorization: Bearer <token>

Response:
{
  "projectId": "project-id",
  "totalKPIs": 10,
  "completedKPIs": 4,
  "progressPercentage": 40,
  "roles": [
    {
      "roleId": "role-id",
      "roleTitle": "Frontend Developer",
      "totalKPIs": 5,
      "completedKPIs": 2,
      "assignedTo": "0x..."
    }
  ]
}
```

**Yield Performance (from Smart Contract):**
```http
GET /api/contracts/vault/:vaultAddress/balance

Response:
{
  "vaultAddress": "0x...",
  "totalBalance": "100000000",
  "escrowed": "90000000",
  "inLP": "10000000",
  "yieldGenerated": "500000"
}
```

#### Projects List - `/PO/projects`

**List All Projects (filtered by owner):**
```http
GET /api/projects?status=draft&status=hiring&status=in_progress&status=completed
Authorization: Bearer <token>

Query Parameters:
- search: string (search in title/description)
- status: draft | open | in_progress | completed | cancelled
- limit: number (default 20)
- offset: number (for pagination)

Response:
{
  "projects": [...],
  "total": 10,
  "limit": 20,
  "offset": 0
}
```

#### Project Detail - `/PO/projects/[id]`

**Get Project Details:**
```http
GET /api/projects/:id
Authorization: Bearer <token>

Response:
{
  "id": "project-id",
  "owner": "0x...",
  "title": "Project Title",
  "description": "...",
  "status": "hiring",
  "currency": "IDRX",
  "totalBudget": "100000000",
  "timelineStart": "2025-01-01T00:00:00Z",
  "timelineEnd": "2025-03-01T00:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z",
  "roles": [
    {
      "id": "role-id",
      "projectId": "project-id",
      "name": "Frontend Developer",
      "description": "...",
      "budget": "50000000",
      "currency": "IDRX",
      "kpiCount": 5,
      "paymentPerKpi": "10000000",
      "skills": ["React", "TypeScript"],
      "status": "hiring",
      "assignedTo": null,
      "kpis": []
    }
  ]
}
```

**Get Project Roles:**
```http
GET /api/projects/:id/roles
Authorization: Bearer <token>
```

**Get Role KPIs:**
```http
GET /api/projects/:id/roles/:roleId/kpis
Authorization: Bearer <token>

Response:
{
  "roleId": "role-id",
  "kpis": [
    {
      "id": "kpi-id",
      "kpiNumber": 1,
      "name": "Setup & Wallet Connection",
      "description": "...",
      "percentage": 20,
      "deadline": "2025-01-15T00:00:00Z",
      "status": "pending",
      "submissionData": null,
      "submissionDate": null
    }
  ]
}
```

**Deposit to Escrow (Generate Calldata):**
```http
POST /api/contracts/calldata/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "vaultAddress": "0x...",
  "amount": "10000000"
}

Response:
{
  "to": "0x...",
  "data": "0x...",
  "value": "10000000"
}
```

**Approve KPI:**
```http
POST /api/kpis/:kpiId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Great work!"
}

Response:
{
  "success": true,
  "kpiId": "kpi-id",
  "status": "approved"
}
```

**Cancel Project:**
```http
POST /api/projects/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Project requirements changed"
}

Response:
{
  "success": true,
  "refundAmount": "90000000",
  "cancellationStatus": "pending_confirmation"
}
```

**Get Cancellation Status:**
```http
GET /api/projects/:id/cancellation-status
Authorization: Bearer <token>
```

#### Applications - `/PO/projects/[id]/applications`

**Get Applicants for Role:**
```http
GET /api/applications/role/:roleId
Authorization: Bearer <token>

Response:
[
  {
    "id": "app-id",
    "roleId": "role-id",
    "applicantAddress": "0x...",
    "coverLetter": "...",
    "status": "pending",
    "appliedAt": "2025-01-01T00:00:00Z",
    "applicant": {
      "address": "0x...",
      "ens": "username.eth",
      "bio": "...",
      "githubUrl": "https://github.com/...",
      "linkedinUrl": "https://linkedin.com/in/...",
      "completedProjects": 5
    }
  }
]
```

**Accept Application:**
```http
POST /api/applications/:id/accept
Authorization: Bearer <token>

Response:
{
  "success": true,
  "assignmentId": "assignment-id",
  "roleId": "role-id",
  "freelancerAddress": "0x..."
}
```

**Reject Application:**
```http
POST /api/applications/:id/reject
Authorization: Bearer <token>

Response:
{
  "success": true,
  "applicationId": "app-id",
  "status": "rejected"
}
```

#### Create Project - `/PO/create-project`

**Create New Project:**
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Build DEX Frontend",
  "description": "Need a frontend for a DEX...",
  "timelineStart": "2025-02-01T00:00:00Z",
  "timelineEnd": "2025-04-01T00:00:00Z",
  "currency": "IDRX"
}

Response:
{
  "id": "new-project-id",
  "owner": "0x...",
  "title": "Build DEX Frontend",
  "status": "draft",
  ...
}
```

**Add Role to Project:**
```http
POST /api/projects/:id/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Frontend Developer",
  "description": "Build React UI...",
  "kpiCount": 5,
  "paymentPerKpi": "10000000",
  "skills": ["React", "TypeScript", "Tailwind"]
}

Response:
{
  "id": "new-role-id",
  "projectId": "project-id",
  "name": "Frontend Developer",
  ...
}
```

**Create KPIs for Role:**
```http
POST /api/projects/:id/roles/:roleId/kpis
Authorization: Bearer <token>
Content-Type: application/json

{
  "kpis": [
    {
      "kpiNumber": 1,
      "name": "Design Mockups",
      "description": "Create Figma designs...",
      "percentage": 20,
      "deadline": "2025-02-15T00:00:00Z"
    },
    {
      "kpiNumber": 2,
      "name": "Setup Project",
      "description": "Initialize Next.js...",
      "percentage": 20,
      "deadline": "2025-02-22T00:00:00Z"
    }
  ]
}

Response:
{
  "created": 2,
  "kpis": [...]
}
```

**Update Role:**
```http
PUT /api/projects/:id/roles/:roleId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Senior Frontend Developer",
  "description": "Updated description...",
  "budget": "60000000",
  "skills": ["React", "TypeScript", "Next.js"]
}
```

**Delete Role:**
```http
DELETE /api/projects/:id/roles/:roleId
Authorization: Bearer <token>
```

#### Profile - `/PO/profile`

**Get Current User Profile:**
```http
GET /api/users/me
Authorization: Bearer <token>

Response:
{
  "address": "0x...",
  "ens": "username.eth",
  "email": "user@example.com",
  "bio": "Web3 developer...",
  "githubUrl": "https://github.com/...",
  "linkedinUrl": "https://linkedin.com/in/...",
  "completedProjects": 5,
  "reviewCount": 12,
  "memberSince": "2024-01-01"
}
```

**Update Profile:**
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "githubUrl": "https://github.com/...",
  "linkedinUrl": "https://linkedin.com/in/...",
  "bio": "Updated bio..."
}

Response:
{
  "success": true,
  "user": {...}
}
```

**Get Public User Profile:**
```http
GET /api/users/:address

Response:
{
  "address": "0x...",
  "ens": "username.eth",
  "bio": "...",
  "completedProjects": 5,
  "reviewCount": 12,
  "memberSince": "2024-01-01"
  // Note: Does not include private info like email
}
```

#### Portfolio - `/PO/portfolio`

**Get Portfolio (Completed Work):**
```http
GET /api/users/me/portfolio
Authorization: Bearer <token>

Response:
[
  {
    "projectId": "project-id",
    "projectTitle": "DeFi Platform",
    "roleTitle": "Frontend Developer",
    "completedAt": "2025-01-15T00:00:00Z",
    "totalEarned": "50000000",
    "kpiCount": 5,
    "rating": 4.8
  }
]
```

**Get Vault Balance (Smart Contract Bridge):**
```http
GET /api/contracts/vault/:vaultAddress/balance

Response:
{
  "vaultAddress": "0x...",
  "totalBalance": "100000000",
  "escrowed": "90000000",
  "inLP": "10000000",
  "yieldGenerated": "500000"
}
```

**Get KPI Status from Vault:**
```http
GET /api/contracts/vault/:vaultAddress/kpi/:index

Response:
{
  "vaultAddress": "0x...",
  "kpiIndex": 0,
  "status": "approved",
  "amount": "10000000",
  "yieldAmount": "500000"
}
```

**Get Project Info from Vault:**
```http
GET /api/contracts/vault/:vaultAddress/info

Response:
{
  "vaultAddress": "0x...",
  "projectOwner": "0x...",
  "totalBudget": "100000000",
  "status": "active",
  "kpiCount": 5
}
```

**Note:** Withdraw functionality is Smart Contract only. Generate calldata using `/api/contracts/calldata/withdraw` (if available) or call SC directly.

---

### FL (Freelancer) Pages

#### Dashboard - `/FL`

**Active Assignments:**
```http
GET /api/users/me/assignments
Authorization: Bearer <token>

Response:
[
  {
    "assignmentId": "assignment-id",
    "projectId": "project-id",
    "projectTitle": "DeFi Platform",
    "roleId": "role-id",
    "roleTitle": "Frontend Developer",
    "status": "in_progress",
    "budget": "50000000",
    "completedKPIs": 2,
    "totalKPIs": 5
  }
]
```

**My Applications:**
```http
GET /api/applications/my
Authorization: Bearer <token>

Response:
[
  {
    "id": "app-id",
    "projectId": "project-id",
    "projectTitle": "DeFi Platform",
    "roleId": "role-id",
    "roleTitle": "Frontend Developer",
    "coverLetter": "...",
    "status": "pending",
    "appliedAt": "2025-01-01T00:00:00Z"
  }
]
```

**Portfolio (Completed Work):**
```http
GET /api/users/me/portfolio
Authorization: Bearer <token>
```

#### Browse Jobs - `/FL/jobs`

**List Available Jobs:**
```http
GET /api/projects?status=open
Authorization: Bearer <token>

Query Parameters:
- search: string
- status: open (for hiring)
- limit: number
- offset: number

Response:
{
  "projects": [
    {
      "id": "project-id",
      "title": "Build DEX Frontend",
      "description": "...",
      "status": "hiring",
      "totalBudget": "100000000",
      "currency": "IDRX",
      "roles": [
        {
          "id": "role-id",
          "name": "Frontend Developer",
          "description": "...",
          "budget": "50000000",
          "skills": ["React", "TypeScript"],
          "kpiCount": 5
        }
      ]
    }
  ],
  "total": 10
}
```

**⚠️ MISSING ENDPOINT:** Skill-based filtering
```http
// NOT AVAILABLE - Need to add this endpoint
GET /api/projects?skills=React&skills=TypeScript

// Workaround: Filter on frontend after fetching all projects
```

#### Jobs Detail - `/FL/jobs/[id]`

**Get Job (Project) Details:**
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

**Get Role KPIs:**
```http
GET /api/projects/:id/roles/:roleId/kpis
Authorization: Bearer <token>
```

**Apply for Job (Role):**
```http
POST /api/applications?roleId=role-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I have 5 years of experience..."
}

Response:
{
  "success": true,
  "applicationId": "new-app-id",
  "status": "pending"
}
```

#### Active Jobs - `/FL/active-jobs`

**My Active Assignments:**
```http
GET /api/users/me/assignments
Authorization: Bearer <token>
```

**Submit KPI:**
```http
POST /api/kpis/:kpiId/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "submissionData": "Links to PR, demo, etc."
}

Response:
{
  "success": true,
  "kpiId": "kpi-id",
  "status": "completed",
  "submittedAt": "2025-01-15T10:00:00Z"
}
```

**Confirm KPI (FL Approval - Multi-sig):**
```http
POST /api/kpis/:kpiId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Looks good!"
}

Response:
{
  "success": true,
  "kpiId": "kpi-id",
  "status": "approved"
}
```

**Note:** Both PO and FL must approve before payment release.

#### Applications - `/FL/applications`

**My Applications:**
```http
GET /api/applications/my
Authorization: Bearer <token>
```

**Filter by Status:**
```http
// Filter on frontend after fetching
// Or add query parameter if BE supports it
GET /api/applications/my?status=pending
```

#### Profile - `/FL/profile`

**Get My Profile:**
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Update My Profile:**
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "...",
  "githubUrl": "...",
  "linkedinUrl": "...",
  "bio": "..."
}
```

**Get On-Chain CV (Portfolio):**
```http
GET /api/users/me/portfolio
Authorization: Bearer <token>
```

**⚠️ MISSING:** Withdraw Earnings endpoint
```http
// NOT AVAILABLE - Withdraw is Smart Contract only
// FE should call SC directly or use calldata generation

// Smart Contract Call:
await vaultContract.withdrawYield(kpiIndex);
```

---

## Missing Endpoints Request

### High Priority

1. **Skill-Based Job Filtering**
   ```http
   GET /api/projects?skills=React&skills=TypeScript&status=open

   Response:
   {
     "projects": [...] // filtered by skills
   }
   ```

2. **Earnings Summary**
   ```http
   GET /api/users/me/earnings

   Response:
   {
     "totalEarned": "50000000",
     "pendingEarnings": "30000000",
     "withdrawableYield": "1500000",
     "currency": "IDRX"
   }
   ```

### Medium Priority

3. **Yield History**
   ```http
   GET /api/users/me/yield-history?limit=30&offset=0

   Response:
   {
     "history": [
       {
         "date": "2025-01-15",
         "kpiId": "kpi-id",
         "projectTitle": "...",
         "yieldAmount": "50000",
         "yieldRate": 11.44
       }
     ]
   }
   ```

4. **Reviews Endpoint**
   ```http
   POST /api/users/:address/reviews
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "projectId": "project-id",
     "roleId": "role-id",
     "rating": 5,
     "comment": "Great work!"
   }
   ```

---

## Smart Contract Integration

The following features require direct Smart Contract interactions:

1. **Deposit Funds**
   - Generate calldata: `POST /api/contracts/calldata/deposit`
   - Execute via wallet

2. **Withdraw Yields**
   - Call vault contract directly
   - Or implement calldata endpoint

3. **Real-time Yield Data**
   - Poll vault contract for latest APY
   - BE endpoint provides cached data

---

## Data Models

### Project
```typescript
interface Project {
  id: string;
  owner: string; // wallet address
  title: string;
  description: string;
  status: 'draft' | 'hiring' | 'in-progress' | 'completed' | 'cancelled';
  currency: string; // IDRX, USDC, etc.
  totalBudget: string; // in smallest unit (wei for IDRX)
  timelineStart: string; // ISO datetime
  timelineEnd: string; // ISO datetime
  createdAt: string;
  roles: Role[];
}
```

### Role
```typescript
interface Role {
  id: string;
  projectId: string;
  name: string;
  description: string;
  budget: string;
  currency: string;
  kpiCount: number;
  paymentPerKpi: string;
  skills: string[];
  status: 'hiring' | 'in-progress' | 'completed';
  assignedTo: string | null; // wallet address
  kpis: KPI[];
}
```

### KPI
```typescript
interface KPI {
  id: string;
  roleId: string;
  kpiNumber: number;
  name: string;
  description: string;
  percentage: number; // 1-100
  deadline: string; // ISO datetime
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  submissionData: string | null;
  submissionDate: string | null;
}
```

### Application
```typescript
interface Application {
  id: string;
  roleId: string;
  applicantAddress: string;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  applicant?: {
    address: string;
    ens?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    completedProjects: number;
  };
}
```

### User
```typescript
interface User {
  address: string;
  ens?: string;
  email?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  completedProjects: number;
  reviewCount: number;
  memberSince: string;
}
```

---

## Currency Handling

All amounts are returned as strings in the smallest unit:
- **IDRX**: 1 IDRX = 1,000,000 units (6 decimals)
- **USDC**: 1 USDC = 1,000,000 units (6 decimals)

To display:
```typescript
function formatCurrency(amount: string, currency: string): string {
  const num = Number(amount) / 1_000_000;
  return `${num.toLocaleString()} ${currency}`;
}
```

---

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not owner, wrong role)
- `404` - Not Found
- `500` - Server Error

---

## Testing

Use the provided Postman collection:
```bash
docs/postman-collection.json
```

Import into Postman to test all endpoints.

---

## Next Steps for Backend Team

1. **Implement Skill Filtering**
   - Add `GET /api/projects?skills=` endpoint
   - Or add skills filtering to existing projects endpoint

2. **Add Earnings Summary**
   - Implement `GET /api/users/me/earnings`
   - Calculate from completed assignments

3. **Yield History**
   - Implement `GET /api/users/me/yield-history`
   - Track yield earnings over time

4. **Reviews System** (if needed)
   - Add reviews table to schema
   - Implement CRUD for reviews

5. **Notifications** (if needed)
   - Add notifications table
   - Implement notification endpoints

---

## Questions?

Contact the Frontend team or create an issue in the repository.
