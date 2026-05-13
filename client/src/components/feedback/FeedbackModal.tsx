import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import RatingStars from '@/components/feedback/RatingStars';

interface FeedbackModalProps {
  eventTitle: string;
  open: boolean;
  submitting: boolean;
  error: string | null;
  initialRating?: number;
  initialReview?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: { rating: number; review: string }) => Promise<void>;
}

function FeedbackModal({
  eventTitle,
  open,
  submitting,
  error,
  initialRating = 0,
  initialReview = '',
  submitLabel = 'Submit Feedback',
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRating(initialRating);
    setReview(initialReview);
    setFormError(null);
  }, [initialRating, initialReview, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmedReview = review.trim();

    if (rating < 1 || rating > 5) {
      setFormError('Please choose a rating from 1 to 5 stars.');
      return;
    }

    if (trimmedReview.length < 10) {
      setFormError('Please write at least 10 characters so the feedback is useful.');
      return;
    }

    setFormError(null);
    await onSubmit({ rating, review: trimmedReview });
  };

  return (
    <Modal
      title={`Share feedback for ${eventTitle}`}
      eyebrow="Event Review"
      description="Tell the organizer what worked well and what could be improved."
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      panelClassName="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Submitting...' : submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-700">Your rating</p>
          <div className="mt-3">
            <RatingStars value={rating} onChange={setRating} size="lg" />
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Your review</span>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={5}
            maxLength={1000}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
            placeholder="What stood out about the event experience?"
          />
          <span className="mt-2 block text-xs text-slate-400">{review.trim().length} / 1000 characters</span>
        </label>

        {formError || error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError ?? error}</div> : null}
      </div>
    </Modal>
  );
}

export default FeedbackModal;
