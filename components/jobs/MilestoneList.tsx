import Badge from '@/components/ui/Badge';
import { Milestone, MilestoneStatus } from '@/lib/mockData';
import { getMilestoneStatusColor, formatCurrency } from '@/lib/utils';

interface MilestoneListProps {
  milestones: Milestone[];
  totalBudget: number;
  currency: string;
}

export default function MilestoneList({ milestones, totalBudget, currency }: MilestoneListProps) {
  const statusOrder: Record<MilestoneStatus, number> = {
    'approved': 5,
    'completed': 4,
    'in-progress': 3,
    'pending-approval': 2,
    'pending': 1,
    'rejected': 0,
  };

  const sortedMilestones = [...milestones].sort((a, b) => statusOrder[b.status] - statusOrder[a.status]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-700">Milestones</h3>
      {sortedMilestones.map((milestone, index) => {
        const amount = (totalBudget * milestone.percentage) / 100;
        const statusColor = getMilestoneStatusColor(milestone.status);

        return (
          <div
            key={milestone.id}
            className="glass-card p-4 flex items-start gap-4"
          >
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                milestone.status === 'approved' || milestone.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : milestone.status === 'in-progress'
                  ? 'bg-blue-500/20 text-blue-400'
                  : milestone.status === 'rejected'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {milestone.status === 'approved' || milestone.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : milestone.status === 'in-progress' ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-slate-800">{milestone.name}</h4>
                <Badge variant={statusColor as any} className="flex-shrink-0">
                  {milestone.status}
                </Badge>
              </div>

              {milestone.description && (
                <p className="text-sm text-slate-600 mb-2">{milestone.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{milestone.percentage}% of budget</span>
                  <span className="text-brand-600 font-medium">{formatCurrency(amount, currency)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    milestone.status === 'approved' || milestone.status === 'completed'
                      ? 'bg-green-500'
                      : milestone.status === 'in-progress'
                      ? 'bg-blue-500'
                      : 'bg-slate-300'
                  }`}
                  style={{
                    width:
                      milestone.status === 'approved' || milestone.status === 'completed'
                        ? '100%'
                        : milestone.status === 'in-progress'
                        ? '50%'
                        : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
