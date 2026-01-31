'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { getPOProjectById, formatCurrency } from '@/lib/mockData';
import { useAssignFreelancer, useTransactionWait } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

// Past project interface
interface PastProject {
  title: string;
  description: string;
  role: string;
  duration: string;
  rating: number;
  link?: string;
  skills: string[];
}

// Mock applicants data with detailed past projects
const mockApplicants = [
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ens: 'bob.eth',
    coverLetter: 'I have 5 years of experience with React and TypeScript. I\'ve built several similar projects and can deliver high-quality code within deadlines. My passion is creating clean, maintainable code that scales well.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'GraphQL'],
    rating: 4.8,
    completedProjects: 15,
    appliedAt: '2026-01-20',
    location: 'San Francisco, CA',
    responseTime: '2 hours',
    memberSince: '2021-03-15',
    pastProjects: [
      {
        title: 'DeFi Dashboard Pro',
        description: 'Built a comprehensive DeFi portfolio tracker with real-time price updates, yield farming analytics, and cross-chain support. Served over 50K active users.',
        role: 'Frontend Lead',
        duration: '6 months',
        rating: 5.0,
        link: 'https://defidashboard.pro',
        skills: ['React', 'TypeScript', 'Web3.js', 'Recharts'],
      },
      {
        title: 'NFT Marketplace',
        description: 'Developed a full-featured NFT marketplace with lazy minting, auction functionality, and wallet connection. Implemented optimized gas usage strategies.',
        role: 'Full Stack Developer',
        duration: '4 months',
        rating: 4.8,
        skills: ['Next.js', 'Solidity', 'IPFS', 'Ethers.js'],
      },
      {
        title: 'Yield Aggregator UI',
        description: 'Created an intuitive interface for a yield optimization protocol with auto-compounding vaults and strategy comparison tools.',
        role: 'Frontend Developer',
        duration: '3 months',
        rating: 4.7,
        skills: ['Vue.js', 'Tailwind CSS', 'API Integration'],
      },
    ],
  },
  {
    address: '0x5555555555555555555555555555555555555555',
    ens: 'carol.eth',
    coverLetter: 'Full-stack developer with expertise in Web3. I\'ve worked on multiple DeFi projects and understand the importance of clean, secure code. I specialize in smart contract security and frontend integration.',
    skills: ['React', 'Solidity', 'Node.js', 'Web3.js', 'Hardhat', 'Foundry'],
    rating: 4.9,
    completedProjects: 22,
    appliedAt: '2026-01-19',
    location: 'New York, NY',
    responseTime: '1 hour',
    memberSince: '2020-08-22',
    pastProjects: [
      {
        title: 'DEX Aggregator Protocol',
        description: 'Led the development of a decentralized exchange aggregator routing trades across multiple DEXs for optimal pricing. Audited and secured smart contracts.',
        role: 'Smart Contract Engineer',
        duration: '8 months',
        rating: 5.0,
        link: 'https://dexagg.io',
        skills: ['Solidity', 'Foundry', 'Chainlink', 'TheGraph'],
      },
      {
        title: 'Lending Protocol V2',
        description: 'Architected and implemented a next-gen lending protocol with isolated lending tiers, liquidation protection, and flash loan support.',
        role: 'Core Developer',
        duration: '6 months',
        rating: 4.9,
        skills: ['Solidity', 'TypeScript', 'Aave Integration'],
      },
      {
        title: 'Bridge Interface',
        description: 'Built a user-friendly interface for cross-chain asset transfers with transaction tracking and fee estimation.',
        role: 'Frontend Developer',
        duration: '3 months',
        rating: 4.8,
        skills: ['React', 'Wagmi', 'RainbowKit', 'Connext'],
      },
    ],
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    ens: 'david.eth',
    coverLetter: 'I specialize in frontend development with a focus on user experience. I believe in creating interfaces that are both beautiful and functional. My designs prioritize accessibility and performance.',
    skills: ['React', 'Vue.js', 'UI/UX Design', 'Figma', 'Adobe XD', 'CSS animations'],
    rating: 4.6,
    completedProjects: 8,
    appliedAt: '2026-01-18',
    location: 'London, UK',
    responseTime: '4 hours',
    memberSince: '2022-01-10',
    pastProjects: [
      {
        title: 'Crypto Portfolio App',
        description: 'Designed and developed a mobile-first portfolio tracking app with beautiful charts and seamless animations. Featured in Product Hunt.',
        role: 'UI/UX Designer & Developer',
        duration: '5 months',
        rating: 4.7,
        link: 'https://cryptoportfolio.app',
        skills: ['Vue.js', 'D3.js', 'Framer Motion', 'Figma'],
      },
      {
        title: 'Wallet Redesign',
        description: 'Ledend a complete redesign of a popular crypto wallet, improving user onboarding by 60% and reducing support tickets by 40%.',
        role: 'Lead Designer',
        duration: '4 months',
        rating: 4.5,
        skills: ['Figma', 'User Research', 'Prototyping', 'Design System'],
      },
    ],
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    ens: 'alice.eth',
    coverLetter: 'Passionate developer with a strong background in building scalable web applications. Love working in agile teams and delivering results. Experienced in both Web2 and Web3 development.',
    skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL'],
    rating: 4.7,
    completedProjects: 12,
    appliedAt: '2026-01-17',
    location: 'Remote (Worldwide)',
    responseTime: '3 hours',
    memberSince: '2021-06-01',
    pastProjects: [
      {
        title: 'SaaS Analytics Platform',
        description: 'Built a full-stack analytics platform for e-commerce businesses with real-time dashboards, custom reports, and integrations with major payment processors.',
        role: 'Full Stack Developer',
        duration: '10 months',
        rating: 4.8,
        link: 'https://analytics.io',
        skills: ['React', 'Node.js', 'PostgreSQL', 'AWS Lambda', 'Redis'],
      },
      {
        title: 'DAO Governance Tool',
        description: 'Developed an on-chain governance platform with proposal creation, voting mechanisms, and delegation features for a 10K member DAO.',
        role: 'Backend Developer',
        duration: '6 months',
        rating: 4.6,
        skills: ['Solidity', 'Node.js', 'IPFS', 'TheGraph'],
      },
      {
        title: 'API Gateway Service',
        description: 'Architected a scalable API gateway serving 1M+ requests per day with rate limiting, caching, and comprehensive monitoring.',
        role: 'Backend Architect',
        duration: '5 months',
        rating: 4.7,
        skills: ['Node.js', 'Kubernetes', 'Redis', 'Prometheus', 'GraphQL'],
      },
    ],
  },
];

type ApplicantStatus = 'pending' | 'kept' | 'rejected';

interface Applicant {
  address: string;
  ens: string;
  coverLetter: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  appliedAt: string;
  location?: string;
  responseTime?: string;
  memberSince?: string;
  pastProjects?: PastProject[];
}

interface ApplicantWithStatus extends Applicant {
  status: ApplicantStatus;
}

export default function POApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<ApplicantWithStatus[]>(
    mockApplicants.map(a => ({ ...a, status: 'pending' }))
  );
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const CARD_WIDTH = 336; // w-80 (320px) + gap (16px)

  // Smart contract hooks
  const { assign, isPending, error, hash, isSuccess } = useAssignFreelancer();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash ?? undefined);

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  // Filter roles that are still hiring
  const hiringRoles = project?.roles.filter(r => r.status === 'hiring') || [];

  // Get pending and kept applicants
  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const keptApplicants = applicants.filter(a => a.status === 'kept');
  const rejectedApplicants = applicants.filter(a => a.status === 'rejected');

  // Create endless loop by duplicating cards (5 sets for smooth infinite scroll)
  const loopedApplicants = pendingApplicants.length > 0
    ? [...pendingApplicants, ...pendingApplicants, ...pendingApplicants, ...pendingApplicants, ...pendingApplicants]
    : [];

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      showTransactionPending(hash, 'Assign Freelancer', chain?.id || 84532);
    }
  }, [isSuccess, hash, chain]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      showTransactionSuccess(hash, 'Freelancer assigned successfully!');
      setAcceptModalOpen(false);
      setSelectedApplicant(null);
      setSelectedRoleId(null);
      setTimeout(() => {
        router.push(`/PO/projects/${projectId}`);
      }, 1500);
    }
  }, [isConfirmed, hash, router, projectId]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      showTransactionError(hash || '0x0', error, 'Failed to assign freelancer');
    }
  }, [error, hash]);

  // Detect centered card in carousel
  useEffect(() => {
    if (!carouselRef.current || pendingApplicants.length === 0) return;

    const carousel = carouselRef.current;
    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const centerIndex = Math.round(scrollLeft / CARD_WIDTH) % pendingApplicants.length;

      // Update active dot for pagination
      setActiveDotIndex(centerIndex);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [pendingApplicants.length, CARD_WIDTH]);

  // Initialize carousel to start at the second set
  useEffect(() => {
    if (carouselRef.current && pendingApplicants.length > 0) {
      const startScroll = pendingApplicants.length * CARD_WIDTH;
      carouselRef.current.scrollTo({ left: startScroll, behavior: 'instant' as ScrollBehavior });
    }
  }, [pendingApplicants.length, CARD_WIDTH]);

  const handleSwipe = (applicantAddress: string, direction: 'left' | 'right') => {
    setApplicants(prev =>
      prev.map(a =>
        a.address === applicantAddress
          ? { ...a, status: direction === 'right' ? 'kept' : 'rejected' }
          : a
      )
    );
  };

  const handleViewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setDetailModalOpen(true);
  };

  const handleAcceptApplicant = (applicant: Applicant, roleId: string) => {
    if (!address || !chain) {
      showError('Wallet Not Connected', 'Please connect your wallet to assign a freelancer');
      return;
    }

    setSelectedApplicant(applicant);
    setSelectedRoleId(roleId);
    setAcceptModalOpen(true);
  };

  const confirmAssignment = async () => {
    if (!selectedApplicant || !selectedRoleId || !project) return;

    try {
      await assign({
        projectId: projectId as `0x${string}`,
        roleId: selectedRoleId as `0x${string}`,
        freelancer: selectedApplicant.address as `0x${string}`,
      });
    } catch (err) {
      const error = err as Error;
      showError('Assignment Failed', error.message);
      setAcceptModalOpen(false);
    }
  };

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center px-4 py-8 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 px-4">The project you're looking for doesn't exist.</p>
        <Link href="/PO/projects">
          <Button variant="primary" size="sm" className="w-full sm:w-auto">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  if (hiringRoles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-4 sm:mb-6">
          <Link href={`/PO/projects/${projectId}`} className="text-brand-600 hover:text-brand-700 text-sm">
            ← Back to Project
          </Link>
        </div>

        <Card className="p-6 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">All Roles Filled</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 px-2">All roles for this project have been assigned.</p>
          <Link href={`/PO/projects/${projectId}`} className="block w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto">View Project</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* Header - Match project detail page style */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/PO/projects/${projectId}`}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={project.status === 'hiring' ? 'warning' : project.status === 'in-progress' ? 'pending' : 'success'}>
              {project.status === 'hiring' ? 'Hiring' : project.status === 'in-progress' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-brand-50/30 border-brand-200/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Budget</p>
            <p className="text-lg sm:text-xl font-bold text-brand-600">
              <CurrencyDisplay amount={formatCurrency(project.totalBudget, project.currency)} currency={project.currency} />
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Open Roles</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{hiringRoles.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Applicants</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{applicants.length}</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-amber-50 border-amber-200">
          <p className="text-[10px] sm:text-xs text-amber-600 font-medium uppercase tracking-wide">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-700">{pendingApplicants.length}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-emerald-50 border-emerald-200">
          <p className="text-[10px] sm:text-xs text-emerald-600 font-medium uppercase tracking-wide">Kept</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700">{keptApplicants.length}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-red-50 border-red-200">
          <p className="text-[10px] sm:text-xs text-red-600 font-medium uppercase tracking-wide">Rejected</p>
          <p className="text-xl sm:text-2xl font-bold text-red-700">{rejectedApplicants.length}</p>
        </Card>
      </div>

      {/* Roles Section */}
      {hiringRoles.map((role) => (
        <div key={role.id} className="space-y-4">
          {/* Role Header */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200">
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{role.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs sm:text-sm font-semibold text-brand-600 inline-flex items-center gap-1">
                    Budget: <CurrencyDisplay amount={formatCurrency(role.budget, role.currency)} currency={role.currency} />
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-600">{applicants.length} applicants</span>
                </div>
              </div>
              <Badge variant="pending" className="shrink-0">Hiring</Badge>
            </div>

            {/* Required Skills */}
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {role.skills.map((skill) => (
                  <Badge key={skill} variant="default" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Pending Applicants - Swipeable Carousel */}
          {pendingApplicants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Review Applicants ({pendingApplicants.length})
                <span className="text-xs text-slate-500 font-normal">• Swipe to review</span>
              </h3>

              {/* Carousel Container */}
              <div className="relative -mx-2 px-2">
                <style jsx>{`
                  .carousel-container::-webkit-scrollbar {
                    display: none;
                  }
                  .carousel-container {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    scroll-behavior: smooth;
                  }
                `}</style>
                <div
                  ref={carouselRef}
                  className="carousel-container flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth"
                  style={{ scrollPadding: '0 calc(50% - 160px)' }}
                >
                  {/* Render looped applicants for endless scroll */}
                  {loopedApplicants.map((applicant, index) => {
                    const baseIndex = index % pendingApplicants.length;
                    return (
                      <div
                        key={`${applicant.address}-${index}`}
                        className="flex-shrink-0 w-80 snap-center"
                        data-applicant-index={baseIndex}
                      >
                        {/* Applicant Card - Simple static card like portfolio page */}
                        <Card
                          className="p-4 sm:p-5 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer hover:border-brand-300"
                          onClick={() => handleViewApplicant(applicant)}
                        >
                          <div className="flex flex-col gap-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-white">
                                  {applicant.ens?.[0].toUpperCase() || applicant.address.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-semibold text-slate-900 truncate">{applicant.ens || applicant.address.slice(0, 10)}</h3>
                                  <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-xs text-slate-500 font-mono truncate">{applicant.address}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-slate-700">{applicant.rating}</span>
                                  </div>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-600">{applicant.completedProjects} projects</span>
                                </div>
                              </div>
                            </div>

                            {/* Cover Letter */}
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{applicant.coverLetter}</p>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1">
                              {applicant.skills.slice(0, 4).map((skill) => (
                                <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  {skill}
                                </span>
                              ))}
                              {applicant.skills.length > 4 && (
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  +{applicant.skills.length - 4}
                                </span>
                              )}
                            </div>

                            {/* Click hint */}
                            <div className="flex items-center gap-1 text-xs text-brand-600 pt-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View details</span>
                            </div>
                          </div>
                        </Card>

                        {/* Reject/Keep Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwipe(applicant.address, 'left')}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSwipe(applicant.address, 'right')}
                            className="flex-1 transition-all duration-200"
                          >
                            Keep
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stripe pagination dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {pendingApplicants.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (carouselRef.current) {
                          // Calculate target scroll to the middle set (2nd set)
                          const targetScroll = (index * CARD_WIDTH) + (pendingApplicants.length * CARD_WIDTH);
                          carouselRef.current.scrollTo({
                            left: targetScroll,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeDotIndex === index
                          ? 'w-8 bg-brand-500 shadow-md'
                          : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to applicant ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layer 2: Kept Applicants - Comparison View */}
          {keptApplicants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Saved for Later ({keptApplicants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {keptApplicants.map((applicant) => (
                  <KeptApplicantCard
                    key={applicant.address}
                    applicant={applicant}
                    onAccept={() => handleAcceptApplicant(applicant, role.id)}
                    onRemove={() => handleSwipe(applicant.address, 'left')}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingApplicants.length === 0 && keptApplicants.length === 0 && (
            <Card className="p-6 sm:p-8 text-center bg-slate-50 border-dashed">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-slate-600">No applicants to review</p>
            </Card>
          )}
        </div>
      ))}

      {/* Accept Application Modal */}
      <Modal isOpen={acceptModalOpen} onClose={() => setAcceptModalOpen(false)} title="Confirm Assignment">
        <div className="space-y-4">
          {selectedApplicant && (
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-base sm:text-lg font-bold text-white">
                    {selectedApplicant.ens?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 truncate">{selectedApplicant.ens}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-mono truncate">{selectedApplicant.address}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">{selectedApplicant.coverLetter}</p>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-emerald-800">
              <strong>Important:</strong> Once assigned, the freelancer will be able to start working on KPIs.
              You can only reassign after project cancellation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="ghost" onClick={() => setAcceptModalOpen(false)} className="w-full sm:flex-1" disabled={isPending || isConfirming}>
              Cancel
            </Button>
            <Button variant="success" onClick={confirmAssignment} className="w-full sm:flex-1" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Assigning...
                </span>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Applicant Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Applicant Details" size="xl">
        {selectedApplicant && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {selectedApplicant.ens?.[0].toUpperCase() || selectedApplicant.address.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900">{selectedApplicant.ens || 'Anonymous'}</h3>
                <p className="text-sm text-slate-500 font-mono truncate">{selectedApplicant.address}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">{selectedApplicant.rating}</span>
                    <span className="text-xs text-slate-500">rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">{selectedApplicant.completedProjects}</span>
                    <span className="text-xs text-slate-500">projects</span>
                  </div>
                  {selectedApplicant.location && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-slate-600">{selectedApplicant.location}</span>
                    </div>
                  )}
                  {selectedApplicant.responseTime && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-slate-600">Responds in {selectedApplicant.responseTime}</span>
                    </div>
                  )}
                  {selectedApplicant.memberSince && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-slate-600">Since {new Date(selectedApplicant.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Cover Letter</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedApplicant.coverLetter}</p>
            </div>

            {/* Skills */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.skills.map((skill) => (
                  <span key={skill} className="text-sm bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Past Projects */}
            {selectedApplicant.pastProjects && selectedApplicant.pastProjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Past Projects</p>
                <div className="space-y-4">
                  {selectedApplicant.pastProjects.map((project, index) => (
                    <Card key={index} className="p-4 border border-slate-200 hover:border-brand-300 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{project.title}</h4>
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-brand-600 font-medium mb-2">{project.role}</p>
                          <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-amber-700">{project.rating}</span>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{project.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                          {project.skills.length > 4 && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              +{project.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Applied Date */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Applied on {new Date(selectedApplicant.appliedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleSwipe(selectedApplicant.address, 'left');
                }}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleSwipe(selectedApplicant.address, 'right');
                }}
                className="flex-1"
              >
                Keep
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Kept Applicant Card Component
interface KeptApplicantCardProps {
  applicant: ApplicantWithStatus;
  onAccept: () => void;
  onRemove: () => void;
}

function KeptApplicantCard({ applicant, onAccept, onRemove }: KeptApplicantCardProps) {
  return (
    <Card className="p-4 sm:p-5 border-2 border-emerald-200 bg-emerald-50/50 hover:shadow-md transition-all">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">
              {applicant.ens?.[0].toUpperCase() || applicant.address.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 truncate">{applicant.ens || applicant.address.slice(0, 10)}</h3>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">Saved</span>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">{applicant.address}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-slate-700">{applicant.rating}</span>
              </div>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-600">{applicant.completedProjects} projects</span>
            </div>
          </div>
        </div>

        {/* Cover Letter */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{applicant.coverLetter}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {applicant.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
              {skill}
            </span>
          ))}
          {applicant.skills.length > 4 && (
            <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
              +{applicant.skills.length - 4}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-emerald-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
          >
            Remove
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={onAccept}
            className="flex-1 text-xs sm:text-sm"
          >
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
}
