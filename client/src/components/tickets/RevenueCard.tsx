import { IndianRupee } from 'lucide-react';
import Card from '@/components/ui/Card';

interface RevenueCardProps {
  label: string;
  value: number;
  helper?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function RevenueCard({ label, value, helper }: RevenueCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(value)}</p>
          {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <IndianRupee className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default RevenueCard;
