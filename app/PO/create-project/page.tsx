'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

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
  const [mounted, setMounted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all role KPIs add up to 100
    for (let i = 0; i < roles.length; i++) {
      const totalPercentage = roles[i].kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);
      if (totalPercentage !== 100) {
        alert(`Role "${roles[i].title || 'Role ' + (i + 1)}" KPIs must add up to 100%. Currently: ${totalPercentage}%`);
        return;
      }
    }

    // Calculate total budget
    const totalBudget = roles.reduce((sum, role) => sum + parseFloat(role.budget || '0'), 0);

    // TODO: Create project via API
    console.log({
      title,
      description,
      currency,
      startDate,
      endDate,
      features: features.map(f => f.text),
      roles: roles.map(role => ({
        title: role.title,
        description: role.description,
        budget: parseFloat(role.budget),
        currency: role.currency,
        skills: role.skills,
        kpis: role.kpis,
      })),
      totalBudget,
    });

    // Navigate to projects list
    router.push('/PO/projects');
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Project</h1>
          <p className="text-slate-600 mt-1">Define your project, team roles, and KPIs</p>
        </div>
        <Button type="button" variant="secondary" onClick={fillDummyData}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Fill Dummy Data
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Project Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Project Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Money Tracker App"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project in detail..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                >
                  <option value="IDRX">IDRX</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature (e.g., Expense tracking)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
                <Button type="button" variant="default" onClick={addFeature}>
                  Add
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <Badge key={feature.id} variant="default" className="cursor-pointer" onClick={() => removeFeature(feature.id)}>
                      {feature.text}
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Team Roles */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-600">2</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Team Roles</h2>
            </div>
            <Button type="button" variant="default" onClick={addRole}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </Button>
          </div>

          <div className="space-y-6">
            {roles.map((role, roleIndex) => {
              const totalKPIPercentage = role.kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);

              return (
                <div key={role.id} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Role {roleIndex + 1}</h3>
                    {roles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(roleIndex)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>

                  {/* Role Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Role Title *
                      </label>
                      <input
                        type="text"
                        value={role.title}
                        onChange={(e) => updateRole(roleIndex, 'title', e.target.value)}
                        placeholder="e.g., Frontend Developer"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
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
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Role Description *
                    </label>
                    <textarea
                      value={role.description}
                      onChange={(e) => updateRole(roleIndex, 'description', e.target.value)}
                      placeholder="Describe the role requirements and responsibilities..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Required Skills
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={role.skillInput}
                        onChange={(e) => updateRole(roleIndex, 'skillInput', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(roleIndex))}
                        placeholder="Add skills (e.g., React, TypeScript)"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      />
                      <Button type="button" variant="default" onClick={() => addSkill(roleIndex)}>
                        Add
                      </Button>
                    </div>
                    {role.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {role.skills.map((skill) => (
                          <Badge key={skill} variant="default" className="cursor-pointer" onClick={() => removeSkill(roleIndex, skill)}>
                            {skill}
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* KPIs */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700">
                        KPIs (Key Performance Indicators)
                      </label>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${totalKPIPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {totalKPIPercentage}% / 100%
                        </span>
                        <Button type="button" variant="default" size="sm" onClick={() => addKPI(roleIndex)}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add KPI
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {role.kpis.map((kpi, kpiIndex) => (
                        <div key={kpi.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-900">KPI {kpiIndex + 1}</span>
                            {role.kpis.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeKPI(roleIndex, kpiIndex)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                KPI Name *
                              </label>
                              <input
                                type="text"
                                value={kpi.name}
                                onChange={(e) => updateKPI(roleIndex, kpiIndex, 'name', e.target.value)}
                                placeholder="e.g., Setup & Architecture"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Percentage *
                              </label>
                              <input
                                type="number"
                                value={kpi.percentage || ''}
                                onChange={(e) => updateKPI(roleIndex, kpiIndex, 'percentage', parseInt(e.target.value) || 0)}
                                placeholder="20"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
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
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={kpi.description}
                              onChange={(e) => updateKPI(roleIndex, kpiIndex, 'description', e.target.value)}
                              placeholder="Describe what needs to be completed..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Budget Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Budget Summary</h2>
          <div className="space-y-3">
            {roles.map((role, i) => (
              <div key={role.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {role.title || `Role ${i + 1}`}
                </span>
                <span className="font-medium text-slate-900">
                  {parseInt(role.budget || '0').toLocaleString()} {currency}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-900">Total Budget</span>
              <span className="text-xl font-bold text-brand-600">
                {roles.reduce((sum, role) => sum + parseInt(role.budget || '0'), 0).toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}
