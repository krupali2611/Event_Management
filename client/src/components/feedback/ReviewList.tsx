import FeedbackCard from '@/components/feedback/FeedbackCard';
import type { FeedbackItem } from '@/types/feedback.types';

interface ReviewListProps {
  feedbacks: FeedbackItem[];
  emptyMessage: string;
}

function ReviewList({ feedbacks, emptyMessage }: ReviewListProps) {
  if (feedbacks.length === 0) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.id} feedback={feedback} />
      ))}
    </div>
  );
}

export default ReviewList;
