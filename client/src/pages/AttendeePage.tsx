import { CalendarDays, Lock, MapPin, MessageSquareQuote, RotateCcw, Search, SlidersHorizontal, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import RatingStars from '@/components/feedback/RatingStars';
import RemainingSeatsIndicator from '@/components/tickets/RemainingSeatsIndicator';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getPublicEvents } from '@/services/api';
import { feedbackService } from '@/services/feedback.service';
import type { AttendeePastEventItem } from '@/types/feedback.types';
import type { EventItem, EventListFilters } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const EVENT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23dbeafe'/%3E%3Cstop offset='.5' stop-color='%23e0f2fe'/%3E%3Cstop offset='1' stop-color='%23ffedd5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' fill='url(%23g)'/%3E%3Ccircle cx='965' cy='180' r='110' fill='%23ffffff' fill-opacity='.4'/%3E%3Ccircle cx='260' cy='590' r='160' fill='%23ffffff' fill-opacity='.25'/%3E%3Ctext x='80' y='620' fill='%23334155' font-family='Arial, sans-serif' font-size='72' font-weight='700'%3EEvent Image%3C/text%3E%3C/svg%3E";

type DashboardTab = 'upcoming' | 'past';

function AttendeePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const isAttendee = currentUser?.role === 'ATTENDEE';

  const [activeTab, setActiveTab] = useState<DashboardTab>('upcoming');
  const [filters, setFilters] = useState<EventListFilters>({
    page: 1,
    limit: 24,
    search: '',
    date: '',
    status: '',
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [pastEvents, setPastEvents] = useState<AttendeePastEventItem[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [pastEventsError, setPastEventsError] = useState<string | null>(null);
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<AttendeePastEventItem | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const formatTicketPrice = (ticketPrice: number): string =>
    ticketPrice <= 0
      ? 'Free Event'
      : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: ticketPrice % 1 === 0 ? 0 : 2 }).format(ticketPrice);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const requestFilters = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      search: debouncedSearch,
      date: filters.date,
      status: filters.status,
    }),
    [debouncedSearch, filters.date, filters.limit, filters.page, filters.status],
  );

  useEffect(() => {
    void (async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const response = await getPublicEvents(requestFilters);
        setEvents(response.data?.events ?? []);
      } catch (requestError) {
        setEventsError(getApiErrorMessage(requestError));
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [requestFilters]);

  const loadPastEvents = async (): Promise<void> => {
    if (!isAttendee) {
      setPastEvents([]);
      setPastEventsLoading(false);
      return;
    }

    try {
      setPastEventsLoading(true);
      setPastEventsError(null);
      const response = await feedbackService.getPastEvents();
      setPastEvents(response.data?.events ?? []);
    } catch (requestError) {
      setPastEventsError(getApiErrorMessage(requestError));
    } finally {
      setPastEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAttendee) {
      return;
    }

    void loadPastEvents();
  }, [isAttendee]);

  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [events],
  );

  const visibleEvents = useMemo(
    () => (selectedCategory ? events.filter((event) => event.category === selectedCategory) : events),
    [events, selectedCategory],
  );

  const resetFilters = (): void => {
    setFilters({
      page: 1,
      limit: 24,
      search: '',
      date: '',
      status: '',
    });
    setSelectedCategory('');
  };

  const handleFeedbackSubmit = async (payload: { rating: number; review: string }): Promise<void> => {
    if (!feedbackModalEvent) {
      return;
    }

    try {
      setSubmittingFeedback(true);
      setFeedbackError(null);
      const response = await feedbackService.submitFeedback({
        eventId: feedbackModalEvent.eventId,
        rating: payload.rating,
        review: payload.review,
      });
      const feedback = response.data;

      if (feedback) {
        setPastEvents((current) =>
          current.map((item) =>
            item.eventId === feedbackModalEvent.eventId
              ? {
                  ...item,
                  feedbackSubmitted: true,
                  feedback: {
                    id: feedback.id,
                    rating: feedback.rating,
                    review: feedback.review,
                    createdAt: feedback.createdAt,
                  },
                }
              : item,
          ),
        );
      }

      setFeedbackModalEvent(null);
    } catch (requestError) {
      setFeedbackError(getApiErrorMessage(requestError));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderUpcomingEvents = () => (
    <>
      <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white/90 p-4 shadow-[0_24px_80px_-48px_rgba(249,115,22,0.35)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
              placeholder="Search events by title or category..."
              className="min-w-0 w-full rounded-[1.3rem] border border-orange-100 bg-orange-50/50 py-4 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400"
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row xl:w-auto">
            <div className="relative md:w-[220px]">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <input
                type="date"
                value={filters.date}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, date: event.target.value }))}
                className="w-full rounded-[1.3rem] border border-orange-100 bg-orange-50/50 py-4 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400"
              />
            </div>

            <div className="relative md:w-[220px]">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full appearance-none rounded-[1.3rem] border border-orange-100 bg-orange-50/50 py-4 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-[58px] items-center justify-center gap-2 rounded-[1.3rem] border border-orange-200 bg-white px-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </Card>

      {eventsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{eventsError}</div> : null}
      {eventsLoading ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading events...</div> : null}
      {!eventsLoading && visibleEvents.length === 0 ? <Card className="p-6 text-sm text-slate-600">No events match the current filters.</Card> : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <img
              src={event.image ?? event.bannerImage ?? EVENT_FALLBACK_IMAGE}
              alt={event.title}
              className="h-48 w-full object-cover transition duration-300 hover:scale-105"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-slate-950">{event.title}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {event.venue ? `${event.venue.name}, ${event.venue.location}` : 'Venue to be announced'}
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatTicketPrice(event.ticketPrice)}</div>
              </div>
              <div className="mt-4">
                <RemainingSeatsIndicator
                  remainingSeats={event.remainingSeats}
                  attendeeLimit={event.attendeeLimit}
                  soldTickets={event.soldTickets}
                  compact
                />
              </div>
              <Link to={`/events/${event.id}`}>
                <Button className="mt-5 w-full bg-orange-500 hover:bg-orange-600" size="lg" icon={<Ticket className="h-4 w-4" />}>
                  View Event
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderPastEvents = () => {
    if (!isAuthenticated || !isAttendee) {
      return (
        <Card className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-950">Sign in as an attendee to view past events</h3>
          <p className="mt-2 text-sm text-slate-600">Your completed events and feedback history appear here after you book and attend events.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/login">
              <Button>Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary">Register</Button>
            </Link>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        {pastEventsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pastEventsError}</div> : null}
        {pastEventsLoading ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading your past events...</div> : null}
        {!pastEventsLoading && pastEvents.length === 0 ? (
          <Card className="rounded-[2rem] p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-950">No completed events yet</h3>
            <p className="mt-2 text-sm text-slate-600">Once an event you attended is completed, it will appear here with feedback options.</p>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          {pastEvents.map((item) => (
            <Card key={item.eventId} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-0">
              <img
                src={item.event.bannerImage ?? EVENT_FALLBACK_IMAGE}
                alt={item.event.title}
                className="h-52 w-full object-cover"
              />
              <div className="space-y-5 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{item.event.category}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">{item.event.title}</h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-amber-500" />
                        {new Date(item.event.startDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        {item.event.venue ? `${item.event.venue.name}, ${item.event.venue.location}` : 'Venue unavailable'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <TicketStatusBadge status={item.ticketStatus} kind="booking" />
                    <p className="text-xs text-slate-500">{item.quantity} ticket{item.quantity > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {!item.feedbackSubmitted ? (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">Ready to review this event?</p>
                    <p className="mt-1 text-sm text-slate-600">Share your experience so organizers can improve future events.</p>
                    <Button className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={() => {
                      setFeedbackError(null);
                      setFeedbackModalEvent(item);
                    }}>
                      Leave Feedback
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          <MessageSquareQuote className="h-4 w-4" />
                          Feedback Submitted
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.feedback?.review}</p>
                      </div>
                      <RatingStars value={item.feedback?.rating ?? 0} size="sm" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Attendee Dashboard</p>
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Track what’s next and review what you’ve attended.</h2>
        <p className="mt-3 text-sm text-slate-600">Browse upcoming events, then come back here after the event ends to leave a review.</p>
      </div>

      <div className="flex w-full flex-col rounded-[1.4rem] border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 rounded-[1.1rem] px-5 py-3 text-sm font-semibold transition ${activeTab === 'upcoming' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Upcoming Events
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`flex-1 rounded-[1.1rem] px-5 py-3 text-sm font-semibold transition ${activeTab === 'past' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Past Events
        </button>
      </div>

      {activeTab === 'upcoming' ? renderUpcomingEvents() : renderPastEvents()}

      <FeedbackModal
        open={feedbackModalEvent !== null}
        eventTitle={feedbackModalEvent?.event.title ?? 'this event'}
        submitting={submittingFeedback}
        error={feedbackError}
        onClose={() => {
          setFeedbackModalEvent(null);
          setFeedbackError(null);
        }}
        onSubmit={handleFeedbackSubmit}
      />
    </section>
  );
}

export default AttendeePage;
