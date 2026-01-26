// Mock data for NovaLance frontend

export type KPIStatus = 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected';

// KPI - Key Performance Indicator (milestone with % and deadline)
export interface KPI {
  id: string;
  name: string;
  percentage: number; // % of role budget
  description?: string;
  status: KPIStatus;
  deadline?: string; // ISO date string
  completedAt?: string;
  yield?: number; // Yield percentage (-5 to 15), e.g., 11.44 for 11.44%
}

// RoleInProject - A specific role within a project (e.g., FE, BE, Designer)
export interface RoleInProject {
  id: string;
  title: string; // e.g., "Frontend Developer"
  description: string; // Role requirements
  skills: string[]; // Required skills
  budget: number; // Budget for this role
  currency: string;
  kpis: KPI[]; // KPIs for this role
  assignedTo?: string; // Freelancer address (when hired)
  assignedToEns?: string;
  status: 'hiring' | 'in-progress' | 'completed';
}

export type ProjectStatus = 'draft' | 'hiring' | 'in-progress' | 'completed' | 'cancelled';

// Project - The main project containing multiple roles
export interface POProject {
  id: string;
  title: string;
  description: string;
  features?: string[]; // List of features
  totalBudget: number; // Sum of all role budgets
  currency: string;
  roles: RoleInProject[]; // Multiple roles
  owner: string;
  ownerEns?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Legacy types for backward compatibility
export type MilestoneStatus = KPIStatus;

export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  status: MilestoneStatus;
  description?: string;
}

export type JobStatus = 'hiring' | 'in-progress' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  milestones: Milestone[];
  skills: string[];
  postedBy: string;
  postedByEns?: string;
  status: JobStatus;
  applicantCount: number;
  createdAt?: string;
}

export type ProjectRole = 'owner' | 'freelancer' | 'both';

export interface Project {
  id: string;
  jobId: string;
  title: string;
  description: string;
  totalBudget: number;
  currency: string;
  milestones: Milestone[];
  owner: string;
  ownerEns?: string;
  freelancer?: string;
  freelancerEns?: string;
  userRole: ProjectRole;
  status: JobStatus;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantAddress: string;
  applicantEns?: string;
  coverLetter: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface UserProfile {
  address: string;
  ens?: string;
  reviewCount: number;
  memberSince: string;
  bio?: string;
  skills: string[];
  experience: Experience[];
  completedProjects: number;
  managedProjects: number;
}

export type NotificationType = 'application' | 'milestone' | 'payment' | 'review';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt?: string;
  link?: string;
}

// Current user (mock)
export const mockUser: UserProfile = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  ens: 'alice.eth',
  reviewCount: 24,
  memberSince: 'January 2026',
  bio: 'Full-stack developer specializing in Web3 and DeFi applications.',
  skills: ['React', 'TypeScript', 'Solidity', 'Tailwind CSS', 'Next.js'],
  experience: [
    {
      id: 'e1',
      company: 'DeFi Protocol Labs',
      role: 'Senior Frontend Developer',
      description: 'Built UI for a decentralized exchange protocol',
      startDate: '2024-06',
      current: true,
    },
    {
      id: 'e2',
      company: 'Web3 Studios',
      role: 'Full Stack Developer',
      description: 'Developed NFT marketplace and wallet integration',
      startDate: '2023-01',
      endDate: '2024-05',
      current: false,
    },
  ],
  completedProjects: 18,
  managedProjects: 12,
};

// Mock jobs
export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer Needed',
    description: 'Looking for a React developer to build a DeFi dashboard with real-time price charts, portfolio tracking, and seamless wallet integration. Experience with Web3 libraries is a plus.',
    budget: 500,
    currency: 'USDC',
    milestones: [
      { id: 'm1', name: 'Figma to HTML', percentage: 30, status: 'pending' },
      { id: 'm2', name: 'React Components', percentage: 40, status: 'pending' },
      { id: 'm3', name: 'Testing & Deploy', percentage: 30, status: 'pending' },
    ],
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    postedBy: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    postedByEns: 'bob.eth',
    status: 'hiring',
    applicantCount: 2,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    title: 'Smart Contract Auditor',
    description: 'Need an experienced smart contract auditor to review our new staking contract. Must have previous audit experience with DeFi protocols.',
    budget: 1500,
    currency: 'USDC',
    milestones: [
      { id: 'm1', name: 'Initial Review', percentage: 40, status: 'pending' },
      { id: 'm2', name: 'Detailed Report', percentage: 60, status: 'pending' },
    ],
    skills: ['Solidity', 'Security', 'Smart Contracts'],
    postedBy: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
    postedByEns: 'defi-project.eth',
    status: 'hiring',
    applicantCount: 5,
    createdAt: '2026-01-14',
  },
  {
    id: '3',
    title: 'NFT Marketplace Backend',
    description: 'Build a GraphQL API for an NFT marketplace. Must handle listing, bidding, and offer functionality with proper indexing.',
    budget: 800,
    currency: 'USDC',
    milestones: [
      { id: 'm1', name: 'API Design', percentage: 25, status: 'pending' },
      { id: 'm2', name: 'Core Endpoints', percentage: 50, status: 'pending' },
      { id: 'm3', name: 'Documentation', percentage: 25, status: 'pending' },
    ],
    skills: ['Node.js', 'GraphQL', 'PostgreSQL', 'Web3.js'],
    postedBy: '0x9876543210987654321098765432109876543210',
    postedByEns: 'nft-collector.eth',
    status: 'hiring',
    applicantCount: 1,
    createdAt: '2026-01-13',
  },
  {
    id: '4',
    title: 'UI/UX Designer for DeFi App',
    description: 'Design a modern, intuitive interface for a DeFi yield aggregator. Must provide Figma designs and design system.',
    budget: 600,
    currency: 'USDC',
    milestones: [
      { id: 'm1', name: 'Wireframes', percentage: 30, status: 'pending' },
      { id: 'm2', name: 'High-Fidelity Mockups', percentage: 50, status: 'pending' },
      { id: 'm3', name: 'Design System', percentage: 20, status: 'pending' },
    ],
    skills: ['Figma', 'UI Design', 'UX Research'],
    postedBy: '0x1111111111111111111111111111111111111111',
    postedByEns: 'yield-farmer.eth',
    status: 'hiring',
    applicantCount: 3,
    createdAt: '2026-01-12',
  },
];

// Mock PO Projects (with hierarchical structure)
export const mockPOProjects: POProject[] = [
  {
    id: 'proj-1',
    title: 'Money Tracker App',
    description: 'Build a comprehensive money tracking application with expense categorization, budget planning, and financial insights dashboard.',
    features: [
      'Expense tracking with categorization',
      'Budget planning and alerts',
      'Financial insights dashboard',
      'Multi-currency support',
      'Export reports (PDF, CSV)',
    ],
    totalBudget: 4000000,
    currency: 'IDRX',
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    status: 'hiring',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    createdAt: '2026-01-25',
    roles: [
      {
        id: 'role-1',
        title: 'Frontend Developer',
        description: 'Build responsive React Native UI with excellent UX. Experience with mobile state management and animations required.',
        skills: ['React Native', 'TypeScript', 'Redux', 'Reanimated', 'Tailwind'],
        budget: 2000000,
        currency: 'IDRX',
        status: 'hiring',
        kpis: [
          {
            id: 'kpi-1-1',
            name: 'Project Setup & Architecture',
            percentage: 20,
            description: 'Setup React Native project, configure navigation, state management, and folder structure',
            status: 'pending',
            deadline: '2026-02-07',
          },
          {
            id: 'kpi-1-2',
            name: 'Core UI Components',
            percentage: 25,
            description: 'Build reusable UI components (buttons, cards, forms, charts)',
            status: 'pending',
            deadline: '2026-02-21',
          },
          {
            id: 'kpi-1-3',
            name: 'Feature Implementation',
            percentage: 35,
            description: 'Implement expense tracking, budget planning, and dashboard features',
            status: 'pending',
            deadline: '2026-03-21',
          },
          {
            id: 'kpi-1-4',
            name: 'Testing & Polish',
            percentage: 20,
            description: 'Unit tests, E2E tests, performance optimization, and bug fixes',
            status: 'pending',
            deadline: '2026-04-14',
          },
        ],
      },
      {
        id: 'role-2',
        title: 'Backend Developer',
        description: 'Build scalable Node.js backend with PostgreSQL. Experience with REST APIs, authentication, and data modeling required.',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'JWT'],
        budget: 2000000,
        currency: 'IDRX',
        status: 'hiring',
        kpis: [
          {
            id: 'kpi-2-1',
            name: 'API Design & Setup',
            percentage: 20,
            description: 'Design database schema, setup Prisma, configure authentication',
            status: 'pending',
            deadline: '2026-02-07',
          },
          {
            id: 'kpi-2-2',
            name: 'Core Endpoints',
            percentage: 30,
            description: 'Implement CRUD operations for transactions, budgets, categories',
            status: 'pending',
            deadline: '2026-02-28',
          },
          {
            id: 'kpi-2-3',
            name: 'Advanced Features',
            percentage: 30,
            description: 'Currency conversion, report generation, analytics endpoints',
            status: 'pending',
            deadline: '2026-03-31',
          },
          {
            id: 'kpi-2-4',
            name: 'Testing & Deployment',
            percentage: 20,
            description: 'API tests, documentation, deployment to production',
            status: 'pending',
            deadline: '2026-04-14',
          },
        ],
      },
    ],
  },
  {
    id: 'proj-2',
    title: 'DeFi Swap Interface',
    description: 'Modern DEX frontend with real-time prices, slippage settings, and transaction history.',
    features: ['Swap interface', 'Price charts', 'Liquidity pools', 'Transaction history'],
    totalBudget: 4500000,
    currency: 'IDRX',
    startDate: '2026-01-15',
    endDate: '2026-03-15',
    status: 'in-progress',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    createdAt: '2026-01-10',
    roles: [
      {
        id: 'role-3',
        title: 'React Developer',
        description: 'Build DeFi swap UI with Web3 integration.',
        skills: ['React', 'TypeScript', 'Ethers.js', 'Wagmi'],
        budget: 4500000,
        currency: 'IDRX',
        status: 'in-progress',
        assignedTo: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        assignedToEns: 'bob.eth',
        kpis: [
          {
            id: 'kpi-3-1',
            name: 'Setup & Wallet Connection',
            percentage: 25,
            description: 'Project setup, wallet connection, basic layout',
            status: 'approved',
            deadline: '2026-01-20',
            completedAt: '2026-01-19',
            yield: 11.44,
          },
          {
            id: 'kpi-3-2',
            name: 'Swap Interface',
            percentage: 40,
            description: 'Build swap form with price estimation and slippage',
            status: 'in-progress',
            deadline: '2026-02-05',
          },
          {
            id: 'kpi-3-3',
            name: 'Charts & History',
            percentage: 35,
            description: 'Price charts and transaction history',
            status: 'pending',
            deadline: '2026-02-20',
          },
        ],
      },
    ],
  },
  {
    id: 'proj-3',
    title: 'AI Automate X402',
    description: 'Build an AI-powered automation platform for smart contract interactions and DeFi operations.',
    features: ['AI-powered automation', 'Smart contract interaction', 'DeFi operations', 'Analytics dashboard'],
    totalBudget: 6000000,
    currency: 'IDRX',
    startDate: '2026-01-10',
    endDate: '2026-04-10',
    status: 'in-progress',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    createdAt: '2026-01-05',
    roles: [
      {
        id: 'role-4',
        title: 'Smart Contract Developer',
        description: 'Develop secure smart contracts for automation and gas optimization.',
        skills: ['Solidity', 'Hardhat', 'Gas Optimization', 'Security'],
        budget: 3500000,
        currency: 'IDRX',
        status: 'in-progress',
        assignedTo: '0x5555555555555555555555555555555555555555',
        assignedToEns: 'carol.eth',
        kpis: [
          {
            id: 'kpi-4-1',
            name: 'Contract Architecture',
            percentage: 20,
            description: 'Design contract architecture and patterns',
            status: 'approved',
            deadline: '2026-01-20',
            completedAt: '2026-01-18',
            yield: -2.31,
          },
          {
            id: 'kpi-4-2',
            name: 'Core Automation Logic',
            percentage: 35,
            description: 'Implement automation engine and transaction batching',
            status: 'approved',
            deadline: '2026-02-10',
            completedAt: '2026-02-08',
            yield: 8.76,
          },
          {
            id: 'kpi-4-3',
            name: 'Configuration',
            percentage: 25,
            description: 'Build configuration interface for users',
            status: 'in-progress',
            deadline: '2026-02-28',
          },
          {
            id: 'kpi-4-4',
            name: 'Security Audit',
            percentage: 20,
            description: 'Security review and testing',
            status: 'pending',
            deadline: '2026-03-15',
          },
        ],
      },
      {
        id: 'role-5',
        title: 'AI/ML Engineer',
        description: 'Develop AI models for predictive analytics and optimization.',
        skills: ['Python', 'TensorFlow', 'Smart Contracts', 'API Design'],
        budget: 2500000,
        currency: 'IDRX',
        status: 'hiring',
        kpis: [
          {
            id: 'kpi-5-1',
            name: 'Model Training',
            percentage: 40,
            description: 'Train prediction models for gas optimization',
            status: 'pending',
            deadline: '2026-02-15',
          },
          {
            id: 'kpi-5-2',
            name: 'API Integration',
            percentage: 35,
            description: 'Integrate ML models with smart contracts',
            status: 'pending',
            deadline: '2026-03-01',
          },
          {
            id: 'kpi-5-3',
            name: 'Testing & Validation',
            percentage: 25,
            description: 'Validate model accuracy and performance',
            status: 'pending',
            deadline: '2026-03-20',
          },
        ],
      },
    ],
  },
];

// Mock projects where user is owner or freelancer (legacy)
export const mockProjects: Project[] = [
  {
    id: 'p1',
    jobId: 'job-1',
    title: 'DeFi Dashboard Frontend',
    description: 'Building a responsive DeFi dashboard with real-time data visualization.',
    totalBudget: 500,
    currency: 'USDC',
    milestones: [
      { id: 'pm1', name: 'Design Phase', percentage: 30, status: 'approved', description: 'Convert Figma designs to responsive HTML' },
      { id: 'pm2', name: 'React Components', percentage: 40, status: 'in-progress', description: 'Build reusable React components' },
      { id: 'pm3', name: 'Integration & Testing', percentage: 30, status: 'pending', description: 'Integrate Web3 and test all features' },
    ],
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    freelancer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    freelancerEns: 'bob.eth',
    userRole: 'owner',
    status: 'in-progress',
    createdAt: '2026-01-10',
  },
  {
    id: 'p2',
    jobId: 'job-2',
    title: 'Smart Contract Audit',
    description: 'Comprehensive security audit for staking contract.',
    totalBudget: 1500,
    currency: 'USDC',
    milestones: [
      { id: 'pm2-1', name: 'Preliminary Review', percentage: 40, status: 'completed', description: 'Initial code review and vulnerability scan' },
      { id: 'pm2-2', name: 'Final Report', percentage: 60, status: 'in-progress', description: 'Detailed audit report with findings' },
    ],
    owner: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
    ownerEns: 'defi-project.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'in-progress',
    createdAt: '2026-01-08',
  },
  {
    id: 'p3',
    jobId: 'job-3',
    title: 'Landing Page Design',
    description: 'Modern landing page for Web3 startup.',
    totalBudget: 350,
    currency: 'USDC',
    milestones: [
      { id: 'pm3-1', name: 'Concept Design', percentage: 50, status: 'approved', description: 'Initial design concepts' },
      { id: 'pm3-2', name: 'Final Assets', percentage: 50, status: 'approved', description: 'All final design assets and code' },
    ],
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    freelancer: '0x2222222222222222222222222222222222222222',
    freelancerEns: 'designer.eth',
    userRole: 'owner',
    status: 'completed',
    createdAt: '2025-12-15',
  },
];

// Mock applications (user's job applications as freelancer)
export const mockApplications: Application[] = [
  {
    id: 'app1',
    jobId: '2',
    jobTitle: 'Smart Contract Auditor',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'I have 3 years of experience auditing DeFi protocols and previously worked with several major projects.',
    status: 'accepted',
    appliedAt: '2026-01-14',
  },
  {
    id: 'app2',
    jobId: '4',
    jobTitle: 'UI/UX Designer for DeFi App',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'While primarily a developer, I have experience designing interfaces and can deliver quality Figma designs.',
    status: 'pending',
    appliedAt: '2026-01-13',
  },
  {
    id: 'app3',
    jobId: '3',
    jobTitle: 'NFT Marketplace Backend',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'I have built several GraphQL APIs for NFT projects and can deliver this quickly.',
    status: 'rejected',
    appliedAt: '2026-01-12',
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'application',
    message: 'New application from bob.eth for "Frontend Developer Needed"',
    read: false,
    createdAt: '2026-01-15T10:30:00Z',
    link: '/jobs/1',
  },
  {
    id: 'n2',
    type: 'milestone',
    message: 'Milestone "React Components" marked as complete by bob.eth',
    read: false,
    createdAt: '2026-01-14T15:20:00Z',
    link: '/projects/p1',
  },
  {
    id: 'n3',
    type: 'payment',
    message: 'Payment of $150 USDC released for "Smart Contract Audit"',
    read: true,
    createdAt: '2026-01-13T09:00:00Z',
  },
  {
    id: 'n4',
    type: 'application',
    message: 'Your application for "Smart Contract Auditor" was accepted!',
    read: true,
    createdAt: '2026-01-12T14:00:00Z',
    link: '/projects/p2',
  },
  {
    id: 'n5',
    type: 'review',
    message: 'bob.eth left you a 5-star review!',
    read: true,
    createdAt: '2026-01-10T18:30:00Z',
  },
];

// Helper functions
export function getJobById(id: string): Job | undefined {
  return mockJobs.find(job => job.id === id);
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find(project => project.id === id);
}

export function getPOProjectById(id: string): POProject | undefined {
  return mockPOProjects.find(project => project.id === id);
}

export function getApplicationsByJobId(jobId: string): Application[] {
  return mockApplications.filter(app => app.jobId === jobId);
}

export function getJobsByOwner(address: string): Job[] {
  return mockJobs.filter(job => job.postedBy.toLowerCase() === address.toLowerCase());
}

export function getUnreadNotifications(): Notification[] {
  return mockNotifications.filter(n => !n.read);
}

export function getProjectsByRole(role: ProjectRole): Project[] {
  return mockProjects.filter(p => {
    if (role === 'owner') return p.userRole === 'owner' || p.userRole === 'both';
    if (role === 'freelancer') return p.userRole === 'freelancer' || p.userRole === 'both';
    return true;
  });
}

export function getApplicationStatusColor(status: ApplicationStatus): 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'destructive';
  }
}

// PO Project helpers
export function getPOProjectsByOwner(address: string): POProject[] {
  return mockPOProjects.filter(p => p.owner.toLowerCase() === address.toLowerCase());
}

export function getRoleById(projectId: string, roleId: string): RoleInProject | undefined {
  const project = getPOProjectById(projectId);
  return project?.roles.find(r => r.id === roleId);
}

export function getKPIById(projectId: string, roleId: string, kpiId: string): KPI | undefined {
  const role = getRoleById(projectId, roleId);
  return role?.kpis.find(k => k.id === kpiId);
}

export function calculateProjectProgress(project: POProject): number {
  if (!project.roles.length) return 0;

  const totalKPIs = project.roles.reduce((sum, role) => sum + role.kpis.length, 0);
  const completedKPIs = project.roles.reduce(
    (sum, role) => sum + role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length,
    0
  );

  return totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'IDRX') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${new Intl.NumberFormat('en-US').format(amount)} ${currency}`;
}
