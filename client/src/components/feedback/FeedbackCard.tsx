import { CalendarDays, MapPin, MessageSquareQuote } from 'lucide-react';
import Card from '@/components/ui/Card';
import RatingStars from '@/components/feedback/RatingStars';
import type { FeedbackItem } from '@/types/feedback.types';

interface FeedbackCardProps {
  feedback: FeedbackItem;
}

function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{feedback.event.title}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-amber-500" />
              {new Date(feedback.event.startDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-500" />
              {feedback.event.venue ? `${feedback.event.venue.name}, ${feedback.event.venue.location}` : 'Venue unavailable'}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <RatingStars value={feedback.rating} size="sm" />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {new Date(feedback.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageSquareQuote className="h-4 w-4 text-amber-500" />
          Review
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.review}</p>
      </div>
    </Card>
  );
}

export default FeedbackCard;
