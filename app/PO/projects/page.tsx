'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';
import { usePLProjectCount } from '@/lib/hooks';

// Project data interface for contract data
interface ContractProject {
  id: bigint;
  creator: string;
  freelancer: string;
  status: number; // 0=Active, 2=Completed, 3=Cancelled (Assigned status is never set by contract)
  totalDeposited: bigint;
  vaultAmount: bigint;
  lendingAmount: bigint;
  milestoneCount: bigint;
}

// Custom hook to fetch multiple projects
function usePOProjects(maxProjects: number = 50) {
  const { address, chain } = useAccount();
  const [projects, setProjects] = useState<ContractProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !chain) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { getContractAddresses } = await import('@/lib/contract-adapter');
        const { PROJECTLANCE_ABI } = await import('@/lib/abi');
        const { createPublicClient, http } = await import('viem');

        const publicClient = createPublicClient({
          chain: chain,
          transport: http()
        });

        const addresses = getContractAddresses(chain.id);
        const projectLanceAddress = addresses.projectLance;

        // Get total project count first
        const countResult = await publicClient.readContract({
          address: projectLanceAddress as `0x${string}`,
          abi: PROJECTLANCE_ABI,
          functionName: 'projectCount',
        }) as bigint;

        const totalCount = Number(countResult);
        const maxToFetch = Math.min(totalCount, maxProjects);

        // Fetch all projects in parallel
        const projectPromises = [];
        for (let i = 0; i < maxToFetch; i++) {
          projectPromises.push(
            publicClient.readContract({
              address: projectLanceAddress as `0x${string}`,
              abi: PROJECTLANCE_ABI,
              functionName: 'getProject',
              args: [BigInt(i)]
            }).catch(() => null)
          );
        }

        const results = await Promise.all(projectPromises);

        const userProjects: ContractProject[] = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i] as any[] | null;
          if (!result) continue;

          const creator = result[0] as string;
          const freelancer = result[1] as string;
          const status = result[2] as number;
          const totalDeposited = result[3] as bigint;
          const vaultAmount = result[4] as bigint;
          const lendingAmount = result[5] as bigint;
          const milestoneCount = result[6] as bigint;

          // Only include projects created by this user
          if (creator.toLowerCase() === address.toLowerCase()) {
            userProjects.push({
              id: BigInt(i),
              creator,
              freelancer,
              status,
              totalDeposited,
              vaultAmount,
              lendingAmount,
              milestoneCount,
            });
          }
        }

        setProjects(userProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [address, chain, maxProjects]);

  return { projects, isLoading };
}

type FilterType = 'all' | 'active' | 'hired' | 'completed' | 'cancelled';

interface FilterConfig {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const filters: FilterConfig[] = [
  {
    key: 'all',
    label: 'All Projects',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    key: 'active',
    label: 'Active',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'hired',
    label: 'Hired',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
    color: 'text-brand-700',
    bgColor: 'bg-brand-100',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: `<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>`,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
];

export default function POProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { projects, isLoading } = usePOProjects(50);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filter projects based on selected filter
  const filteredProjects = projects.filter(project => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return project.status === 0;
    if (selectedFilter === 'hired') return project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000';
    if (selectedFilter === 'completed') return project.status === 2;
    if (selectedFilter === 'cancelled') return project.status === 3;
    return true;
  });

  const getStatusText = (project: ContractProject) => {
    if (project.status === 3) return 'Cancelled';
    if (project.status === 2) return 'Completed';
    // For Active projects, show "Hired" if freelancer is assigned, otherwise "Active"
    if (project.status === 0) {
      return project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000' ? 'Hired' : 'Active';
    }
    return 'Unknown';
  };

  const getStatusVariant = (project: ContractProject): string => {
    if (project.status === 3) return 'error';
    if (project.status === 2) return 'success';
    if (project.status === 0) {
      return project.freelancer && project.freelancer !== '0x0000000000000000000000000000000000000000' ? 'info' : 'warning';
    }
    return 'default';
  };

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900">My Projects</h1>
          <Link href="/PO/create-project">
            <Button variant="primary" size="sm" className="h-9">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === filter.key
                  ? `${filter.bgColor} ${filter.color}`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span dangerouslySetInnerHTML={{ __html: filter.icon }} />
              {filter.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                selectedFilter === filter.key ? 'bg-white/50' : 'bg-slate-200'
              }`}>
                {filter.key === 'all'
                  ? projects.length
                  : projects.filter(p => {
                      if (filter.key === 'active') return p.status === 0;
                      if (filter.key === 'hired') return p.freelancer && p.freelancer !== '0x0000000000000000000000000000000000000000';
                      if (filter.key === 'completed') return p.status === 2;
                      if (filter.key === 'cancelled') return p.status === 3;
                      return true;
                    }).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Projects Yet</h3>
            <p className="text-slate-600 mb-6">Create your first project to start hiring freelancers.</p>
            <Link href="/PO/create-project">
              <Button variant="primary">Create Project</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id.toString()} href={`/PO/projects/${project.id}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">Project #{project.id}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {project.milestoneCount} milestone{project.milestoneCount > 1n ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(project) as any}>
                      {getStatusText(project)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Deposited</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(project.totalDeposited, 'IDRX')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Vault</span>
                      <span className="font-medium text-brand-600">
                        {formatCurrency(project.vaultAmount, 'IDRX')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Lending</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(project.lendingAmount, 'IDRX')}
                      </span>
                    </div>
                  </div>

                  {project.freelancer !== '0x0000000000000000000000000000000000000000' && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Freelancer: {project.freelancer.slice(0, 6)}...{project.freelancer.slice(-4)}
                      </p>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
