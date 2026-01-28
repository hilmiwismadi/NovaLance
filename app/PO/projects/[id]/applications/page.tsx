'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getPOProjectById, formatCurrency } from '@/lib/mockData';
import { useAssignFreelancer, useTransactionWait } from '@/lib/hooks';
import {
  showTransactionPending,
  showTransactionSuccess,
  showTransactionError,
  showError,
} from '@/lib/transactions';

// Mock applicants data - in production, this would come from the smart contract
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
];

export default function POApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<typeof mockApplicants[0] | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Smart contract hooks
  const { assign, isPending, error, hash, isSuccess } = useAssignFreelancer();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useTransactionWait(hash);

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  // Filter roles that are still hiring
  const hiringRoles = project?.roles.filter(r => r.status === 'hiring') || [];

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

  const handleAcceptApplicant = (applicant: typeof mockApplicants[0], roleId: string) => {
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link href={`/PO/projects/${projectId}`} className="text-brand-600 hover:text-brand-700 text-sm">
          ← Back to Project
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 sm:mt-4">Applications</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">{project.title}</p>
      </div>

      {/* Roles and Applicants */}
      <div className="space-y-6 sm:space-y-8">
        {hiringRoles.map((role) => (
          <div key={role.id} className="space-y-3 sm:space-y-4">
            {/* Role Header */}
            <Card className="p-4 sm:p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{role.title}</h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">{role.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                    <span className="text-xs sm:text-sm font-semibold text-brand-600">
                      Budget: {formatCurrency(role.budget, role.currency)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 hidden sm:inline">•</span>
                    <span className="text-xs sm:text-sm text-slate-600">{mockApplicants.length} applicant{mockApplicants.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Badge variant="pending" className="self-start sm:self-center">Hiring</Badge>
              </div>

              {/* Required Skills */}
              <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Required Skills:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {role.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Applicants List */}
            <div className="space-y-3 sm:space-y-4">
              {mockApplicants.map((applicant) => (
                <Card key={applicant.address} className="p-4 sm:p-6">
                  <div className="flex flex-row items-start gap-3 sm:gap-6">
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        {applicant.ens?.[0].toUpperCase() || applicant.address.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{applicant.ens || applicant.address.slice(0, 10)}</h3>
                          <p className="text-xs text-slate-500 font-mono truncate">{applicant.address}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-semibold text-slate-900">{applicant.rating}</span>
                          <span className="text-xs text-slate-500 hidden sm:inline">•</span>
                          <span className="text-xs sm:text-sm text-slate-600">{applicant.completedProjects} proj{applicant.completedProjects === 1 ? '' : 's'}</span>
                        </div>
                      </div>

                      {/* Cover Letter */}
                      <div className="mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3">{applicant.coverLetter}</p>
                      </div>

                      {/* Skills */}
                      <div className="mb-3 sm:mb-4">
                        <p className="text-xs font-medium text-slate-700 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {applicant.skills.map((skill) => (
                            <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptApplicant(applicant, role.id)}
                          disabled={isPending || isConfirming}
                          className="flex-1 sm:flex-initial"
                        >
                          Accept
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                          Profile
                        </Button>
                        <span className="text-xs text-slate-500 ml-auto sm:ml-0">Applied {applicant.appliedAt}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

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
