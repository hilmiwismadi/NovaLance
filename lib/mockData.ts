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
  reviewCount: 47,
  memberSince: 'September 2023',
  bio: 'Full-stack Web3 developer specializing in DeFi applications, smart contract integration, and scalable frontend architectures.',
  skills: ['React', 'TypeScript', 'Next.js', 'Solidity', 'Node.js', 'GraphQL', 'Web3.js', 'Tailwind CSS'],
  experience: [
    {
      id: 'e1',
      company: 'DeFi Protocol Labs',
      role: 'Senior Frontend Developer',
      description: 'Built UI for a decentralized exchange protocol with $10M+ TVL',
      startDate: '2024-06',
      current: true,
    },
    {
      id: 'e2',
      company: 'Web3 Studios',
      role: 'Full Stack Developer',
      description: 'Developed NFT marketplace and wallet integration, serving 50K+ users',
      startDate: '2023-01',
      endDate: '2024-05',
      current: false,
    },
    {
      id: 'e3',
      company: 'Blockchain Solutions',
      role: 'Smart Contract Engineer',
      description: 'Developed and audited smart contracts for various DeFi protocols',
      startDate: '2022-03',
      endDate: '2022-12',
      current: false,
    },
  ],
  completedProjects: 24,
  managedProjects: 8,
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
  {
    id: 'proj-4',
    title: 'Web3 Gaming Platform',
    description: 'Build a blockchain-based gaming platform with NFT assets, tournament management, and reward distribution.',
    features: ['NFT assets system', 'Tournament management', 'Reward distribution', 'Leaderboard', 'Wallet integration'],
    totalBudget: 5000000,
    currency: 'IDRX',
    startDate: '2026-01-20',
    endDate: '2026-05-20',
    status: 'in-progress',
    owner: '0x9876543210987654321098765432109876543210',
    ownerEns: 'gaming-dao.eth',
    createdAt: '2026-01-15',
    roles: [
      {
        id: 'role-6',
        title: 'Frontend Developer',
        description: 'Build gaming platform UI with real-time updates and smooth animations.',
        skills: ['React', 'TypeScript', 'WebGL', 'Socket.io', 'Redux'],
        budget: 2500000,
        currency: 'IDRX',
        status: 'in-progress',
        assignedTo: '0x1234567890abcdef1234567890abcdef12345678',
        assignedToEns: 'alice.eth',
        kpis: [
          {
            id: 'kpi-6-1',
            name: 'Project Setup & UI Library',
            percentage: 20,
            description: 'Setup Next.js project, configure Redux, and build core UI components',
            status: 'approved',
            deadline: '2026-01-25',
            completedAt: '2026-01-24',
            yield: 3.25,
          },
          {
            id: 'kpi-6-2',
            name: 'Game Interface',
            percentage: 35,
            description: 'Build main game interface with canvas rendering',
            status: 'in-progress',
            deadline: '2026-02-20',
          },
          {
            id: 'kpi-6-3',
            name: 'Wallet & NFT Integration',
            percentage: 30,
            description: 'Connect wallet and display NFT assets in-game',
            status: 'pending',
            deadline: '2026-03-15',
          },
          {
            id: 'kpi-6-4',
            name: 'Testing & Launch',
            percentage: 15,
            description: 'Beta testing and mainnet launch',
            status: 'pending',
            deadline: '2026-04-01',
          },
        ],
      },
      {
        id: 'role-7',
        title: 'Backend Developer',
        description: 'Build scalable backend for game logic, tournaments, and rewards.',
        skills: ['Node.js', 'PostgreSQL', 'Redis', 'Socket.io'],
        budget: 2500000,
        currency: 'IDRX',
        status: 'hiring',
        kpis: [
          {
            id: 'kpi-7-1',
            name: 'API Design',
            percentage: 25,
            description: 'Design RESTful APIs for game logic',
            status: 'pending',
            deadline: '2026-02-01',
          },
          {
            id: 'kpi-7-2',
            name: 'Real-time Features',
            percentage: 35,
            description: 'Implement WebSocket for real-time gameplay',
            status: 'pending',
            deadline: '2026-03-01',
          },
          {
            id: 'kpi-7-3',
            name: 'Tournament System',
            percentage: 40,
            description: 'Build tournament management and rewards',
            status: 'pending',
            deadline: '2026-04-01',
          },
        ],
      },
    ],
  },
  {
    id: 'proj-5',
    title: 'SocialFi DApp',
    description: 'Decentralized social network with token rewards, content monetization, and creator tools.',
    features: ['Social feeds', 'Token rewards', 'Content monetization', 'Creator dashboard', 'Direct messaging'],
    totalBudget: 3500000,
    currency: 'IDRX',
    startDate: '2025-12-01',
    endDate: '2026-03-31',
    status: 'completed',
    owner: '0x1111111111111111111111111111111111111111',
    ownerEns: 'socialfi-dao.eth',
    createdAt: '2025-11-20',
    roles: [
      {
        id: 'role-8',
        title: 'Full Stack Developer',
        description: 'Build complete social network frontend and backend.',
        skills: ['React', 'Node.js', 'GraphQL', 'IPFS', 'Lens Protocol'],
        budget: 3500000,
        currency: 'IDRX',
        status: 'completed',
        assignedTo: '0x1234567890abcdef1234567890abcdef12345678',
        assignedToEns: 'alice.eth',
        kpis: [
          {
            id: 'kpi-8-1',
            name: 'Database & API Setup',
            percentage: 20,
            description: 'Setup database schema and GraphQL API',
            status: 'approved',
            deadline: '2025-12-15',
            completedAt: '2025-12-14',
            yield: 5.67,
          },
          {
            id: 'kpi-8-2',
            name: 'Social Feed',
            percentage: 30,
            description: 'Build social feed with posts, comments, likes',
            status: 'approved',
            deadline: '2026-01-15',
            completedAt: '2026-01-14',
            yield: 7.82,
          },
          {
            id: 'kpi-8-3',
            name: 'Wallet Integration',
            percentage: 25,
            description: 'Connect wallets and implement token transfers',
            status: 'approved',
            deadline: '2026-02-15',
            completedAt: '2026-02-14',
            yield: 9.15,
          },
          {
            id: 'kpi-8-4',
            name: 'Monetization Features',
            percentage: 25,
            description: 'Content monetization and creator tools',
            status: 'approved',
            deadline: '2026-03-15',
            completedAt: '2026-03-14',
            yield: 12.33,
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
    totalBudget: 1500,
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
    totalBudget: 2000,
    currency: 'USDC',
    milestones: [
      { id: 'pm2-1', name: 'Preliminary Review', percentage: 40, status: 'completed', description: 'Initial code review and vulnerability scan' },
      { id: 'pm2-2', name: 'Final Report', percentage: 60, status: 'approved', description: 'Detailed audit report with findings' },
    ],
    owner: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
    ownerEns: 'defi-project.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'completed',
    createdAt: '2026-01-08',
  },
  {
    id: 'p3',
    jobId: 'job-3',
    title: 'Landing Page Design',
    description: 'Modern landing page for Web3 startup.',
    totalBudget: 800,
    currency: 'USDC',
    milestones: [
      { id: 'pm3-1', name: 'Concept Design', percentage: 50, status: 'approved', description: 'Initial design concepts' },
      { id: 'pm3-2', name: 'Final Assets', percentage: 50, status: 'approved', description: 'All final design assets and code' },
    ],
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    ownerEns: 'alice.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'owner',
    status: 'completed',
    createdAt: '2025-12-15',
  },
  {
    id: 'p4',
    jobId: 'job-4',
    title: 'NFT Marketplace Integration',
    description: 'Integrate wallet connection and NFT display functionality.',
    totalBudget: 1200,
    currency: 'USDC',
    milestones: [
      { id: 'pm4-1', name: 'Wallet Integration', percentage: 35, status: 'approved', description: 'Connect Web3 wallet and display balance' },
      { id: 'pm4-2', name: 'NFT Display', percentage: 40, status: 'completed', description: 'Display NFTs with metadata' },
      { id: 'pm4-3', name: 'Testing', percentage: 25, status: 'in-progress', description: 'E2E testing and bug fixes' },
    ],
    owner: '0x9876543210987654321098765432109876543210',
    ownerEns: 'nft-collector.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'in-progress',
    createdAt: '2026-01-05',
  },
  {
    id: 'p5',
    jobId: 'job-5',
    title: 'Yield Farming Interface',
    description: 'Build UI for yield farming with pool management and rewards tracking.',
    totalBudget: 1800,
    currency: 'USDC',
    milestones: [
      { id: 'pm5-1', name: 'Pool Display', percentage: 30, status: 'approved', description: 'Show available pools and APY' },
      { id: 'pm5-2', name: 'Staking UI', percentage: 40, status: 'approved', description: 'Stake/unstake functionality' },
      { id: 'pm5-3', name: 'Rewards Tracking', percentage: 30, status: 'approved', description: 'Real-time rewards display' },
    ],
    owner: '0x1111111111111111111111111111111111111111',
    ownerEns: 'yield-farmer.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'completed',
    createdAt: '2025-12-01',
  },
  {
    id: 'p6',
    jobId: 'job-6',
    title: 'Cross-Chain Bridge UI',
    description: 'User interface for cross-chain token transfers with status tracking.',
    totalBudget: 2200,
    currency: 'USDC',
    milestones: [
      { id: 'pm6-1', name: 'Transfer Form', percentage: 25, status: 'completed', description: 'Build transfer form with amount input' },
      { id: 'pm6-2', name: 'Status Tracking', percentage: 35, status: 'completed', description: 'Real-time transfer status updates' },
      { id: 'pm6-3', name: 'History Display', percentage: 25, status: 'approved', description: 'Transaction history with filters' },
      { id: 'pm6-4', name: 'Testing', percentage: 15, status: 'in-progress', description: 'Cross-chain testing' },
    ],
    owner: '0x2222222222222222222222222222222222222222',
    ownerEns: 'bridge-dao.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'in-progress',
    createdAt: '2026-01-12',
  },
  {
    id: 'p7',
    jobId: 'job-7',
    title: 'Governance Dashboard',
    description: 'DAO governance interface with proposal voting and delegation.',
    totalBudget: 1600,
    currency: 'USDC',
    milestones: [
      { id: 'pm7-1', name: 'Proposal List', percentage: 30, status: 'approved', description: 'Display active proposals' },
      { id: 'pm7-2', name: 'Voting Interface', percentage: 40, status: 'approved', description: 'Vote on proposals with gas estimation' },
      { id: 'pm7-3', name: 'Delegation', percentage: 30, status: 'approved', description: 'Vote delegation functionality' },
    ],
    owner: '0x3333333333333333333333333333333333333333',
    ownerEns: 'dao-gov.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'completed',
    createdAt: '2025-11-15',
  },
  {
    id: 'p8',
    jobId: 'job-8',
    title: 'Token Swap DEX',
    description: 'Decentralized exchange UI with limit orders and liquidity pools.',
    totalBudget: 2500,
    currency: 'USDC',
    milestones: [
      { id: 'pm8-1', name: 'Swap Interface', percentage: 35, status: 'completed', description: 'Token swap with price quotes' },
      { id: 'pm8-2', name: 'Limit Orders', percentage: 30, status: 'completed', description: 'Limit order placement and management' },
      { id: 'pm8-3', name: 'Liquidity Pool', percentage: 35, status: 'completed', description: 'Add/remove liquidity functionality' },
    ],
    owner: '0x4444444444444444444444444444444444444444',
    ownerEns: 'dex-operator.eth',
    freelancer: '0x1234567890abcdef1234567890abcdef12345678',
    freelancerEns: 'alice.eth',
    userRole: 'freelancer',
    status: 'completed',
    createdAt: '2025-10-20',
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
    appliedAt: '2026-01-16',
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
  {
    id: 'app4',
    jobId: '1',
    jobTitle: 'Frontend Developer Needed',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'I specialize in React and TypeScript, with extensive experience in DeFi applications. I can deliver pixel-perfect implementations.',
    status: 'pending',
    appliedAt: '2026-01-17',
  },
  {
    id: 'app5',
    jobId: '4',
    jobTitle: 'React Native Mobile App',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'Experienced React Native developer with 5+ years of mobile app development. Built several crypto wallets.',
    status: 'pending',
    appliedAt: '2026-01-18',
  },
  {
    id: 'app6',
    jobId: '2',
    jobTitle: 'Smart Contract Developer',
    applicantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    applicantEns: 'alice.eth',
    coverLetter: 'Solidity developer with security focus. Audited contracts with over $50M TVL.',
    status: 'pending',
    appliedAt: '2026-01-19',
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
    // Format as number only, logo will be added separately
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${new Intl.NumberFormat('en-US').format(amount)} ${currency}`;
}

// Get the formatted amount with currency info for display with logo
export function formatCurrencyWithSymbol(amount: number, currency: string): { amount: string; symbol: string; isLogo: boolean } {
  if (currency === 'IDRX') {
    return {
      amount: new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount),
      symbol: 'IDRX',
      isLogo: true,
    };
  }
  return {
    amount: new Intl.NumberFormat('en-US').format(amount),
    symbol: currency,
    isLogo: false,
  };
}
