import type {
  UserProfile,
  PublicUserStats,
  Project,
  Application,
  Kpi,
  NonceResponse,
  VerifyResponse,
  FreelancerBalance,
  ProjectBalancesResponse,
} from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://novalance-be.vercel.app';

// Get stored JWT token
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('novalance_jwt');
}

// Set JWT token
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  console.log('💾 setToken called with:', token.substring(0, 30) + '...');
  localStorage.setItem('novalance_jwt', token);
  console.log('✅ setToken: Token stored in localStorage');

  // Verify it was stored
  const verify = localStorage.getItem('novalance_jwt');
  console.log('🔍 setToken: Verification - token in storage:', !!verify);
}

// Clear JWT token
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('novalance_jwt');
}

// API fetch wrapper with auth
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response;
}

// Auth APIs
export const authApi = {
  async getNonce(address: string): Promise<NonceResponse> {
    const res = await apiFetch('/api/auth/wallet/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
    return res.json();
  },

  async verifySignature(address: string, signature: string): Promise<VerifyResponse> {
    const res = await apiFetch('/api/auth/wallet/verify', {
      method: 'POST',
      body: JSON.stringify({ address, signature }),
    });
    return res.json();
  },
};

// User APIs
export const userApi = {
  async getProfile(): Promise<{ user: UserProfile }> {
    const res = await apiFetch('/api/users/me');
    return res.json();
  },

  async updateProfile(data: Partial<Pick<UserProfile, 'email' | 'githubUrl' | 'linkedinUrl' | 'bio' | 'ens' | 'skills'>>): Promise<{ user: UserProfile }> {
    const res = await apiFetch('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getPublicProfile(address: string): Promise<{ user: UserProfile; stats: PublicUserStats }> {
    const res = await apiFetch(`/api/users/${address}`);
    return res.json();
  },

  async getFreelancerBalance(): Promise<FreelancerBalance> {
    const res = await apiFetch('/api/users/me/balance');
    return res.json();
  },

  async getProjectBalances(): Promise<ProjectBalancesResponse> {
    const res = await apiFetch('/api/users/me/project-balances');
    return res.json();
  },
};

// Project APIs
export const projectApi = {
  async list(params?: {
    search?: string;
    status?: string;
    skills?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: Project[] }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.skills) searchParams.set('skills', params.skills);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    const res = await apiFetch(`/api/projects${query ? `?${query}` : ''}`);
    return res.json();
  },

  async get(id: string): Promise<{ project: Project }> {
    const res = await apiFetch(`/api/projects/${id}`);
    return res.json();
  },

  async create(data: {
    id?: string;
    title: string;
    description: string;
    timelineStart: string;
    timelineEnd: string;
  }): Promise<{ project: Project }> {
    const res = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Create a role for a project
  async createRole(projectId: string, data: {
    name: string;
    description: string;
    kpiCount: number;
    paymentPerKpi: string;
    skills?: string[];
  }): Promise<{ role: any }> {
    const res = await apiFetch(`/api/projects/${projectId}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Get roles for a project
  async getRoles(projectId: string): Promise<{ roles: any[] }> {
    const res = await apiFetch(`/api/projects/${projectId}/roles`);
    return res.json();
  },

  // Create KPIs for a role
  async createKpis(projectId: string, roleId: string, kpis: Array<{
    kpiNumber: number;
    description: string;
    deadline: string;
  }>): Promise<{ kpis: any[] }> {
    const res = await apiFetch(`/api/projects/${projectId}/roles/${roleId}/kpis`, {
      method: 'POST',
      body: JSON.stringify({ kpis }),
    });
    return res.json();
  },

  // Get KPIs for a role
  async getKpis(projectId: string, roleId: string): Promise<{ kpis: any[] }> {
    const res = await apiFetch(`/api/projects/${projectId}/roles/${roleId}/kpis`);
    return res.json();
  },
};

// Application APIs
export const applicationApi = {
  async getMyApplications(): Promise<{ applications: Application[] }> {
    const res = await apiFetch('/api/applications/my');
    return res.json();
  },

  async submitApplication(roleId: string, coverLetter: string): Promise<{ application: Application }> {
    const res = await apiFetch(`/api/applications?roleId=${roleId}`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    });
    return res.json();
  },

  async getApplicantsForRole(roleId: string): Promise<{ applicants: Application[] }> {
    const res = await apiFetch(`/api/applications/role/${roleId}`);
    return res.json();
  },

  async acceptApplication(id: string): Promise<any> {
    const res = await apiFetch(`/api/applications/${id}/accept`, {
      method: 'POST',
    });
    return res.json();
  },

  async rejectApplication(id: string, comment: string): Promise<any> {
    const res = await apiFetch(`/api/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    return res.json();
  },
};

// KPI APIs
export const kpiApi = {
  async getMyPending(): Promise<{ kpis: Kpi[] }> {
    const res = await apiFetch('/api/kpis/my/pending');
    return res.json();
  },

  async submitKpi(id: string, data?: { submissionData?: string; deliverables?: { links: string[]; description: string } }): Promise<{ kpi: Kpi }> {
    const res = await apiFetch(`/api/kpis/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return res.json();
  },

  async confirmKpi(id: string): Promise<{ kpi: Kpi }> {
    const res = await apiFetch(`/api/kpis/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return res.json();
  },

  async approveKpi(id: string, comment?: string): Promise<{ kpi: Kpi }> {
    const res = await apiFetch(`/api/kpis/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    return res.json();
  },

  async rejectKpi(id: string, comment: string): Promise<{ kpi: Kpi }> {
    const res = await apiFetch(`/api/kpis/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    return res.json();
  },
};
