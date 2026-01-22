import Card from '@/components/ui/Card';
import { Experience } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface ExperienceCardProps {
  experience: Experience;
}

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-slate-800">{experience.role}</h4>
          <p className="text-brand-300">{experience.company}</p>
        </div>
        {experience.current && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            Current
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-3">{experience.description}</p>
      <p className="text-xs text-slate-400">
        {formatDate(experience.startDate)} - {experience.current ? 'Present' : formatDate(experience.endDate || '')}
      </p>
    </Card>
  );
}
