import { Milestone } from '@/lib/mockData';
import MilestoneItem from './MilestoneItem';

interface RoleSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  milestones: Milestone[];
  totalBudget: number;
  currency: string;
  userRole: 'owner' | 'freelancer' | 'both';
}

export default function RoleSection({
  title,
  description,
  icon,
  milestones,
  totalBudget,
  currency,
  userRole,
}: RoleSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone) => {
          const amount = (totalBudget * milestone.percentage) / 100;
          return (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              amount={amount}
              currency={currency}
              userRole={userRole}
            />
          );
        })}
      </div>
    </div>
  );
}
