import { CalendarDays, IndianRupee, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getEventById, getPublicEventById } from '@/services/api';
import { eventService } from '@/services/event.service';
import type { EventItem } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const EVENT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23dbeafe'/%3E%3Cstop offset='.5' stop-color='%23e0f2fe'/%3E%3Cstop offset='1' stop-color='%23ffedd5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' fill='url(%23g)'/%3E%3Ccircle cx='965' cy='180' r='110' fill='%23ffffff' fill-opacity='.4'/%3E%3Ccircle cx='260' cy='590' r='160' fill='%23ffffff' fill-opacity='.25'/%3E%3Ctext x='80' y='620' fill='%23334155' font-family='Arial, sans-serif' font-size='72' font-weight='700'%3EEvent Image%3C/text%3E%3C/svg%3E";

function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTicketPrice(ticketPrice: number): string {
  if (ticketPrice <= 0) {
    return 'Free Event';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: ticketPrice % 1 === 0 ? 0 : 2,
  }).format(ticketPrice);
}

function EventDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const canManageEvent = currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isOrganizerWorkspace = location.pathname.startsWith('/organizer');
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const isPrivateWorkspace = isOrganizerWorkspace || isAdminWorkspace;
  const isAttendeeWorkspace = location.pathname.startsWith('/attendee');
  const eventsBasePath = isAdminWorkspace ? '/admin/events' : '/organizer/events';
  const backHref = isPrivateWorkspace ? eventsBasePath : isAttendeeWorkspace ? '/attendee' : '/events';

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = isPrivateWorkspace ? await getEventById(id) : await getPublicEventById(id);
        setEvent(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isPrivateWorkspace]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleStatusAction = async (): Promise<void> => {
    if (!event) {
      return;
    }

    const nextStatus = event.status === 'DRAFT' ? 'PUBLISHED' : event.status === 'PUBLISHED' ? 'CANCELLED' : 'DRAFT';
    const successMessage = nextStatus === 'PUBLISHED' ? 'Event Published' : nextStatus === 'CANCELLED' ? 'Event Cancelled' : 'Moved to Draft';

    try {
      setSubmitting(true);
      setError(null);
      const response = await eventService.updateEventStatus(event.id, nextStatus);
      setEvent(response.data ?? null);
      setShowCancelModal(false);
      setToast(successMessage);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);
      await eventService.deleteEvent(id);
      setShowDeleteModal(false);
      navigate(backHref);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const statusActionLabel =
    event?.status === 'DRAFT' ? 'Publish Event' : event?.status === 'PUBLISHED' ? 'Cancel Event' : null;

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading event details...</div>;
  }

  if (error || !event) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error ?? 'Event not found'}</div>;
  }

  const eventStatus = event.status;
  const eventImage = event.image ?? event.bannerImage ?? EVENT_FALLBACK_IMAGE;

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden p-0">
        <img src={eventImage} alt={event.title} className="h-72 w-full object-cover" />
        <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#dbeafe_55%,#ffedd5_100%)] px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{event.category}</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{event.title}</h1>
            </div>
            {isPrivateWorkspace ? <EventStatusBadge status={event.lifecycleStatus} /> : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {canManageEvent ? (
              <>
                {statusActionLabel ? (
                  <Button
                    variant={eventStatus === 'PUBLISHED' ? 'danger' : 'primary'}
                    disabled={submitting}
                    onClick={() => (eventStatus === 'PUBLISHED' ? setShowCancelModal(true) : void handleStatusAction())}
                  >
                    {submitting ? 'Updating...' : statusActionLabel}
                  </Button>
                ) : null}
                {event.isEditable ? (
                  <Link to={`${eventsBasePath}/${event.id}/edit`}>
                    <Button>Edit Event</Button>
                  </Link>
                ) : null}
                {event.isDeletable ? (
                  <Button variant="danger" disabled={submitting} onClick={() => setShowDeleteModal(true)}>
                    Delete Event
                  </Button>
                ) : null}
                <Link to={backHref}>
                  <Button variant="secondary">Back to Events</Button>
                </Link>
              </>
            ) : (
              <Link to={backHref}>
                <Button variant="secondary">Back to Events</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <CalendarDays className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Schedule</p>
              <p className="text-sm text-slate-600">
                {formatFullDate(event.startDate)} - {formatFullDate(event.endDate)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <MapPin className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Venue</p>
              <p className="text-sm text-slate-600">{event.venue ? `${event.venue.name}, ${event.venue.location}` : 'No venue assigned'}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <Users className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Capacity Plan</p>
              <p className="text-sm text-slate-600">{event.attendeeLimit} attendees</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <IndianRupee className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Ticket Price</p>
              <p className="text-sm text-slate-600">{formatTicketPrice(event.ticketPrice)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Description</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{event.description ?? 'No event description provided yet.'}</p>
        </Card>

        <Card className="rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Organizer</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-950">Name:</span> {event.organizer?.name ?? 'Not available'}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Email:</span> {event.organizer?.email ?? 'Not available'}
            </p>
          </div>
        </Card>
      </div>
      <Card className="rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Gallery</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {event.galleryImages.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              <img src={imageUrl} alt={`${event.title} gallery ${index + 1}`} className="h-48 w-full object-cover" />
            </div>
          ))}
          {event.galleryImages.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 md:col-span-3">No gallery images uploaded yet.</div> : null}
        </div>
      </Card>
      {showCancelModal ? (
        <Modal
          eyebrow="Cancel Event"
          title="Cancel this event?"
          description="Are you sure you want to cancel this event?"
          onClose={() => setShowCancelModal(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Keep Event
              </Button>
              <Button variant="danger" disabled={submitting} onClick={() => void handleStatusAction()}>
                {submitting ? 'Cancelling...' : 'Cancel Event'}
              </Button>
            </>
          }
        />
      ) : null}
      {showDeleteModal ? (
        <Modal
          eyebrow="Delete Event"
          title="Delete this event?"
          description="This action permanently removes the event and its managed reservation links."
          onClose={() => setShowDeleteModal(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Keep Event
              </Button>
              <Button variant="danger" disabled={submitting} onClick={() => void handleDeleteEvent()}>
                {submitting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </>
          }
        />
      ) : null}
      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl shadow-emerald-100">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default EventDetailPage;
