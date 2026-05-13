import { MessageSquareQuote, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import RatingStars from '@/components/feedback/RatingStars';
import DashboardTable from '@/components/organizer/dashboard/DashboardTable';
import StatCard from '@/components/organizer/dashboard/StatCard';
import Modal from '@/components/ui/Modal';
import { feedbackService } from '@/services/feedback.service';
import type { FeedbackItem } from '@/types/feedback.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

interface OrganizerEventReviewSummary {
  eventId: string;
  eventTitle: string;
  averageRating: number;
  totalReviews: number;
}

function OrganizerFeedbackReviewsPage() {
  const [reviews, setReviews] = useState<FeedbackItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEventReviewSummary | null>(null);
  const [selectedEventReviews, setSelectedEventReviews] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventLoading, setSelectedEventLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const allReviews: FeedbackItem[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await feedbackService.getOrganizerFeedback({
            page,
            limit: 100,
          });

          const feedbacks = response.data?.feedbacks ?? [];
          const pagination = response.data?.pagination;

          allReviews.push(...feedbacks);
          totalPages = pagination?.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages);

        setReviews(allReviews);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadReviews();
  }, []);

  const eventSummaries = useMemo<OrganizerEventReviewSummary[]>(() => {
    const eventMap = new Map<
      string,
      {
        eventTitle: string;
        totalRating: number;
        totalReviews: number;
      }
    >();

    reviews.forEach((review) => {
      const existing = eventMap.get(review.eventId);

      if (existing) {
        existing.totalRating += review.rating;
        existing.totalReviews += 1;
        return;
      }

      eventMap.set(review.eventId, {
        eventTitle: review.event.title,
        totalRating: review.rating,
        totalReviews: 1,
      });
    });

    return Array.from(eventMap.entries())
      .map(([eventId, value]) => ({
        eventId,
        eventTitle: value.eventTitle,
        averageRating: Number((value.totalRating / value.totalReviews).toFixed(1)),
        totalReviews: value.totalReviews,
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

  async function handleEventClick(event: OrganizerEventReviewSummary): Promise<void> {
    try {
      setSelectedEvent(event);
      setSelectedEventReviews([]);
      setSelectedEventLoading(true);
      setError(null);

      const eventReviews: FeedbackItem[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await feedbackService.getOrganizerFeedback({
          page,
          limit: 100,
          eventId: event.eventId,
        });

        const feedbacks = response.data?.feedbacks ?? [];
        const pagination = response.data?.pagination;

        eventReviews.push(...feedbacks);
        totalPages = pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      setSelectedEventReviews(eventReviews.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setSelectedEvent(null);
    } finally {
      setSelectedEventLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Average Rating"
          value={reviews.length > 0 ? `${averageRating.toFixed(1)} / 5` : 'No ratings yet'}
          helper="Your events ke overall feedback ka average"
          icon={Star}
          loading={loading}
        />
        <StatCard
          label="Total Reviews"
          value={new Intl.NumberFormat('en-IN').format(reviews.length)}
          helper="Sirf aapke events ke attendee reviews"
          icon={MessageSquareQuote}
          loading={loading}
        />
      </div>

      <DashboardTable
        title="Event-wise Average Ratings"
        description="Click any event row to open all related feedback."
        headers={['Event', 'Average Rating', 'Reviews']}
        loading={loading}
        empty={eventSummaries.length === 0}
        emptyMessage="Event-wise rating summaries will appear here after attendees submit feedback."
        rows={eventSummaries.map((event) => (
          <tr
            key={event.eventId}
            className="cursor-pointer align-top transition hover:bg-slate-50"
            onClick={() => void handleEventClick(event)}
          >
            <td className="px-5 py-4 sm:px-6">
              <p className="font-medium text-slate-950">{event.eventTitle}</p>
            </td>
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
          title={selectedEvent.eventTitle}
          eyebrow="My Event Reviews"
          onClose={() => setSelectedEvent(null)}
          panelClassName="max-w-3xl"
        >
          <div className="space-y-4">
            {selectedEventLoading ? (
              [...Array(3)].map((_, index) => <div key={`selected-review-skeleton-${index}`} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
            ) : selectedEventReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Is event ke liye abhi koi feedback available nahi hai.
              </div>
            ) : (
              selectedEventReviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{review.attendee.name}</p>
                    </div>
                    <div className="space-y-2">
                      <RatingStars value={review.rating} size="sm" />
                      <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{review.review}</p>
                </div>
              ))
            )}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export default OrganizerFeedbackReviewsPage;
