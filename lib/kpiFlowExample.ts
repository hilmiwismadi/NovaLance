/**
 * KPI Submission and Multi-Sig Approval Flow Example
 *
 * This file demonstrates the complete flow using localStorage for testing.
 * Run these commands sequentially in your browser console to see the workflow.
 *
 * FLOW:
 * 1. FL submits KPI → status: 'pending-approval'
 * 2. PO reviews → can approve or reject
 * 3. If approved by PO → FL confirms → status: 'approved' → payment released
 * 4. If rejected → FL sees reason, resubmits
 */

// ============================================================================
// TYPES
// ============================================================================

interface KPIDeliverables {
  links: string[];
  description: string;
}

interface KPI {
  id: string;
  name: string;
  percentage: number;
  description?: string;
  status: 'pending' | 'in-progress' | 'pending-approval' | 'completed' | 'approved' | 'rejected';
  deadline?: string;
  completedAt?: string;
  yield?: number;

  // Multi-sig approval fields
  poApproved?: boolean;
  flApproved?: boolean;
  rejectionReason?: string;
  submittedAt?: string;
  deliverables?: KPIDeliverables;
}

interface RoleInProject {
  id: string;
  title: string;
  budget: number;
  kpis: KPI[];
  assignedTo?: string;
  assignedToEns?: string;
}

interface ProjectData {
  id: string;
  title: string;
  roles: RoleInProject[];
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY = 'novalance_kpi_flow_data';
const NOTIFICATIONS_KEY = 'novalance_notifications';

// ============================================================================
// API ENDPOINTS (Simulated)
// ============================================================================

/**
 * FL ENDPOINT: Submit KPI for Approval
 *
 * POST /api/kpi/submit
 *
 * Body:
 * {
 *   projectId: string,
 *   roleId: string,
 *   kpiId: string,
 *   deliverables: {
 *     links: string[],
 *     description: string
 *   }
 * }
 *
 * Flow:
 * 1. Find KPI
 * 2. Update status to 'pending-approval'
 * 3. Store deliverables
 * 4. Set submittedAt timestamp
 * 5. Create notification for PO
 * 6. Return updated KPI
 */
export function submitKPIForApproval(
  projectId: string,
  roleId: string,
  kpiId: string,
  deliverables: KPIDeliverables
): KPI | null {
  const data = getStoredData();
  const project = data.projects.find(p => p.id === projectId);

  if (!project) {
    console.error('❌ Project not found');
    return null;
  }

  const role = project.roles.find(r => r.id === roleId);
  if (!role) {
    console.error('❌ Role not found');
    return null;
  }

  const kpi = role.kpis.find(k => k.id === kpiId);
  if (!kpi) {
    console.error('❌ KPI not found');
    return null;
  }

  // Update KPI status
  kpi.status = 'pending-approval';
  kpi.deliverables = deliverables;
  kpi.submittedAt = new Date().toISOString();
  kpi.poApproved = false;
  kpi.flApproved = false;

  // Clear rejection reason if resubmitting
  delete kpi.rejectionReason;

  // Save to storage
  saveStoredData(data);

  // Create notification for PO
  createNotification({
    type: 'kpi_submission',
    message: `KPI "${kpi.name}" submitted by ${role.assignedToEns || 'Freelancer'} for review`,
    projectId,
    roleId,
    kpiId,
    recipient: 'po', // Project Owner
    createdAt: new Date().toISOString(),
    read: false,
  });

  console.log('✅ KPI submitted for approval successfully!');
  console.log('📧 Notification sent to PO');

  return kpi;
}

/**
 * PO ENDPOINT: Review KPI (Approve)
 *
 * POST /api/kpi/approve
 *
 * Body:
 * {
 *   projectId: string,
 *   roleId: string,
 *   kpiId: string
 * }
 *
 * Flow:
 * 1. Find KPI (must be in 'pending-approval' status)
 * 2. Set poApproved = true
 * 3. Create notification for FL to confirm
 * 4. Return updated KPI
 *
 * Note: Payment is NOT released yet. Waiting for FL confirmation.
 */
export function approveKPI(
  projectId: string,
  roleId: string,
  kpiId: string
): KPI | null {
  const data = getStoredData();
  const project = data.projects.find(p => p.id === projectId);

  if (!project) {
    console.error('❌ Project not found');
    return null;
  }

  const role = project.roles.find(r => r.id === roleId);
  if (!role) {
    console.error('❌ Role not found');
    return null;
  }

  const kpi = role.kpis.find(k => k.id === kpiId);
  if (!kpi) {
    console.error('❌ KPI not found');
    return null;
  }

  if (kpi.status !== 'pending-approval') {
    console.error('❌ KPI is not pending approval');
    return null;
  }

  // Set PO approval
  kpi.poApproved = true;

  // Save to storage
  saveStoredData(data);

  // Create notification for FL to confirm
  createNotification({
    type: 'kpi_approved_awaiting_confirmation',
    message: `KPI "${kpi.name}" approved by PO. Please confirm completion.`,
    projectId,
    roleId,
    kpiId,
    recipient: 'fl', // Freelancer
    createdAt: new Date().toISOString(),
    read: false,
  });

  console.log('✅ KPI approved by PO!');
  console.log('⏳ Waiting for FL confirmation to release payment...');
  console.log(`📧 Notification sent to FL (${role.assignedToEns || 'Freelancer'})`);

  return kpi;
}

/**
 * PO ENDPOINT: Review KPI (Reject)
 *
 * POST /api/kpi/reject
 *
 * Body:
 * {
 *   projectId: string,
 *   roleId: string,
 *   kpiId: string,
 *   reason: string
 * }
 *
 * Flow:
 * 1. Find KPI (must be in 'pending-approval' status)
 * 2. Update status to 'rejected'
 * 3. Store rejection reason
 * 4. Create notification for FL with reason
 * 5. Return updated KPI
 */
export function rejectKPI(
  projectId: string,
  roleId: string,
  kpiId: string,
  reason: string
): KPI | null {
  const data = getStoredData();
  const project = data.projects.find(p => p.id === projectId);

  if (!project) {
    console.error('❌ Project not found');
    return null;
  }

  const role = project.roles.find(r => r.id === roleId);
  if (!role) {
    console.error('❌ Role not found');
    return null;
  }

  const kpi = role.kpis.find(k => k.id === kpiId);
  if (!kpi) {
    console.error('❌ KPI not found');
    return null;
  }

  if (kpi.status !== 'pending-approval') {
    console.error('❌ KPI is not pending approval');
    return null;
  }

  // Update KPI status
  kpi.status = 'rejected';
  kpi.rejectionReason = reason;
  kpi.poApproved = false;
  kpi.flApproved = false;

  // Save to storage
  saveStoredData(data);

  // Create notification for FL
  createNotification({
    type: 'kpi_rejected',
    message: `KPI "${kpi.name}" rejected. Reason: ${reason}`,
    projectId,
    roleId,
    kpiId,
    recipient: 'fl', // Freelancer
    createdAt: new Date().toISOString(),
    read: false,
  });

  console.log('❌ KPI rejected');
  console.log(`📝 Reason: ${reason}`);
  console.log('📧 Notification sent to FL with rejection reason');

  return kpi;
}

/**
 * FL ENDPOINT: Confirm KPI Completion (Multi-sig)
 *
 * POST /api/kpi/confirm
 *
 * Body:
 * {
 *   projectId: string,
 *   roleId: string,
 *   kpiId: string
 * }
 *
 * Flow:
 * 1. Find KPI (must have poApproved = true)
 * 2. Set flApproved = true
 * 3. Update status to 'approved'
 * 4. Calculate and distribute yield
 * 5. Update withdrawable balances for both PO and FL
 * 6. Create notifications for both
 * 7. Return updated KPI with payment info
 */
export function confirmKPI(
  projectId: string,
  roleId: string,
  kpiId: string
): { kpi: KPI; payment: PaymentDistribution } | null {
  const data = getStoredData();
  const project = data.projects.find(p => p.id === projectId);

  if (!project) {
    console.error('❌ Project not found');
    return null;
  }

  const role = project.roles.find(r => r.id === roleId);
  if (!role) {
    console.error('❌ Role not found');
    return null;
  }

  const kpi = role.kpis.find(k => k.id === kpiId);
  if (!kpi) {
    console.error('❌ KPI not found');
    return null;
  }

  if (!kpi.poApproved) {
    console.error('❌ PO has not approved this KPI yet');
    return null;
  }

  // Set FL approval
  kpi.flApproved = true;
  kpi.status = 'approved';
  kpi.completedAt = new Date().toISOString();

  // Calculate payment distribution
  const baseAmount = (role.budget * kpi.percentage) / 100;
  const yieldPercent = kpi.yield || 0;
  const yieldAmount = baseAmount * (yieldPercent / 100);
  const totalYield = yieldAmount;

  // Yield distribution: 40% PO, 40% FL, 20% Platform
  const poYieldShare = totalYield * 0.4;
  const flYieldShare = totalYield * 0.4;
  const platformFee = totalYield * 0.2;

  const payment: PaymentDistribution = {
    baseAmount,
    yieldPercent,
    totalYield,
    poShare: baseAmount + poYieldShare, // PO gets principal back + 40% of yield
    flShare: baseAmount + flYieldShare, // FL gets payment + 40% of yield
    platformFee,
  };

  // Update balances
  data.balances.po.withdrawable += payment.poShare;
  data.balances.fl.withdrawable += payment.flShare;
  data.balances.platform.earnings += payment.platformFee;

  // Save to storage
  saveStoredData(data);

  // Create notifications
  createNotification({
    type: 'payment_released',
    message: `KPI "${kpi.name}" approved! Payment of ${payment.flShare.toFixed(2)} IDRX released to your withdrawable balance.`,
    projectId,
    roleId,
    kpiId,
    recipient: 'fl',
    createdAt: new Date().toISOString(),
    read: false,
  });

  createNotification({
    type: 'payment_released',
    message: `KPI "${kpi.name}" completed! Yield earnings of ${poYieldShare.toFixed(2)} IDRX added to your balance.`,
    projectId,
    roleId,
    kpiId,
    recipient: 'po',
    createdAt: new Date().toISOString(),
    read: false,
  });

  console.log('✅ KPI confirmed by FL!');
  console.log('💰 PAYMENT RELEASED!');
  console.log(payment);
  console.log('📧 Notifications sent to both PO and FL');

  return { kpi, payment };
}

interface PaymentDistribution {
  baseAmount: number;
  yieldPercent: number;
  totalYield: number;
  poShare: number;
  flShare: number;
  platformFee: number;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

interface Notification {
  id: string;
  type: 'kpi_submission' | 'kpi_approved_awaiting_confirmation' | 'kpi_rejected' | 'payment_released';
  message: string;
  projectId: string;
  roleId: string;
  kpiId: string;
  recipient: 'po' | 'fl';
  createdAt: string;
  read: boolean;
}

function createNotification(notification: Omit<Notification, 'id'>) {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  notifications.unshift(newNotification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

  return newNotification;
}

export function getNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getNotificationsForUser(recipient: 'po' | 'fl'): Notification[] {
  const notifications = getNotifications();
  return notifications.filter(n => n.recipient === recipient && !n.read);
}

export function markNotificationRead(notificationId: string) {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

interface StoredData {
  projects: ProjectData[];
  balances: {
    po: { withdrawable: number; totalEarned: number };
    fl: { withdrawable: number; totalEarned: number };
    platform: { earnings: number };
  };
}

function getStoredData(): StoredData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Initialize with default data
  const initialData: StoredData = {
    projects: getInitialProjects(),
    balances: {
      po: { withdrawable: 0, totalEarned: 0 },
      fl: { withdrawable: 0, totalEarned: 0 },
      platform: { earnings: 0 },
    },
  };

  saveStoredData(initialData);
  return initialData;
}

function saveStoredData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getInitialProjects(): ProjectData[] {
  return [
    {
      id: 'proj-1',
      title: 'DeFi Swap Interface',
      roles: [
        {
          id: 'role-1',
          title: 'React Developer',
          budget: 4500000,
          assignedTo: '0xfl...',
          assignedToEns: 'bob.eth',
          kpis: [
            {
              id: 'kpi-1',
              name: 'Setup & Wallet Connection',
              percentage: 25,
              description: 'Project setup, wallet connection, basic layout',
              status: 'approved',
              deadline: '2026-01-20',
              completedAt: '2026-01-19',
              yield: 11.44,
              poApproved: true,
              flApproved: true,
            },
            {
              id: 'kpi-2',
              name: 'Swap Interface',
              percentage: 40,
              description: 'Build swap form with price estimation and slippage',
              status: 'in-progress',
              deadline: '2026-02-05',
            },
            {
              id: 'kpi-3',
              name: 'Charts & History',
              percentage: 35,
              description: 'Price charts and transaction history',
              status: 'pending',
              deadline: '2026-02-20',
            },
          ],
        },
      ],
    },
  ];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current state of a KPI
 */
export function getKPIState(projectId: string, roleId: string, kpiId: string): {
  kpi: KPI | null;
  status: string;
  canSubmit: boolean;
  canReview: boolean;
  canConfirm: boolean;
  needsResubmit: boolean;
} {
  const data = getStoredData();
  const project = data.projects.find(p => p.id === projectId);
  const role = project?.roles.find(r => r.id === roleId);
  const kpi = role?.kpis.find(k => k.id === kpiId);

  if (!kpi) {
    return { kpi: null, status: 'not_found', canSubmit: false, canReview: false, canConfirm: false, needsResubmit: false };
  }

  return {
    kpi,
    status: kpi.status,
    canSubmit: kpi.status === 'in-progress' || kpi.status === 'rejected',
    canReview: kpi.status === 'pending-approval',
    canConfirm: kpi.poApproved === true && kpi.flApproved !== true,
    needsResubmit: kpi.status === 'rejected',
  };
}

/**
 * Get all balances
 */
export function getBalances() {
  const data = getStoredData();
  return data.balances;
}

/**
 * Reset all data (for testing)
 */
export function resetFlowData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTIFICATIONS_KEY);
  console.log('🔄 Flow data reset');
}

/**
 * Print current state (for debugging)
 */
export function printFlowState() {
  const data = getStoredData();
  console.log('📊 CURRENT FLOW STATE:');
  console.log('='.repeat(50));
  console.log(JSON.stringify(data, null, 2));
  console.log('='.repeat(50));
}

// ============================================================================
// EXAMPLE FLOWS (Run these in browser console)
// ============================================================================

/**
 * FLOW 1: Successful Approval Path
 *
 * 1. FL submits KPI
 * 2. PO approves
 * 3. FL confirms
 * 4. Payment released
 */
export function runSuccessFlow() {
  console.log('🚀 Starting SUCCESS FLOW...');
  console.log('='.repeat(50));

  resetFlowData();

  // Step 1: FL submits KPI
  console.log('\n📝 Step 1: FL submits KPI for approval');
  const submittedKPI = submitKPIForApproval(
    'proj-1',
    'role-1',
    'kpi-2',
    {
      links: ['https://github.com/bob/swap/pull/42', 'https://demo.example.com'],
      description: 'Implemented swap interface with real-time price estimation',
    }
  );

  console.log('KPI State:', submittedKPI);

  // Step 2: PO approves
  console.log('\n✅ Step 2: PO reviews and approves');
  const approvedKPI = approveKPI('proj-1', 'role-1', 'kpi-2');
  console.log('KPI State:', approvedKPI);

  // Step 3: FL confirms
  console.log('\n🤝 Step 3: FL confirms completion');
  const result = confirmKPI('proj-1', 'role-1', 'kpi-2');
  console.log('Final KPI State:', result?.kpi);
  console.log('Payment:', result?.payment);

  // Show final balances
  console.log('\n💰 Final Balances:');
  console.log(getBalances());

  console.log('\n✅ SUCCESS FLOW COMPLETE!');
}

/**
 * FLOW 2: Rejection Path
 *
 * 1. FL submits KPI
 * 2. PO rejects with reason
 * 3. FL resubmits
 * 4. PO approves
 * 5. FL confirms
 */
export function runRejectionFlow() {
  console.log('🚀 Starting REJECTION FLOW...');
  console.log('='.repeat(50));

  resetFlowData();

  // Step 1: FL submits KPI
  console.log('\n📝 Step 1: FL submits KPI for approval');
  const submittedKPI = submitKPIForApproval(
    'proj-1',
    'role-1',
    'kpi-2',
    {
      links: ['https://github.com/bob/swap/pull/42'],
      description: 'Basic swap implementation',
    }
  );
  console.log('KPI State:', submittedKPI);

  // Step 2: PO rejects
  console.log('\n❌ Step 2: PO rejects with reason');
  const rejectedKPI = rejectKPI(
    'proj-1',
    'role-1',
    'kpi-2',
    'Price estimation is not real-time. Please implement WebSocket connection.'
  );
  console.log('KPI State:', rejectedKPI);

  // Step 3: FL resubmits
  console.log('\n🔄 Step 3: FL resubmits with fixes');
  const resubmittedKPI = submitKPIForApproval(
    'proj-1',
    'role-1',
    'kpi-2',
    {
      links: ['https://github.com/bob/swap/pull/43'],
      description: 'Added WebSocket for real-time price updates from Uniswap',
    }
  );
  console.log('KPI State:', resubmittedKPI);

  // Step 4: PO approves
  console.log('\n✅ Step 4: PO approves resubmission');
  const approvedKPI = approveKPI('proj-1', 'role-1', 'kpi-2');
  console.log('KPI State:', approvedKPI);

  // Step 5: FL confirms
  console.log('\n🤝 Step 5: FL confirms completion');
  const result = confirmKPI('proj-1', 'role-1', 'kpi-2');
  console.log('Final KPI State:', result?.kpi);
  console.log('Payment:', result?.payment);

  console.log('\n💰 Final Balances:');
  console.log(getBalances());

  console.log('\n✅ REJECTION FLOW COMPLETE!');
}

// ============================================================================
// EXPORT FOR USE IN OTHER FILES
// ============================================================================

export const KPIFlowAPI = {
  // FL endpoints
  submitKPI: submitKPIForApproval,
  confirmKPI,

  // PO endpoints
  approveKPI,
  rejectKPI,

  // Utility endpoints
  getKPIState,
  getBalances,
  getNotifications,
  getNotificationsForUser,
  markNotificationRead,
  resetFlowData,
  printFlowState,

  // Example flows
  runSuccessFlow,
  runRejectionFlow,
};

// Auto-expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).KPIFlow = KPIFlowAPI;
  console.log('🎯 KPIFlow API available at window.KPIFlow');
  console.log('Try: KPIFlow.runSuccessFlow() or KPIFlow.runRejectionFlow()');
}
