import { MessageSquareQuote, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import RatingStars from '@/components/feedback/RatingStars';
import DashboardTable from '@/components/organizer/dashboard/DashboardTable';
import StatCard from '@/components/organizer/dashboard/StatCard';
import Modal from '@/components/ui/Modal';
import { adminFeedbackService } from '@/services/adminFeedback.service';
import type { AdminFeedbackReviewItem } from '@/types/admin-feedback.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

interface EventRatingSummary {
  eventId: string;
  eventName: string;
  organizerName: string;
  averageRating: number;
  totalReviews: number;
  reviews: AdminFeedbackReviewItem[];
}

function FeedbackReviewsPage() {
  const [reviews, setReviews] = useState<AdminFeedbackReviewItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminFeedbackService.getReviews();
        setReviews(response.data?.reviews ?? []);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadReviews();
  }, []);

  const eventSummaries = useMemo<EventRatingSummary[]>(() => {
    const eventMap = new Map<
      string,
      {
        eventName: string;
        organizerName: string;
        totalRating: number;
        totalReviews: number;
        reviews: AdminFeedbackReviewItem[];
      }
    >();

    reviews.forEach((review) => {
      const existing = eventMap.get(review.event.id);

      if (existing) {
        existing.totalRating += review.rating;
        existing.totalReviews += 1;
        existing.reviews.push(review);
        return;
      }

      eventMap.set(review.event.id, {
        eventName: review.event.name,
        organizerName: review.organizer.name,
        totalRating: review.rating,
        totalReviews: 1,
        reviews: [review],
      });
    });

    return Array.from(eventMap.entries())
      .map(([eventId, value]) => ({
        eventId,
        eventName: value.eventName,
        organizerName: value.organizerName,
        averageRating: Number((value.totalRating / value.totalReviews).toFixed(1)),
        totalReviews: value.totalReviews,
        reviews: value.reviews.sort((left, right) => new Date(right.reviewDate).getTime() - new Date(left.reviewDate).getTime()),
      }))
      .sort((left, right) => {
        if (right.averageRating !== left.averageRating) {
          return right.averageRating - left.averageRating;
        }

        return right.totalReviews - left.totalReviews;
      });
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((totalRating / reviews.length).toFixed(1));
  }, [reviews]);

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Average Rating"
          value={reviews.length > 0 ? `${averageRating.toFixed(1)} / 5` : 'No ratings yet'}
          helper="Overall average across all submitted feedback"
          icon={Star}
          loading={loading}
        />
        <StatCard
          label="Total Reviews"
          value={new Intl.NumberFormat('en-IN').format(reviews.length)}
          helper="All attendee reviews across the platform"
          icon={MessageSquareQuote}
          loading={loading}
        />
      </div>

      <DashboardTable
        title="Event-wise Average Ratings"
        description="Click any event row to open all related feedback."
        headers={['Event', 'Organizer', 'Average Rating', 'Reviews']}
        loading={loading}
        empty={eventSummaries.length === 0}
        emptyMessage="Event-wise rating summaries will appear here after feedback is submitted."
        rows={eventSummaries.map((event) => (
          <tr
            key={event.eventId}
            className="cursor-pointer align-top transition hover:bg-slate-50"
            onClick={() => setSelectedEvent(event)}
          >
            <td className="px-5 py-4 sm:px-6">
              <p className="font-medium text-slate-950">{event.eventName}</p>
            </td>
            <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{event.organizerName}</td>
            <td className="px-5 py-4 sm:px-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{event.averageRating.toFixed(1)} / 5</p>
                <RatingStars value={Math.round(event.averageRating)} size="sm" />
              </div>
            </td>
            <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{event.totalReviews}</td>
          </tr>
        ))}
      />

      {selectedEvent ? (
        <Modal
          title={selectedEvent.eventName}
          eyebrow="Feedback Reviews"
          onClose={() => setSelectedEvent(null)}
          panelClassName="max-w-3xl"
        >
          <div className="space-y-4">
            {selectedEvent.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{review.attendee.name}</p>
                  </div>
                  <div className="space-y-2">
                    <RatingStars value={review.rating} size="sm" />
                    <p className="text-xs text-slate-400">{formatDate(review.reviewDate)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{review.review}</p>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export default FeedbackReviewsPage;
