import Button from '@/components/ui/Button';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function QuantitySelector({ value, min = 1, max, disabled = false, onChange }: QuantitySelectorProps) {
  const decrementDisabled = disabled || value <= min;
  const incrementDisabled = disabled || value >= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Quantity</p>
        <p className="text-xs text-slate-500">
          Min {min} - Max {max}
        </p>
      </div>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
        <Button variant="secondary" size="sm" disabled={decrementDisabled} onClick={() => onChange(Math.max(min, value - 1))}>
          -
        </Button>
        <div className="flex-1 text-center text-lg font-semibold text-slate-950">{value}</div>
        <Button variant="secondary" size="sm" disabled={incrementDisabled} onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </Button>
      </div>
    </div>
  );
}

export default QuantitySelector;
