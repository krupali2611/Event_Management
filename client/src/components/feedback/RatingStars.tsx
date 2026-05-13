import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

function RatingStars({ value, onChange, size = 'md' }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const ratingValue = index + 1;
        const filled = ratingValue <= value;

        return (
          <button
            key={ratingValue}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(ratingValue)}
            className={`rounded-full transition ${onChange ? 'hover:scale-110' : 'cursor-default'} disabled:cursor-default`}
            aria-label={`Rate ${ratingValue} star${ratingValue > 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizeClasses[size]} ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default RatingStars;
