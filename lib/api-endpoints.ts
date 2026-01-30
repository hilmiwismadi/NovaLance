/**
 * NovaLance API Endpoints Structure
 *
 * This file shows the complete API structure for KPI submission and multi-sig approval.
 * Use this as a reference for implementing actual API routes.
 */

// ============================================================================
// API ROUTE STRUCTURE
// ============================================================================

/**
 * API ROUTES FOR KPI FLOW
 *
 * FL ENDPOINTS (Freelancer):
 * ===========================
 * POST   /api/fl/kpi/submit                 - Submit KPI for PO approval
 * POST   /api/fl/kpi/confirm                - Confirm KPI (multi-sig)
 * GET    /api/fl/kpi/:projectId/:kpiId      - Get KPI details
 * GET    /api/fl/notifications              - Get FL's notifications
 * PUT    /api/fl/notifications/:id/read     - Mark notification as read
 * GET    /api/fl/balance                    - Get withdrawable balance
 *
 * PO ENDPOINTS (Project Owner):
 * ===============================
 * POST   /api/po/kpi/approve                - Approve submitted KPI
 * POST   /api/po/kpi/reject                 - Reject submitted KPI
 * GET    /api/po/kpi/pending                - Get KPIs pending review
 * GET    /api/po/notifications              - Get PO's notifications
 * PUT    /api/po/notifications/:id/read     - Mark notification as read
 * GET    /api/po/balance                    - Get withdrawable balance
 *
 * SHARED ENDPOINTS:
 * ==================
 * GET    /api/kpi/:projectId/:roleId/:kpiId - Get KPI details
 * GET    /api/project/:projectId            - Get project details
 * GET    /api/notifications/count           - Get unread notification count
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

// ========== FL: Submit KPI ==========
interface SubmitKPIRequest {
  projectId: string;
  roleId: string;
  kpiId: string;
  deliverables: {
    links: string[];
    description: string;
  };
}

interface SubmitKPIResponse {
  success: boolean;
  kpi: {
    id: string;
    name: string;
    status: 'pending-approval';
    submittedAt: string;
    deliverables: {
      links: string[];
      description: string;
    };
  };
  message: string;
}

// ========== PO: Approve KPI ==========
interface ApproveKPIRequest {
  projectId: string;
  roleId: string;
  kpiId: string;
}

interface ApproveKPIResponse {
  success: boolean;
  kpi: {
    id: string;
    name: string;
    status: 'pending-approval';
    poApproved: boolean;
    flApproved: boolean;
  };
  message: string;
  nextStep: 'awaiting_fl_confirmation';
}

// ========== PO: Reject KPI ==========
interface RejectKPIRequest {
  projectId: string;
  roleId: string;
  kpiId: string;
  reason: string; // Required
}

interface RejectKPIResponse {
  success: boolean;
  kpi: {
    id: string;
    name: string;
    status: 'rejected';
    rejectionReason: string;
  };
  message: string;
}

// ========== FL: Confirm KPI ==========
interface ConfirmKPIRequest {
  projectId: string;
  roleId: string;
  kpiId: string;
}

interface ConfirmKPIResponse {
  success: boolean;
  kpi: {
    id: string;
    name: string;
    status: 'approved';
    poApproved: true;
    flApproved: true;
    completedAt: string;
  };
  payment: {
    baseAmount: number;
    yieldPercent: number;
    totalYield: number;
    flShare: number; // Amount added to FL's withdrawable balance
  };
  newBalance: number; // FL's new withdrawable balance
  message: string;
}

// ========== Notifications ==========
interface Notification {
  id: string;
  type: 'kpi_submission' | 'kpi_approved_awaiting_confirmation' | 'kpi_rejected' | 'payment_released';
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  roleId: string;
  kpiId: string;
  kpiName: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string; // Link to take action
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

// ============================================================================
// NEXT.JOBS API ROUTE IMPLEMENTATION EXAMPLE
// ============================================================================

/**
 * File: app/api/fl/kpi/submit/route.ts
 *
 * POST /api/fl/kpi/submit
 *
 * FL submits KPI deliverables for PO review
 */

/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { uploadToIPFS } from '@/lib/ipfs';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession();
    if (!session?.user?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: SubmitKPIRequest = await req.json();
    const { projectId, roleId, kpiId, deliverables } = body;

    // 3. Validate input
    if (!deliverables?.description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // 4. Verify user is assigned to this role
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        projectId,
        assignedTo: session.user.address,
      },
      include: {
        project: true,
        kpis: {
          where: { id: kpiId },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found or not assigned to you' },
        { status: 404 }
      );
    }

    const kpi = role.kpis[0];
    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // 5. Validate KPI status (must be in-progress or rejected for resubmission)
    if (kpi.status !== 'in-progress' && kpi.status !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'KPI is not ready for submission' },
        { status: 400 }
      );
    }

    // 6. Upload deliverables to IPFS
    const deliverablesHash = await uploadToIPFS({
      ...deliverables,
      submittedAt: new Date().toISOString(),
      submittedBy: session.user.address,
    });

    // 7. Update KPI in database
    const updatedKPI = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        status: 'pending-approval',
        deliverablesHash,
        submittedAt: new Date(),
        // Clear rejection reason if resubmitting
        rejectionReason: null,
        poApproved: false,
        flApproved: false,
      },
    });

    // 8. Create notification for PO
    await prisma.notification.create({
      data: {
        type: 'kpi_submission',
        recipientAddress: role.project.ownerAddress,
        recipientRole: 'PO',
        title: 'KPI Submitted for Review',
        message: `${session.user.ens || session.user.address} submitted "${kpi.name}" for review`,
        projectId,
        roleId,
        kpiId,
        actionUrl: `/PO/projects/${projectId}`,
      },
    });

    // 9. Return response
    return NextResponse.json<SubmitKPIResponse>({
      success: true,
      kpi: {
        id: updatedKPI.id,
        name: updatedKPI.name,
        status: 'pending-approval',
        submittedAt: updatedKPI.submittedAt.toISOString(),
        deliverables: {
          links: deliverables.links,
          description: deliverables.description,
        },
      },
      message: 'KPI submitted successfully. Project owner will be notified.',
    });

  } catch (error) {
    console.error('Error submitting KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

/**
 * File: app/api/po/kpi/approve/route.ts
 *
 * POST /api/po/kpi/approve
 *
 * PO approves a submitted KPI (first signature)
 */

/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate as PO
    const session = await getServerSession();
    if (!session?.user?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: ApproveKPIRequest = await req.json();
    const { projectId, roleId, kpiId } = body;

    // 3. Verify user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerAddress: session.user.address,
      },
      include: {
        roles: {
          where: { id: roleId },
          include: {
            kpis: {
              where: { id: kpiId },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or not owned by you' },
        { status: 404 }
      );
    }

    const role = project.roles[0];
    const kpi = role?.kpis[0];

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // 4. Validate KPI status
    if (kpi.status !== 'pending-approval') {
      return NextResponse.json(
        { success: false, error: 'KPI is not pending approval' },
        { status: 400 }
      );
    }

    // 5. Update KPI with PO approval
    const updatedKPI = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        poApproved: true,
        poApprovedAt: new Date(),
      },
    });

    // 6. Create notification for FL to confirm
    await prisma.notification.create({
      data: {
        type: 'kpi_approved_awaiting_confirmation',
        recipientAddress: role.assignedTo!,
        recipientRole: 'FL',
        title: 'KPI Approved - Confirm Completion',
        message: `Your KPI "${kpi.name}" has been approved. Please confirm to release payment.`,
        projectId,
        roleId,
        kpiId,
        actionUrl: `/FL/projects`,
      },
    });

    // 7. Return response
    return NextResponse.json<ApproveKPIResponse>({
      success: true,
      kpi: {
        id: updatedKPI.id,
        name: updatedKPI.name,
        status: 'pending-approval',
        poApproved: true,
        flApproved: false,
      },
      message: 'KPI approved. Freelancer will be notified to confirm.',
      nextStep: 'awaiting_fl_confirmation',
    });

  } catch (error) {
    console.error('Error approving KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

/**
 * File: app/api/po/kpi/reject/route.ts
 *
 * POST /api/po/kpi/reject
 *
 * PO rejects a submitted KPI with reason
 */

/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate as PO
    const session = await getServerSession();
    if (!session?.user?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: RejectKPIRequest = await req.json();
    const { projectId, roleId, kpiId, reason } = body;

    // 3. Validate rejection reason
    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // 4. Verify user owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerAddress: session.user.address,
      },
      include: {
        roles: {
          where: { id: roleId },
          include: {
            kpis: {
              where: { id: kpiId },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const role = project.roles[0];
    const kpi = role?.kpis[0];

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // 5. Validate KPI status
    if (kpi.status !== 'pending-approval') {
      return NextResponse.json(
        { success: false, error: 'KPI is not pending approval' },
        { status: 400 }
      );
    }

    // 6. Update KPI as rejected
    const updatedKPI = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        poApproved: false,
        flApproved: false,
      },
    });

    // 7. Create notification for FL
    await prisma.notification.create({
      data: {
        type: 'kpi_rejected',
        recipientAddress: role.assignedTo!,
        recipientRole: 'FL',
        title: 'KPI Rejected',
        message: `Your KPI "${kpi.name}" was rejected. Reason: ${reason}`,
        projectId,
        roleId,
        kpiId,
        actionUrl: `/FL/projects`,
      },
    });

    // 8. Return response
    return NextResponse.json<RejectKPIResponse>({
      success: true,
      kpi: {
        id: updatedKPI.id,
        name: updatedKPI.name,
        status: 'rejected',
        rejectionReason: reason,
      },
      message: 'KPI rejected. Freelancer will be notified.',
    });

  } catch (error) {
    console.error('Error rejecting KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

/**
 * File: app/api/fl/kpi/confirm/route.ts
 *
 * POST /api/fl/kpi/confirm
 *
 * FL confirms KPI completion (second signature - triggers payment)
 */

/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { calculateYield } from '@/lib/yield';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate as FL
    const session = await getServerSession();
    if (!session?.user?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: ConfirmKPIRequest = await req.json();
    const { projectId, roleId, kpiId } = body;

    // 3. Verify FL is assigned to this role
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        projectId,
        assignedTo: session.user.address,
      },
      include: {
        project: true,
        kpis: {
          where: { id: kpiId },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found or not assigned to you' },
        { status: 404 }
      );
    }

    const kpi = role.kpis[0];
    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // 4. Validate PO has approved
    if (!kpi.poApproved) {
      return NextResponse.json(
        { success: false, error: 'PO has not approved this KPI yet' },
        { status: 400 }
      );
    }

    // 5. Calculate payment (in production, this comes from smart contract)
    const baseAmount = (role.budget * kpi.percentage) / 100;
    const yieldData = await calculateYield(kpi.id);
    const yieldPercent = yieldData.percent;
    const totalYield = baseAmount * (yieldPercent / 100);

    // Yield distribution: 40% PO, 40% FL, 20% Platform
    const poYieldShare = totalYield * 0.4;
    const flYieldShare = totalYield * 0.4;
    const platformFee = totalYield * 0.2;

    const flShare = baseAmount + flYieldShare;

    // 6. Update KPI as fully approved
    const updatedKPI = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        status: 'approved',
        flApproved: true,
        completedAt: new Date(),
        yield: yieldPercent,
      },
    });

    // 7. Update balances
    await prisma.$transaction([
      // Update FL balance
      prisma.userBalance.upsert({
        where: { userAddress: session.user.address },
        create: {
          userAddress: session.user.address,
          withdrawable: flShare,
          totalEarned: flShare,
        },
        update: {
          withdrawable: { increment: flShare },
          totalEarned: { increment: flShare },
        },
      }),
      // Update PO balance (gets principal back + yield share)
      prisma.userBalance.upsert({
        where: { userAddress: role.project.ownerAddress },
        create: {
          userAddress: role.project.ownerAddress,
          withdrawable: baseAmount + poYieldShare,
          totalEarned: poYieldShare,
        },
        update: {
          withdrawable: { increment: baseAmount + poYieldShare },
          totalEarned: { increment: poYieldShare },
        },
      }),
    ]);

    // 8. Create notifications
    await prisma.notification.createMany({
      data: [
        {
          type: 'payment_released',
          recipientAddress: session.user.address,
          recipientRole: 'FL',
          title: 'Payment Released!',
          message: `KPI "${kpi.name}" completed! ${flShare.toFixed(2)} IDRX added to your withdrawable balance.`,
          projectId,
          roleId,
          kpiId,
          actionUrl: `/FL/projects?tab=portfolio`,
        },
        {
          type: 'payment_released',
          recipientAddress: role.project.ownerAddress,
          recipientRole: 'PO',
          title: 'KPI Completed',
          message: `KPI "${kpi.name}" completed. Yield earnings: ${poYieldShare.toFixed(2)} IDRX.`,
          projectId,
          roleId,
          kpiId,
          actionUrl: `/PO/portfolio`,
        },
      ],
    });

    // 9. Get new FL balance
    const flBalance = await prisma.userBalance.findUnique({
      where: { userAddress: session.user.address },
    });

    // 10. Return response
    return NextResponse.json<ConfirmKPIResponse>({
      success: true,
      kpi: {
        id: updatedKPI.id,
        name: updatedKPI.name,
        status: 'approved',
        poApproved: true,
        flApproved: true,
        completedAt: updatedKPI.completedAt.toISOString(),
      },
      payment: {
        baseAmount,
        yieldPercent,
        totalYield,
        flShare,
      },
      newBalance: flBalance?.withdrawable || 0,
      message: 'KPI confirmed! Payment released to your withdrawable balance.',
    });

  } catch (error) {
    console.error('Error confirming KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

// ============================================================================
// CLIENT-SIDE HOOK EXAMPLES
// ============================================================================

/**
 * File: hooks/useKPIFlow.ts
 *
 * React hooks for KPI flow operations
 */

/*
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// FL: Submit KPI
export function useSubmitKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitKPIRequest) => {
      const response = await fetch('/api/fl/kpi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit KPI');
      return response.json() as Promise<SubmitKPIResponse>;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });
}

// PO: Approve KPI
export function useApproveKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApproveKPIRequest) => {
      const response = await fetch('/api/po/kpi/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to approve KPI');
      return response.json() as Promise<ApproveKPIResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });
}

// PO: Reject KPI
export function useRejectKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RejectKPIRequest) => {
      const response = await fetch('/api/po/kpi/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to reject KPI');
      return response.json() as Promise<RejectKPIResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });
}

// FL: Confirm KPI
export function useConfirmKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConfirmKPIRequest) => {
      const response = await fetch('/api/fl/kpi/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to confirm KPI');
      return response.json() as Promise<ConfirmKPIResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });
}

// Get KPI state
export function useKPIState(projectId: string, roleId: string, kpiId: string) {
  return useQuery({
    queryKey: ['kpi', projectId, roleId, kpiId],
    queryFn: async () => {
      const response = await fetch(`/api/kpi/${projectId}/${roleId}/${kpiId}`);
      if (!response.ok) throw new Error('Failed to fetch KPI');
      return response.json();
    },
  });
}

// Get notifications
export function useNotifications(recipient: 'po' | 'fl') {
  return useQuery({
    queryKey: ['notifications', recipient],
    queryFn: async () => {
      const response = await fetch(`/api/${recipient}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json() as Promise<NotificationsResponse>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
*/

export {};
