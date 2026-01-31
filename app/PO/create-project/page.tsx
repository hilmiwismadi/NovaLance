'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { decodeEventLog, type Log, type Address } from 'viem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import {
  useCreateProject,
  useTransactionWait,
  // ProjectLance hooks
  usePLCreateProject,
} from '@/lib/hooks';
import { PROJECTLANCE_ABI } from '@/lib/abi';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showInfo,
  showSuccess,
  showError,
} from '@/lib/transactions';

// Accordion component for collapsible sections
interface AccordionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  badge?: React.ReactNode;
}

function Accordion({ title, subtitle, isOpen, onToggle, children, actionButton, badge }: AccordionProps) {
  return (
    <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white/40 backdrop-blur-sm">
      <div
        onClick={onToggle}
        className="w-full px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-left hover:bg-white/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-base sm:text-lg">{title}</span>
              {badge}
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()}>
            {actionButton}
          </div>
        )}
      </div>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-slate-200/60">
          {children}
        </div>
      )}
    </div>
  );
}

// Dummy data generators
const projectTitles = [
  'DeFi Trading Platform',
  'NFT Marketplace',
  'DAO Governance System',
  'Yield Aggregator',
  'Cross-chain Bridge',
  'Wallet Integration',
  'Token Staking Platform',
  'Smart Contract Audit Tool',
  'Crypto Payment Gateway',
  'Blockchain Analytics Dashboard'
];

const projectDescriptions = [
  'Build a comprehensive decentralized finance platform with advanced trading features, liquidity provision, and yield farming capabilities. The platform should support multiple chains and provide real-time market data.',
  'Create an intuitive NFT marketplace where creators can mint, list, and sell their digital assets. Include features like auctions, royalties, and cross-chain compatibility.',
  'Develop a decentralized autonomous organization governance system with proposal creation, voting mechanisms, and treasury management capabilities.',
  'Build a yield aggregator that automatically finds and allocates funds to the highest yielding protocols across multiple chains while optimizing gas fees.',
  'Create a secure cross-chain bridge enabling seamless asset transfers between different blockchain networks with minimal fees and fast finality.'
];

const roleTitles = [
  'Smart Contract Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Blockchain Engineer',
  'UI/UX Designer',
  'DevOps Engineer',
  'Security Auditor',
  'Product Manager',
  'QA Engineer'
];

const roleDescriptions = [
  'Develop and audit smart contracts using Solidity. Ensure security best practices and optimize gas usage. Experience with DeFi protocols required.',
  'Build responsive and intuitive user interfaces using React and TypeScript. Integrate with Web3 libraries and ensure seamless user experience.',
  'Design and implement scalable backend services. Work with databases, APIs, and blockchain indexing solutions. Ensure high availability and performance.',
  'Handle both frontend and backend development. Full-stack development with modern web technologies and blockchain integration.',
  'Design and implement blockchain solutions. Work with various chains and develop custom smart contracts and integration layers.',
  'Create beautiful and user-friendly interfaces. Conduct user research and design intuitive workflows for complex Web3 applications.',
  'Set up and maintain CI/CD pipelines. Manage infrastructure and ensure smooth deployment processes. Monitor system performance.',
  'Conduct security audits of smart contracts and identify vulnerabilities. Provide recommendations and implement security best practices.',
  'Define product roadmap and requirements. Work with engineering teams to deliver features on time and within budget.',
  'Develop comprehensive test suites and conduct manual and automated testing. Ensure quality and identify bugs before deployment.'
];

const skills = [
  'Solidity', 'React', 'TypeScript', 'Node.js', 'Python', 'Rust', 'Go',
  'Web3.js', 'Ethers.js', 'Hardhat', 'Foundry', 'GraphQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Git', 'CI/CD',
  'Tailwind CSS', 'Next.js', 'Vue.js', 'Security Auditing', 'Smart Contracts'
];

const kpiNames = [
  'Project Setup & Architecture',
  'Smart Contract Development',
  'Core Features Implementation',
  'Integration & Testing',
  'Security Audit & Fixes',
  'UI/UX Design',
  'Frontend Implementation',
  'Backend Development',
  'API Integration',
  'Documentation & Deployment'
];

const kpiDescriptions = [
  'Set up the project structure, configure development environment, and define the technical architecture.',
  'Develop and deploy smart contracts with all required functionality and security measures.',
  'Implement core features and user flows according to specifications.',
  'Integrate all components and conduct thorough testing including unit tests and integration tests.',
  'Complete security audit, address all findings, and implement necessary fixes.',
  'Design user interface and user experience based on requirements and best practices.',
  'Build responsive frontend with all UI components and integrate with smart contracts.',
  'Develop backend services, APIs, and database integrations.',
  'Integrate with external APIs and services, ensure seamless data flow.',
  'Complete documentation, deploy to production, and provide maintenance guidelines.'
];

const featureList = [
  'User authentication & wallet connection',
  'Real-time price feeds & charts',
  'Multi-chain support',
  'Staking & rewards',
  'Governance voting',
  'Token swap functionality',
  'Liquidity provision',
  'Yield farming',
  'Portfolio tracking',
  'Transaction history',
  'Notification system',
  'Dark mode support',
  'Mobile responsive design',
  'Multi-language support',
  'Referral program'
];

const currencies = ['IDRX', 'USDC', 'USDT', 'ETH'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateKPIs(count: number, startDate: string): Array<{
  id: string;
  name: string;
  percentage: number;
  description: string;
  deadline: string;
}> {
  const kpis: Array<{ id: string; name: string; percentage: number; description: string; deadline: string }> = [];
  const names = getRandomItems(kpiNames, count, count);
  const descriptions = getRandomItems(kpiDescriptions, count, count);

  let baseDate = new Date(startDate);
  const totalDuration = 90; // days
  const interval = Math.floor(totalDuration / count);

  let remainingPercentage = 100;

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const percentage = isLast ? remainingPercentage : Math.floor(Math.random() * (remainingPercentage - (count - i - 1) * 5)) + 5;
    remainingPercentage -= percentage;

    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + interval);
    const deadlineStr = deadline.toISOString().split('T')[0];

    kpis.push({
      id: `kpi-${Date.now()}-${i}`,
      name: names[i],
      percentage,
      description: descriptions[i],
      deadline: deadlineStr
    });

    baseDate = deadline;
  }

  return kpis;
}

function generateDummyData() {
  const title = getRandomItem(projectTitles);
  const description = getRandomItem(projectDescriptions);
  const currency = getRandomItem(currencies);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 7);
  const startDateStr = startDate.toISOString().split('T')[0];

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);
  const endDateStr = endDate.toISOString().split('T')[0];

  const features = getRandomItems(featureList, 3, 6).map((text, i) => ({
    id: `f-${Date.now()}-${i}`,
    text
  }));

  const roleCount = Math.floor(Math.random() * 4) + 2; // 2-5 roles
  const roles = [];

  for (let i = 0; i < roleCount; i++) {
    const kpiCount = Math.floor(Math.random() * 8) + 3; // 3-10 KPIs
    const budget = (Math.floor(Math.random() * 80) + 20) * 1000000; // 20M-100M

    roles.push({
      id: `role-${Date.now()}-${i}`,
      title: getRandomItem(roleTitles),
      description: getRandomItem(roleDescriptions),
      budget: budget.toString(),
      currency,
      skills: getRandomItems(skills, 3, 6),
      skillInput: '',
      kpis: generateKPIs(kpiCount, startDateStr)
    });
  }

  return {
    title,
    description,
    currency,
    startDate: startDateStr,
    endDate: endDateStr,
    features,
    roles
  };
}

interface FeatureInput {
  id: string;
  text: string;
}

interface KPIInput {
  id: string;
  name: string;
  percentage: number;
  description: string;
  deadline: string;
}

interface RoleInput {
  id: string;
  title: string;
  description: string;
  budget: string;
  currency: string;
  skills: string[];
  skillInput: string;
  kpis: KPIInput[];
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Smart contract hooks - Use ProjectLance for milestone-based projects
  const { createProject: createPLProject, isPending: isPLPending, error: plError, hash: plHash, isSuccess: isPLSuccess } = usePLCreateProject();
  const { isLoading: isPLConfirming, isSuccess: isPLConfirmed, receipt: plReceipt } = useTransactionWait(plHash ?? undefined);

  // State for the created project ID
  const [createdProjectId, setCreatedProjectId] = useState<bigint | null>(null);

  // Legacy hooks for KPI-based projects
  const { createProject, isPending, error, hash, isSuccess } = useCreateProject();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  // Expanded state for accordions
  const [expandedSections, setExpandedSections] = useState({
    projectInfo: true,
    roles: [] as string[],
  });

  const toggleSection = (section: string, roleId?: string) => {
    if (section === 'projectInfo') {
      setExpandedSections(prev => ({ ...prev, projectInfo: !prev.projectInfo }));
    } else if (section === 'role' && roleId) {
      setExpandedSections(prev => {
        const roles = prev.roles.includes(roleId)
          ? prev.roles.filter(id => id !== roleId)
          : [...prev.roles, roleId];
        return { ...prev, roles };
      });
    }
  };

  // Project level
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('IDRX');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [features, setFeatures] = useState<FeatureInput[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  // Roles level
  const [roles, setRoles] = useState<RoleInput[]>([
    {
      id: 'role-1',
      title: '',
      description: '',
      budget: '',
      currency: 'IDRX',
      skills: [],
      skillInput: '',
      kpis: [
        { id: 'kpi-1', name: '', percentage: 0, description: '', deadline: '' },
      ],
    },
  ]);

  // Fill dummy data
  const fillDummyData = () => {
    const dummyData = generateDummyData();
    setTitle(dummyData.title);
    setDescription(dummyData.description);
    setCurrency(dummyData.currency);
    setStartDate(dummyData.startDate);
    setEndDate(dummyData.endDate);
    setFeatures(dummyData.features);
    setRoles(dummyData.roles as RoleInput[]);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Feature handlers
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, { id: `f-${Date.now()}`, text: featureInput.trim() }]);
      setFeatureInput('');
    }
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  // Role handlers
  const addRole = () => {
    setRoles([
      ...roles,
      {
        id: `role-${Date.now()}`,
        title: '',
        description: '',
        budget: '',
        currency: 'IDRX',
        skills: [],
        skillInput: '',
        kpis: [
          { id: `kpi-${Date.now()}`, name: '', percentage: 0, description: '', deadline: '' },
        ],
      },
    ]);
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const updateRole = (index: number, field: keyof RoleInput, value: any) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  // Skill handlers (per role)
  const addSkill = (roleIndex: number) => {
    const role = roles[roleIndex];
    if (role.skillInput.trim() && !role.skills.includes(role.skillInput.trim())) {
      const updated = [...roles];
      updated[roleIndex] = {
        ...role,
        skills: [...role.skills, role.skillInput.trim()],
        skillInput: '',
      };
      setRoles(updated);
    }
  };

  const removeSkill = (roleIndex: number, skill: string) => {
    const updated = [...roles];
    updated[roleIndex] = {
      ...updated[roleIndex],
      skills: updated[roleIndex].skills.filter(s => s !== skill),
    };
    setRoles(updated);
  };

  // KPI handlers (per role)
  const addKPI = (roleIndex: number) => {
    const role = roles[roleIndex];
    const updated = [...roles];
    updated[roleIndex] = {
      ...role,
      kpis: [
        ...role.kpis,
        { id: `kpi-${Date.now()}`, name: '', percentage: 0, description: '', deadline: '' },
      ],
    };
    setRoles(updated);
  };

  const removeKPI = (roleIndex: number, kpiIndex: number) => {
    const role = roles[roleIndex];
    if (role.kpis.length > 1) {
      const updated = [...roles];
      updated[roleIndex] = {
        ...role,
        kpis: role.kpis.filter((_, i) => i !== kpiIndex),
      };
      setRoles(updated);
    }
  };

  const updateKPI = (roleIndex: number, kpiIndex: number, field: keyof KPIInput, value: string | number) => {
    const updated = [...roles];
    updated[roleIndex].kpis[kpiIndex] = {
      ...updated[roleIndex].kpis[kpiIndex],
      [field]: value,
    };
    setRoles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check wallet connection
    if (!address) {
      showError('Wallet Not Connected', 'Please connect your wallet to create a project');
      return;
    }

    // Check if we're on a supported chain
    if (!chain || (chain.id !== 8453 && chain.id !== 84532)) {
      showError('Wrong Network', 'Please switch to Base or Base Sepolia');
      return;
    }

    // Validate all role KPIs add up to 100
    for (let i = 0; i < roles.length; i++) {
      const totalPercentage = roles[i].kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);
      if (totalPercentage !== 100) {
        showError('Invalid KPI Percentages', `Role "${roles[i].title || 'Role ' + (i + 1)}" KPIs must add up to 100%. Currently: ${totalPercentage}%`);
        return;
      }
    }

    // Calculate total budget
    const totalBudget = roles.reduce((sum, role) => sum + parseFloat(role.budget || '0'), 0);

    if (totalBudget <= 0) {
      showError('Invalid Budget', 'Total budget must be greater than 0');
      return;
    }

    try {
      // Call ProjectLance smart contract (milestone-based)
      showInfo('Creating Project', 'Preparing transaction...');

      // Convert KPI data to milestone format for ProjectLance
      // For simplicity, use the first role's KPIs as project milestones
      const primaryRoleKPIs = roles[0].kpis;
      const deadlines = primaryRoleKPIs.map(kpi => {
        const date = new Date(kpi.deadline);
        return BigInt(Math.floor(date.getTime() / 1000));
      });
      const percentages = primaryRoleKPIs.map(kpi => BigInt(Math.round(kpi.percentage * 100))); // Convert to basis points

      await createPLProject({
        deadlines,
        percentages,
      });

      // Transaction submitted - will be handled by useEffect below
    } catch (err) {
      const error = err as Error;
      showError('Failed to Create Project', error.message);
    }
  };

  // Handle ProjectLance transaction success
  useEffect(() => {
    if (isPLSuccess && plHash) {
      showTransactionPending(plHash, 'Create Project', chain?.id || 84532);
    }
  }, [isPLSuccess, plHash, chain]);

  // Handle ProjectLance transaction confirmation - extract projectId from logs
  useEffect(() => {
    if (isPLConfirmed && plReceipt) {
      // Extract projectId from ProjectCreated event
      let projectId: bigint | undefined;

      for (const log of plReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: PROJECTLANCE_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'ProjectCreated' && decoded.args) {
            // args is readonly unknown[], access by index (projectId is first indexed arg)
            projectId = decoded.args[0] as bigint;
            break;
          }
        } catch {
          // Skip logs that don't match the expected event format
          continue;
        }
      }

      if (projectId !== undefined) {
        setCreatedProjectId(projectId);
        showTransactionSuccess(plHash || '0x0', 'Project created successfully!');
        // Navigate to the newly created project detail page
        setTimeout(() => {
          router.push(`/PO/projects/${projectId}`);
        }, 1500);
      } else {
        // Fallback: If we can't extract projectId from logs, navigate to projects list
        showTransactionSuccess(plHash || '0x0', 'Project created successfully!');
        setTimeout(() => {
          router.push('/PO/projects');
        }, 1500);
      }
    }
  }, [isPLConfirmed, plReceipt, plHash, router]);

  // Handle ProjectLance transaction error
  useEffect(() => {
    if (plError) {
      showTransactionError(plHash || '0x0', plError, 'Failed to create project');
    }
  }, [plError, plHash]);

  // Legacy transaction handlers (for KPI-based NovaLance contract)
  useEffect(() => {
    if (isSuccess && hash) {
      showTransactionPending(hash, 'Create Project', chain?.id || 84532);
    }
  }, [isSuccess, hash, chain]);

  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Project created successfully!');
      setTimeout(() => {
        router.push('/PO/projects');
      }, 1500);
    }
  }, [isConfirmed, hash, router]);

  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to create project');
    }
  }, [error, hash]);

  if (!mounted) return null;

  const totalBudget = roles.reduce((sum, role) => sum + parseFloat(role.budget || '0'), 0);

  return (
    <div className="min-h-screen pb-safe">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">New Project</h1>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fillDummyData}
            className="text-xs sm:text-sm"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="hidden sm:inline ml-1.5">Fill Data</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Step 1: Project Information - Collapsible */}
        <Accordion
          title="Project Information"
          subtitle="Basic details about your project"
          isOpen={expandedSections.projectInfo}
          onToggle={() => toggleSection('projectInfo')}
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., DeFi Platform"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does your project do?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none glass-input"
                rows={3}
                required
              />
            </div>

            {/* Currency & Dates - Stacked on mobile */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                >
                  <option value="IDRX">IDRX</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                  />
                </div>
              </div>
            </div>

            {/* Features - Compact */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="e.g., Wallet connect"
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input text-sm"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={addFeature}
                  className="px-4 h-11"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => removeFeature(feature.id)}
                      className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1 rounded-md text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      {feature.text}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Accordion>

        {/* Step 2: Team Roles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-slate-900">Team Roles</h2>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={addRole}
              className="h-9 px-3 text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </Button>
          </div>

          <div className="space-y-3">
            {roles.map((role, roleIndex) => {
              const totalKPIPercentage = role.kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);
              const isExpanded = expandedSections.roles.includes(role.id);
              const roleDisplayTitle = role.title || `Role ${roleIndex + 1}`;

              return (
                <Accordion
                  key={role.id}
                  title={roleDisplayTitle}
                  subtitle={role.budget ? `${parseInt(role.budget).toLocaleString()} ${currency}` : 'Set budget and details'}
                  isOpen={isExpanded}
                  onToggle={() => toggleSection('role', role.id)}
                  badge={
                    role.skills.length > 0 ? (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                        {role.skills.length} skills
                      </span>
                    ) : null
                  }
                  actionButton={
                    roles.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRole(roleIndex);
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    ) : null
                  }
                >
                  <div className="space-y-4">
                    {/* Role Title & Budget - Stacked */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Role Title *
                        </label>
                        <input
                          type="text"
                          value={role.title}
                          onChange={(e) => updateRole(roleIndex, 'title', e.target.value)}
                          placeholder="e.g., Frontend Developer"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Budget ({currency}) *
                        </label>
                        <input
                          type="number"
                          value={role.budget}
                          onChange={(e) => updateRole(roleIndex, 'budget', e.target.value)}
                          placeholder="2000000"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Role Description *
                      </label>
                      <textarea
                        value={role.description}
                        onChange={(e) => updateRole(roleIndex, 'description', e.target.value)}
                        placeholder="What will this role do?"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none glass-input"
                        rows={2}
                        required
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Required Skills
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={role.skillInput}
                          onChange={(e) => updateRole(roleIndex, 'skillInput', e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(roleIndex))}
                          placeholder="e.g., React"
                          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all glass-input text-sm"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          onClick={() => addSkill(roleIndex)}
                          className="px-4 h-11"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Button>
                      </div>
                      {role.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {role.skills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => removeSkill(roleIndex, skill)}
                              className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1 rounded-md text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                            >
                              {skill}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* KPIs Section */}
                    <div className="border-t border-slate-200/60 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">
                            KPIs
                          </label>
                          <span className={`text-xs font-medium ${totalKPIPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {totalKPIPercentage}% / 100%
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => addKPI(roleIndex)}
                          className="h-9 px-3 text-sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add KPI
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {role.kpis.map((kpi, kpiIndex) => (
                          <div key={kpi.id} className="border border-slate-200/60 rounded-xl p-3 bg-white/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-slate-900">KPI {kpiIndex + 1}</span>
                              {role.kpis.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeKPI(roleIndex, kpiIndex)}
                                  className="h-7 w-7 p-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              )}
                            </div>

                            {/* KPI Inputs - Stacked on mobile, 2x2 on tablet+ */}
                            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={kpi.name}
                                  onChange={(e) => updateKPI(roleIndex, kpiIndex, 'name', e.target.value)}
                                  placeholder="e.g., Setup & Architecture"
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm glass-input"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  % *
                                </label>
                                <input
                                  type="number"
                                  value={kpi.percentage || ''}
                                  onChange={(e) => updateKPI(roleIndex, kpiIndex, 'percentage', parseInt(e.target.value) || 0)}
                                  placeholder="20"
                                  min="0"
                                  max="100"
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm glass-input"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  Deadline *
                                </label>
                                <input
                                  type="date"
                                  value={kpi.deadline}
                                  onChange={(e) => updateKPI(roleIndex, kpiIndex, 'deadline', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm glass-input"
                                  required
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={kpi.description}
                                  onChange={(e) => updateKPI(roleIndex, kpiIndex, 'description', e.target.value)}
                                  placeholder="What needs to be done?"
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm glass-input"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Accordion>
              );
            })}
          </div>
        </div>

        {/* Budget Summary - Compact Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Budget Summary</h3>
            <span className="text-lg font-bold text-brand-600">
              {totalBudget.toLocaleString()} {currency}
            </span>
          </div>
          <div className="space-y-2">
            {roles.map((role, i) => (
              <div key={role.id} className="flex justify-between text-sm">
                <span className="text-slate-600 truncate mr-2">
                  {role.title || `Role ${i + 1}`}
                </span>
                <span className="font-medium text-slate-900 flex-shrink-0">
                  {parseInt(role.budget || '0').toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Buttons - Stacked on mobile */}
        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-base font-semibold"
            disabled={isPLPending || isPLConfirming || isPending || isConfirming}
          >
            {isPLPending || isPLConfirming || isPending || isConfirming ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {(isPLPending || isPending) ? 'Confirming...' : 'Creating...'}
              </span>
            ) : (
              'Create Project'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="w-full h-11 text-sm"
            disabled={isPLPending || isPLConfirming || isPending || isConfirming}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Bottom padding for mobile safe area */}
      <div className="h-4 sm:h-0" />
    </div>
  );
}
