// User types
export interface UserProfile {
  address: string;
  ens?: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  bio?: string;
  skills: string[];
  reviewCount: number;
  memberSince: string;
  completedProjects: number;
  managedProjects: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserStats {
  projectsOwned: number;
  applicationsSubmitted: number;
  assignmentsActive: number;
}

// Project types
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type RoleStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export interface ProjectRole {
  id: string;
  name: string;
  description: string;
  kpiCount: number;
  paymentPerKpi: string;
  skills?: string[];
  status: RoleStatus;
}

export interface Project {
  id: string;
  ownerAddress: string;
  title: string;
  description: string;
  timelineStart: string;
  timelineEnd: string;
  status: ProjectStatus;
  vaultAddress?: string;
  owner?: {
    address: string;
    bio?: string;
  };
  roles: ProjectRole[];
}

// Application types
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  projectRoleId: string;
  freelancerAddress: string;
  status: ApplicationStatus;
  coverLetter?: string;
  createdAt: string;
  projectRole: {
    id: string;
    name: string;
    description: string;
    kpiCount: number;
    paymentPerKpi: string;
    skills?: string[];
    status: RoleStatus;
    project: {
      id: string;
      title: string;
      description: string;
      timelineStart: string;
      timelineEnd: string;
      status: ProjectStatus;
      vaultAddress?: string;
      ownerAddress: string;
    };
  };
}

// KPI types
export type KpiStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'disputed' | 'paid' | 'cancelled';

export interface Kpi {
  id: string;
  projectRoleId: string;
  kpiNumber: number;
  description: string;
  deadline: string;
  amount: string;
  status: KpiStatus;
  submittedAt?: string;
  reviewedAt?: string;
  submissionData?: string;
  reviewComment?: string;
}

// Auth types
export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface VerifyResponse {
  token: string;
  address: string;
}

// Balance types
export interface FreelancerBalance {
  availableBalance: string;
  pendingKpis: number;
  approvedKpis: number;
  totalEarned: string;
}

export interface ProjectBalance {
  projectId: string;
  projectTitle: string;
  vaultAddress: string;
  deposited: string;
  spent: string;
  pending: string;
  remaining: string;
}

export interface ProjectBalancesResponse {
  projects: ProjectBalance[];
  totals: {
    deposited: string;
    spent: string;
    pending: string;
    remaining: string;
  };
}
