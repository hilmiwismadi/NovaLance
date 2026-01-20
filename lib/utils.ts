// Utility functions for NovaLance

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(amount: number, currency: string = 'USDC'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export function getMilestoneStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'badge-success';
    case 'in-progress':
      return 'badge-pending';
    case 'rejected':
      return 'badge-error';
    default:
      return 'badge-warning';
  }
}

export function getJobStatusColor(status: string): string {
  switch (status) {
    case 'hiring':
      return 'badge-pending';
    case 'in-progress':
      return 'badge-warning';
    case 'completed':
      return 'badge-success';
    case 'cancelled':
      return 'badge-error';
    default:
      return 'badge-warning';
  }
}

export function getApplicationStatusColor(status: string): string {
  switch (status) {
    case 'accepted':
      return 'badge-success';
    case 'rejected':
      return 'badge-error';
    default:
      return 'badge-pending';
  }
}

export function calculateBudgetFromMilestones(milestones: Array<{ percentage: number }>, totalBudget: number): number {
  return milestones.reduce((sum, m) => sum + (totalBudget * m.percentage / 100), 0);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
