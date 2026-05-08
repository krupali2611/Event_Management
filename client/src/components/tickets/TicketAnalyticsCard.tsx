import type { ComponentType } from 'react';
import Card from '@/components/ui/Card';

interface TicketAnalyticsCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: 'brand' | 'amber' | 'slate' | 'rose' | 'emerald';
}

function getToneClasses(tone: NonNullable<TicketAnalyticsCardProps['tone']>): string {
  switch (tone) {
    case 'amber':
      return 'bg-amber-50 text-amber-700';
    case 'rose':
      return 'bg-rose-50 text-rose-700';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700';
    case 'slate':
      return 'bg-slate-100 text-slate-700';
    case 'brand':
    default:
      return 'bg-brand-50 text-brand-700';
  }
}

function TicketAnalyticsCard({ label, value, helper, icon: Icon, tone = 'brand' }: TicketAnalyticsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
        </div>
        <div className={`rounded-2xl p-3 ${getToneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default TicketAnalyticsCard;
