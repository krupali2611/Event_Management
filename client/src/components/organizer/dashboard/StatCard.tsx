import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, loading = false }: StatCardProps) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <div className="mt-4">
            {loading ? <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" /> : <p className="text-3xl font-semibold text-slate-950">{value}</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
