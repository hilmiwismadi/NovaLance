import Card from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="p-3 rounded-xl bg-brand-100 text-brand-600">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}
          </p>
        )}
      </div>
    </Card>
  );
}
