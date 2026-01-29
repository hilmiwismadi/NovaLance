'use client';

import { useState, useEffect, useRef } from 'react';
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

// Mock applicants data
const mockApplicants = [
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ens: 'bob.eth',
    coverLetter: 'I have 5 years of experience with React and TypeScript. I\'ve built several similar projects and can deliver high-quality code within deadlines.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    rating: 4.8,
    completedProjects: 15,
    appliedAt: '2026-01-20',
  },
  {
    address: '0x5555555555555555555555555555555555555555',
    ens: 'carol.eth',
    coverLetter: 'Full-stack developer with expertise in Web3. I\'ve worked on multiple DeFi projects and understand the importance of clean, secure code.',
    skills: ['React', 'Solidity', 'Node.js', 'Web3.js'],
    rating: 4.9,
    completedProjects: 22,
    appliedAt: '2026-01-19',
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    ens: 'david.eth',
    coverLetter: 'I specialize in frontend development with a focus on user experience. I believe in creating interfaces that are both beautiful and functional.',
    skills: ['React', 'Vue.js', 'UI/UX Design', 'Figma'],
    rating: 4.6,
    completedProjects: 8,
    appliedAt: '2026-01-18',
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    ens: 'alice.eth',
    coverLetter: 'Passionate developer with a strong background in building scalable web applications. Love working in agile teams and delivering results.',
    skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
    rating: 4.7,
    completedProjects: 12,
    appliedAt: '2026-01-17',
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
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<ApplicantWithStatus[]>(
    mockApplicants.map(a => ({ ...a, status: 'pending' }))
  );

  // Smart contract hooks
  const { assign, isPending, error, hash, isSuccess } = useAssignFreelancer();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash);

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  // Filter roles that are still hiring
  const hiringRoles = project?.roles.filter(r => r.status === 'hiring') || [];

  // Get pending and kept applicants
  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const keptApplicants = applicants.filter(a => a.status === 'kept');
  const rejectedApplicants = applicants.filter(a => a.status === 'rejected');

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

  const handleSwipe = (applicantAddress: string, direction: 'left' | 'right') => {
    setApplicants(prev =>
      prev.map(a =>
        a.address === applicantAddress
          ? { ...a, status: direction === 'right' ? 'kept' : 'rejected' }
          : a
      )
    );
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
            <Badge variant={project.status === 'hiring' ? 'warning' : project.status === 'in-progress' ? 'info' : 'success'}>
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

          {/* Layer 1: Pending Applicants - Swipeable Cards */}
          {pendingApplicants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Review Applicants ({pendingApplicants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {pendingApplicants.map((applicant) => (
                  <SwipeableApplicantCard
                    key={applicant.address}
                    applicant={applicant}
                    onSwipe={(direction) => handleSwipe(applicant.address, direction)}
                    onAccept={() => handleAcceptApplicant(applicant, role.id)}
                  />
                ))}
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
    </div>
  );
}

// Swipeable Applicant Card Component
interface SwipeableApplicantCardProps {
  applicant: ApplicantWithStatus;
  onSwipe: (direction: 'left' | 'right') => void;
  onAccept: () => void;
}

function SwipeableApplicantCard({ applicant, onSwipe, onAccept }: SwipeableApplicantCardProps) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStart;
    setDragOffset(Math.max(-150, Math.min(150, offset)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(dragOffset) > 75) {
      onSwipe(dragOffset > 0 ? 'right' : 'left');
    }
    setDragStart(null);
    setDragOffset(0);
  };

  return (
    <div
      ref={cardRef}
      className="relative touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Background indicators */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
            dragOffset > 30 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div
          className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
            dragOffset < -30 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card */}
      <Card
        className="p-4 sm:p-5 transition-all duration-300 border-2 hover:shadow-lg"
        style={{
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
          opacity: 1 - Math.abs(dragOffset) / 300,
        }}
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
              <h3 className="text-base font-semibold text-slate-900 truncate">{applicant.ens || applicant.address.slice(0, 10)}</h3>
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

          {/* Action Buttons - Desktop fallback */}
          <div className="hidden sm:flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwipe('left')}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSwipe('right')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Keep
            </Button>
          </div>

          {/* Mobile hint */}
          <div className="sm:hidden flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-xs text-slate-500">Swipe to review</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Card>
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
