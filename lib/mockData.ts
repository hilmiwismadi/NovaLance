// Mock data for NovaLance frontend

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected';

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
  rating: number;
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
  rating: 4.8,
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

// Mock projects where user is owner or freelancer
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
