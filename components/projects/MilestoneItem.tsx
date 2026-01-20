'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Milestone } from '@/lib/mockData';
import { getMilestoneStatusColor, formatCurrency } from '@/lib/utils';

interface MilestoneItemProps {
  milestone: Milestone;
  amount: number;
  currency: string;
  userRole: 'owner' | 'freelancer' | 'both';
}

export default function MilestoneItem({ milestone, amount, currency, userRole }: MilestoneItemProps) {
  const [showActions, setShowActions] = useState(false);
  const statusColor = getMilestoneStatusColor(milestone.status);

  const canApprove = (userRole === 'owner' || userRole === 'both') && milestone.status === 'completed';
  const canSubmit = (userRole === 'freelancer' || userRole === 'both') && milestone.status === 'in-progress';

  return (
    <div
      className="glass-card p-4 transition-all duration-300 hover:bg-white/10"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            milestone.status === 'approved' || milestone.status === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : milestone.status === 'in-progress'
              ? 'bg-blue-500/20 text-blue-400'
              : milestone.status === 'rejected'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-white/10 text-white/40'
          }`}>
            {milestone.status === 'approved' || milestone.status === 'completed' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : milestone.status === 'in-progress' ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-white">{milestone.name}</h4>
              {milestone.description && (
                <p className="text-sm text-white/60 mt-1">{milestone.description}</p>
              )}
            </div>
            <Badge variant={statusColor as any} className="flex-shrink-0">
              {milestone.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/50">{milestone.percentage}% of budget</span>
            <span className="text-brand-300 font-medium">{formatCurrency(amount, currency)}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                milestone.status === 'approved' || milestone.status === 'completed'
                  ? 'bg-green-500'
                  : milestone.status === 'in-progress'
                  ? 'bg-blue-500'
                  : milestone.status === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-white/20'
              }`}
              style={{
                width:
                  milestone.status === 'approved' || milestone.status === 'completed'
                    ? '100%'
                    : milestone.status === 'in-progress'
                    ? '60%'
                    : '0%',
              }}
            />
          </div>

          {/* Actions */}
          {showActions && (
            <div className="mt-4 flex items-center gap-2">
              {canSubmit && (
                <>
                  <Button size="sm" className="flex-1">
                    Submit for Review
                  </Button>
                  <Button size="sm" variant="outline">
                    Request Revision
                  </Button>
                </>
              )}
              {canApprove && (
                <>
                  <Button size="sm" className="flex-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve & Pay
                  </Button>
                  <Button size="sm" variant="outline">
                    Request Changes
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 text-white/30">
          <svg
            className={`w-4 h-4 transition-transform ${showActions ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function useState<T>(initialValue: T): [T, (value: T) => void] {
  return [initialValue, () => {}];
}
