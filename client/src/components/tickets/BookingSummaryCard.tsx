import Card from '@/components/ui/Card';

interface BookingSummaryCardProps {
  ticketPrice: number;
  quantity: number;
  totalAmount: number;
}

function formatCurrency(amount: number): string {
  if (amount <= 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function BookingSummaryCard({ ticketPrice, quantity, totalAmount }: BookingSummaryCardProps) {
  return (
    <Card className="h-full rounded-3xl border-orange-100 bg-gradient-to-br from-white via-orange-50/80 to-amber-50 p-4 shadow-none">
      <p className="text-sm font-semibold text-slate-950">Booking Summary</p>
      <div className="mt-3 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>Ticket price</span>
          <span className="font-semibold text-slate-900">{formatCurrency(ticketPrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Quantity</span>
          <span className="font-semibold text-slate-900">{quantity}</span>
        </div>
        <div className="flex items-center justify-between border-t border-orange-100 pt-2.5 text-base">
          <span className="font-semibold text-slate-950">Total</span>
          <span className="font-bold text-orange-700">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
}

export default BookingSummaryCard;
