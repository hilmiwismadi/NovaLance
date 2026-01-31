import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  userApi,
  projectApi,
  applicationApi,
  kpiApi,
  setToken,
  clearToken,
} from './api-client';
import type {
  UserProfile,
  PublicUserStats,
  Project,
  Application,
  Kpi,
  FreelancerBalance,
  ProjectBalancesResponse,
} from './api-types';

// Query keys
export const queryKeys = {
  user: ['user'] as const,
  userProfile: (address: string) => ['user', address] as const,
  freelancerBalance: ['balance', 'freelancer'] as const,
  projectBalances: ['balance', 'projects'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  myApplications: ['applications', 'mine'] as const,
  roleApplicants: (roleId: string) => ['applications', 'role', roleId] as const,
  pendingKpis: ['kpis', 'pending'] as const,
};

// Auth hooks
export function useNonce() {
  return useMutation({
    mutationFn: (address: string) => authApi.getNonce(address),
  });
}

export function useVerifySignature() {
  return useMutation({
    mutationFn: ({ address, signature }: { address: string; signature: string }) =>
      authApi.verifySignature(address, signature),
    onSuccess: (data) => {
      setToken(data.token);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearToken();
    queryClient.clear();
  };
}

// User hooks
export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => userApi.getProfile(),
    select: (data) => data.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<UserProfile, 'email' | 'githubUrl' | 'linkedinUrl' | 'bio' | 'ens' | 'skills'>>) =>
      userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function usePublicProfile(address: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(address),
    queryFn: () => userApi.getPublicProfile(address),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreelancerBalance() {
  return useQuery({
    queryKey: queryKeys.freelancerBalance,
    queryFn: () => userApi.getFreelancerBalance(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useProjectBalances() {
  return useQuery({
    queryKey: queryKeys.projectBalances,
    queryFn: () => userApi.getProjectBalances(),
    staleTime: 30 * 1000,
  });
}

// Project hooks
export function useProjects(params?: {
  search?: string;
  status?: string;
  skills?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.projects, params],
    queryFn: () => projectApi.list(params),
    select: (data) => data.projects,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectApi.get(id),
    select: (data) => data.project,
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      timelineStart: string;
      timelineEnd: string;
    }) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// Application hooks
export function useMyApplications() {
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: () => applicationApi.getMyApplications(),
    select: (data) => data.applications,
    staleTime: 30 * 1000,
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, coverLetter }: { roleId: string; coverLetter: string }) =>
      applicationApi.submitApplication(roleId, coverLetter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myApplications });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useRoleApplicants(roleId: string) {
  return useQuery({
    queryKey: queryKeys.roleApplicants(roleId),
    queryFn: () => applicationApi.getApplicantsForRole(roleId),
    select: (data) => data.applicants,
    enabled: !!roleId,
    staleTime: 30 * 1000,
  });
}

export function useAcceptApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationApi.acceptApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myApplications });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      applicationApi.rejectApplication(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myApplications });
    },
  });
}

// KPI hooks
export function usePendingKpis() {
  return useQuery({
    queryKey: queryKeys.pendingKpis,
    queryFn: () => kpiApi.getMyPending(),
    select: (data) => data.kpis,
    staleTime: 30 * 1000,
  });
}

export function useSubmitKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { submissionData?: string; deliverables?: { links: string[]; description: string } } }) =>
      kpiApi.submitKpi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingKpis });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useConfirmKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kpiApi.confirmKpi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingKpis });
      queryClient.invalidateQueries({ queryKey: queryKeys.freelancerBalance });
    },
  });
}

export function useApproveKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      kpiApi.approveKpi(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingKpis });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useRejectKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      kpiApi.rejectKpi(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingKpis });
    },
  });
}
