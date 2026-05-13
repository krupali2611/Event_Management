import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Image as ImageIcon,
  IndianRupee,
  Mail,
  MapPin,
  PencilLine,
  Ticket,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import RemainingSeatsIndicator from '@/components/tickets/RemainingSeatsIndicator';
import TicketBookingModal from '@/components/tickets/TicketBookingModal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getEventById, getPublicEventById } from '@/services/api';
import { eventService } from '@/services/event.service';
import type { EventItem } from '@/types/event.types';
import { ticketService } from '@/services/ticketService';
import type { TicketBookingItem, TicketEventStats } from '@/types/ticket.types';
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

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatEventTime(startTime: string | null, endTime: string | null): string {
  if (!startTime && !endTime) {
    return 'Time to be announced';
  }

  return `${startTime ?? '--:--'}${endTime ? ` - ${endTime}` : ''}`;
}

function getOrganizerInitials(name: string | null | undefined): string {
  if (!name) {
    return 'EV';
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'EV';
}

function getCircularIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (index + total) % total;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  dividerClassName = 'border-[#E2E8F0]',
  iconClassName = 'bg-[rgba(37,99,255,0.08)] text-[#2563FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  labelClassName = 'text-[#64748B]',
  valueClassName = 'text-[#0F172A]',
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  dividerClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b py-4 last:border-b-0 last:pb-0 first:pt-0 ${dividerClassName}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`text-sm font-semibold ${labelClassName}`}>{label}</span>
      </div>
      <span className={`max-w-[58%] text-right text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accentClass,
  className = '',
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof CalendarDays;
  accentClass: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-[#E2E8F0] bg-white p-5 shadow-[0_14px_32px_rgba(37,99,255,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(37,99,255,0.14)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#071B4D]">{value}</p>
          <p className="mt-2 text-xs font-medium text-[#64748B]">{helper}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${accentClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [ticketStats, setTicketStats] = useState<TicketEventStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryRailRef = useRef<HTMLDivElement | null>(null);
  const canManageEvent = currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isOrganizerWorkspace = location.pathname.startsWith('/organizer');
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const isPrivateWorkspace = isOrganizerWorkspace || isAdminWorkspace;
  const isAttendeeWorkspace = location.pathname.startsWith('/attendee');
  const useAttendeeOrangeTheme = !isPrivateWorkspace && (!currentUser || currentUser.role === 'ATTENDEE' || isAttendeeWorkspace);
  const eventsBasePath = isAdminWorkspace ? '/admin/events' : '/organizer/events';
  const backHref = isPrivateWorkspace ? eventsBasePath : isAttendeeWorkspace ? '/attendee' : '/events';

  const fetchEvent = useCallback(async (): Promise<void> => {
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
  }, [id, isPrivateWorkspace]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (!isPrivateWorkspace) {
      return;
    }

    void (async () => {
      try {
        setStatsLoading(true);
        const response = await ticketService.getEventStats(id);
        setTicketStats(response.data ?? null);
      } catch {
        setTicketStats(null);
      } finally {
        setStatsLoading(false);
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

  const primaryImage = useMemo(() => {
    return event?.image?.trim() || event?.bannerImage?.trim() || EVENT_FALLBACK_IMAGE;
  }, [event?.bannerImage, event?.image]);

  const galleryImages = useMemo(() => {
    const imageSet = new Set(
      [...(event?.galleryImages ?? [])]
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
        .map((imageUrl) => imageUrl.trim()),
    );

    const resolvedImages = Array.from(imageSet).filter(Boolean);
    return resolvedImages;
  }, [event?.galleryImages]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return undefined;
    }

    const handleKeyDown = (eventKey: KeyboardEvent): void => {
      if (eventKey.key === 'Escape') {
        setLightboxIndex(null);
      }

      if (eventKey.key === 'ArrowLeft') {
        setLightboxIndex((currentIndex) => (currentIndex === null ? 0 : getCircularIndex(currentIndex - 1, galleryImages.length + 1)));
      }

      if (eventKey.key === 'ArrowRight') {
        setLightboxIndex((currentIndex) => (currentIndex === null ? 0 : getCircularIndex(currentIndex + 1, galleryImages.length + 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [galleryImages.length, lightboxIndex]);

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

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#E2E8F0] bg-white px-6 py-8 text-sm font-medium text-[#64748B] shadow-[0_10px_35px_rgba(37,99,255,0.08)]">
        Loading event details...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-700 shadow-[0_10px_35px_rgba(244,63,94,0.08)]">
        {error ?? 'Event not found'}
      </div>
    );
  }

  const eventStatus = event.status;
  const canBookEvent = !isPrivateWorkspace && event.status === 'PUBLISHED' && event.lifecycleStatus === 'UPCOMING';
  const soldOut = event.remainingSeats <= 0;
  const statusActionLabel =
    event.status === 'DRAFT'
      ? 'Publish Event'
      : event.lifecycleStatus === 'COMPLETED' && event.isDeletable
        ? 'Delete Event'
        : event.status === 'PUBLISHED'
          ? 'Cancel Event'
          : null;
  const currentImage = primaryImage;
  const previewImages = [primaryImage, ...galleryImages];
  const activeLightboxIndex = lightboxIndex ?? 0;
  const lightboxImage = previewImages[activeLightboxIndex] ?? EVENT_FALLBACK_IMAGE;
  const attendeeTheme = useAttendeeOrangeTheme
    ? {
        panelBorder: 'border-orange-100',
        panelShadow: 'shadow-[0_10px_35px_rgba(249,115,22,0.12)]',
        heroSurface: 'bg-[#FFF3E8]',
        eyebrowText: 'text-orange-100/90',
        actionPrimary:
          'bg-[linear-gradient(135deg,#F97316_0%,#FB923C_100%)] shadow-[0_12px_30px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#EA580C_0%,#F97316_100%)]',
        actionSecondary: 'border-orange-200 text-orange-700 shadow-[0_10px_22px_rgba(249,115,22,0.1)] hover:-translate-y-0.5 hover:bg-orange-50',
        contentGradient: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,237,0.92)_100%)]',
        contentEyebrow: 'text-orange-600',
        contentTitle: 'text-[#7C2D12]',
        calloutBorder: 'border-[rgba(249,115,22,0.18)]',
        calloutBackground: 'bg-[linear-gradient(135deg,rgba(255,237,213,0.88)_0%,rgba(255,255,255,0.96)_100%)]',
        calloutShadow: 'shadow-[0_10px_28px_rgba(249,115,22,0.12)]',
        infoIcon: 'bg-[rgba(249,115,22,0.1)] text-[#F97316] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
        bookingCard: 'shadow-[0_10px_32px_rgba(249,115,22,0.12)]',
        organizerBadge: 'bg-[linear-gradient(135deg,#F97316_0%,#FDBA74_100%)] shadow-[0_16px_30px_rgba(249,115,22,0.24)]',
        organizerMeta: 'bg-[#FFF7ED]',
        organizerMetaIcon: 'text-[#F97316]',
        galleryButton: 'border-orange-200 bg-[#FFF7ED] text-[#F97316] shadow-[0_8px_20px_rgba(249,115,22,0.1)] hover:-translate-y-0.5 hover:bg-white',
        galleryCard: 'bg-[#FFF3E8] shadow-[0_14px_34px_rgba(249,115,22,0.12)] hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(249,115,22,0.18)]',
        galleryFrameText: 'text-orange-100',
        lightboxGlow: 'bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.24),transparent_32%)]',
        lightboxEyebrow: 'text-orange-100/80',
      }
    : {
        panelBorder: 'border-[#E2E8F0]',
        panelShadow: 'shadow-[0_10px_35px_rgba(37,99,255,0.08)]',
        heroSurface: 'bg-[#DCE8FF]',
        eyebrowText: 'text-blue-100/90',
        actionPrimary:
          'bg-[linear-gradient(135deg,#2563FF_0%,#4F8CFF_100%)] shadow-[0_12px_30px_rgba(37,99,255,0.25)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1f4fe0_0%,#3d79ff_100%)]',
        actionSecondary: 'border-[#2563FF] text-[#2563FF] shadow-[0_10px_22px_rgba(37,99,255,0.08)] hover:-translate-y-0.5 hover:bg-blue-50',
        contentGradient: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,247,252,0.9)_100%)]',
        contentEyebrow: 'text-[#64748B]',
        contentTitle: 'text-[#071B4D]',
        calloutBorder: 'border-[rgba(37,99,255,0.14)]',
        calloutBackground: 'bg-[linear-gradient(135deg,rgba(239,246,255,0.88)_0%,rgba(255,255,255,0.96)_100%)]',
        calloutShadow: 'shadow-[0_10px_28px_rgba(37,99,255,0.08)]',
        infoIcon: 'bg-[rgba(37,99,255,0.08)] text-[#2563FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
        bookingCard: 'shadow-[0_10px_32px_rgba(37,99,255,0.08)]',
        organizerBadge: 'bg-[linear-gradient(135deg,#2563FF_0%,#7AA2FF_100%)] shadow-[0_16px_30px_rgba(37,99,255,0.24)]',
        organizerMeta: 'bg-[#F8FBFF]',
        organizerMetaIcon: 'text-[#2563FF]',
        galleryButton: 'border-[#D6E3FF] bg-[#F8FBFF] text-[#2563FF] shadow-[0_8px_20px_rgba(37,99,255,0.08)] transition hover:-translate-y-0.5 hover:bg-white',
        galleryCard: 'bg-[#E5EEFF] shadow-[0_14px_34px_rgba(37,99,255,0.08)] hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(37,99,255,0.16)]',
        galleryFrameText: 'text-blue-100',
        lightboxGlow: 'bg-[radial-gradient(circle_at_top,rgba(37,99,255,0.2),transparent_32%)]',
        lightboxEyebrow: 'text-blue-100/80',
      };

  const handleBookTicketClick = (): void => {
    if (!currentUser) {
      navigate('/login', {
        state: {
          from: location,
        },
      });
      return;
    }

    if (currentUser.role !== 'ATTENDEE') {
      setToast('Only attendee accounts can book tickets for events.');
      return;
    }

    if (!canBookEvent || soldOut) {
      return;
    }

    setShowBookingModal(true);
  };

  const handleTicketBooked = async (booking: TicketBookingItem): Promise<void> => {
    setShowBookingModal(false);
    setToast(`Ticket booked successfully - ${booking.ticketNumber}`);
    await fetchEvent();
  };

  const scrollGallery = (direction: 'prev' | 'next'): void => {
    const rail = galleryRailRef.current;

    if (!rail) {
      return;
    }

    const cardWidth = 276;
    rail.scrollBy({
      left: direction === 'next' ? cardWidth : -cardWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-8">
      <Card className={`overflow-hidden rounded-[28px] border bg-white ${attendeeTheme.panelBorder} ${attendeeTheme.panelShadow}`}>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)]">
          <div className={`border-b p-4 lg:border-b-0 lg:border-r lg:p-5 ${attendeeTheme.panelBorder}`}>
            <div
              className={`group relative h-[260px] overflow-hidden rounded-[24px] ${attendeeTheme.heroSurface} shadow-[0_18px_38px_rgba(7,27,77,0.12)] md:h-[300px] xl:h-[340px]`}
              role="button"
              tabIndex={0}
              onClick={() => setLightboxIndex(0)}
              onKeyDown={(keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                  keyEvent.preventDefault();
                  setLightboxIndex(0);
                }
              }}
            >
              <img
                src={currentImage}
                alt={event.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-md">
                  {event.category}
                </div>
                <div className="rounded-full border border-white/35 bg-slate-950/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
                  1/1
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${attendeeTheme.eyebrowText}`}>Featured View</p>
                <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">{event.title}</h2>
              </div>
            </div>

            {canManageEvent ? (
              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#64748B]">Actions</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {event.isEditable ? (
                    <Link to={`${eventsBasePath}/${event.id}/edit`} className="block">
                      <Button
                        icon={<PencilLine className="h-4 w-4" />}
                        className="h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563FF_0%,#4F8CFF_100%)] shadow-[0_12px_30px_rgba(37,99,255,0.25)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1f4fe0_0%,#3d79ff_100%)]"
                      >
                        Edit Event
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      disabled
                      icon={<PencilLine className="h-4 w-4" />}
                      className="h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563FF_0%,#4F8CFF_100%)] shadow-[0_12px_30px_rgba(37,99,255,0.25)]"
                    >
                      Edit Event
                    </Button>
                  )}

                  <Link to={`${eventsBasePath}/${event.id}/attendees`} className="block">
                    <Button
                      variant="secondary"
                      icon={<Eye className="h-4 w-4" />}
                      className="h-[52px] w-full rounded-2xl border-[#2563FF] text-[#2563FF] shadow-[0_10px_22px_rgba(37,99,255,0.08)] hover:-translate-y-0.5 hover:bg-blue-50"
                    >
                      View Attendees
                    </Button>
                  </Link>

                  <Button
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                    disabled={!event.isDeletable || submitting}
                    onClick={() => setShowDeleteModal(true)}
                    className="h-[52px] w-full rounded-2xl bg-rose-50 text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.12)] hover:-translate-y-0.5 hover:bg-rose-100 disabled:bg-rose-50 disabled:text-rose-300"
                  >
                    {submitting ? 'Deleting...' : 'Delete Event'}
                  </Button>

                </div>
              </div>
            ) : (
              <div className="mt-6">
                {canBookEvent ? (
                  <Button
                    variant={soldOut ? 'secondary' : 'primary'}
                    disabled={soldOut}
                    onClick={handleBookTicketClick}
                    icon={<Ticket className="h-4 w-4" />}
                    className={`h-[52px] w-full rounded-2xl ${
                      soldOut
                        ? 'border border-[#CBD5E1] bg-white text-[#64748B]'
                        : attendeeTheme.actionPrimary
                    }`}
                  >
                    {soldOut ? 'Sold Out' : currentUser ? 'Book Ticket' : 'Login to Book'}
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          <div className={`${attendeeTheme.contentGradient} p-5 md:p-6 xl:p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.32em] ${attendeeTheme.contentEyebrow}`}>Event Profile</p>
                <h2 className={`mt-3 text-2xl font-bold tracking-tight xl:text-3xl ${attendeeTheme.contentTitle}`}>{event.title}</h2>
              </div>
              <div className="ml-auto flex flex-col items-end gap-3">
                <Link to={backHref} className="block">
                  <Button
                    variant="secondary"
                    icon={<ChevronLeft className="h-4 w-4" />}
                    className={`h-[40px] rounded-xl px-3 text-xs ${useAttendeeOrangeTheme ? attendeeTheme.actionSecondary : 'border-[#CBD5E1] bg-white text-[#0F172A] shadow-[0_10px_22px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:bg-slate-50'}`}
                  >
                    Back to Events
                  </Button>
                </Link>
                {isPrivateWorkspace ? <EventStatusBadge status={event.status} lifecycleStatus={event.lifecycleStatus} /> : null}
              </div>
            </div>

            {statusActionLabel && canManageEvent ? (
              <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-4 ${attendeeTheme.calloutBorder} ${attendeeTheme.calloutBackground} ${attendeeTheme.calloutShadow}`}>
                <div>
                  <p className={`text-sm font-semibold ${attendeeTheme.contentTitle}`}>Quick event control</p>
                  <p className="mt-1 text-sm text-[#64748B]">Update this event lifecycle without leaving the profile.</p>
                </div>
                <Button
                  variant={eventStatus === 'PUBLISHED' || statusActionLabel === 'Delete Event' ? 'danger' : 'primary'}
                  disabled={submitting}
                  onClick={() => {
                    if (statusActionLabel === 'Delete Event') {
                      setShowDeleteModal(true);
                      return;
                    }

                    if (eventStatus === 'PUBLISHED') {
                      setShowCancelModal(true);
                      return;
                    }

                    void handleStatusAction();
                  }}
                  className="h-[52px] rounded-2xl px-5 shadow-[0_12px_28px_rgba(37,99,255,0.18)]"
                >
                  {submitting ? 'Updating...' : statusActionLabel}
                </Button>
              </div>
            ) : null}

            <div className={`mt-6 rounded-[24px] border bg-white/80 p-5 backdrop-blur-sm ${attendeeTheme.panelBorder}`}>
              <div className="space-y-1">
                <InfoRow
                  icon={CalendarDays}
                  label="Date"
                  value={`${formatFullDate(event.startDate)} - ${formatFullDate(event.endDate)}`}
                  iconClassName={attendeeTheme.infoIcon}
                />
                <InfoRow icon={Clock3} label="Time" value={formatEventTime(event.startTime, event.endTime)} iconClassName={attendeeTheme.infoIcon} />
                <InfoRow icon={MapPin} label="Venue" value={event.venue ? `${event.venue.name}, ${event.venue.location}` : 'No venue assigned'} iconClassName={attendeeTheme.infoIcon} />
                <InfoRow icon={UserRound} label="Organizer" value={event.organizer?.name ?? 'Not available'} iconClassName={attendeeTheme.infoIcon} />
                <InfoRow icon={IndianRupee} label="Ticket Price" value={formatTicketPrice(event.ticketPrice)} iconClassName={attendeeTheme.infoIcon} />
              </div>
            </div>

          </div>
        </div>
      </Card>

      {!isPrivateWorkspace && currentUser && currentUser.role !== 'ATTENDEE' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className={`rounded-[24px] border bg-white p-5 ${attendeeTheme.panelBorder} ${attendeeTheme.bookingCard}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#64748B]">Booking Access</p>
            <div className="mt-4 space-y-2 text-sm leading-7 text-[#64748B]">
              <p>{currentUser ? `Signed in as ${currentUser.role.replace('_', ' ')}` : 'You are browsing as a public user.'}</p>
              {!currentUser ? <p>Login is required to reserve tickets for this event.</p> : null}
              {currentUser ? <p>Only attendee accounts can continue to the booking flow.</p> : null}
              {event.lifecycleStatus !== 'UPCOMING' || event.status !== 'PUBLISHED' ? <p>Booking is unavailable because this event is no longer open for new reservations.</p> : null}
            </div>
          </Card>
          <RemainingSeatsIndicator remainingSeats={event.remainingSeats} attendeeLimit={event.attendeeLimit} soldTickets={event.soldTickets} />
        </div>
      ) : null}

      {isPrivateWorkspace ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Tickets Sold"
            value={statsLoading ? '--' : ticketStats?.totalTicketsSold ?? event.soldTickets}
            helper={`${statsLoading ? '--' : ticketStats?.remainingSeats ?? event.remainingSeats} seats remaining`}
            icon={Ticket}
            accentClass="bg-[linear-gradient(135deg,#DBEAFE_0%,#EFF6FF_100%)] text-[#2563FF]"
          />
          <StatCard
            label="Counted Bookings"
            value={statsLoading ? '--' : ticketStats?.countedBookings ?? ticketStats?.confirmedBookings ?? 0}
            helper={`${statsLoading ? '--' : ticketStats?.cancelledBookings ?? 0} cancelled`}
            icon={Users}
            accentClass="bg-[linear-gradient(135deg,#D1FAE5_0%,#ECFDF5_100%)] text-emerald-600"
          />
          <StatCard
            label="Attendee Limit"
            value={event.attendeeLimit}
            helper="Max bookable capacity"
            icon={CalendarDays}
            accentClass="bg-[linear-gradient(135deg,#FDE68A_0%,#FFFBEB_100%)] text-amber-600"
          />
          <StatCard
            label="Remaining Seats"
            value={statsLoading ? '--' : ticketStats?.remainingSeats ?? event.remainingSeats}
            helper={soldOut ? 'Currently sold out' : 'Seats available right now'}
            icon={Users}
            accentClass="bg-[linear-gradient(135deg,#FFEDD5_0%,#FFF7ED_100%)] text-orange-600"
          />
          <StatCard
            label="Revenue"
            value={statsLoading ? '--' : formatRevenue(ticketStats?.totalRevenue ?? 0)}
            helper="Counted bookings only"
            icon={IndianRupee}
            accentClass="bg-[linear-gradient(135deg,#E0E7FF_0%,#EEF2FF_100%)] text-indigo-600"
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            label="Attendee Limit"
            value={event.attendeeLimit}
            helper="Max bookable capacity"
            icon={CalendarDays}
            accentClass="bg-[linear-gradient(135deg,#FFEDD5_0%,#FFF7ED_100%)] text-orange-600"
            className="border-orange-100 shadow-[0_14px_32px_rgba(249,115,22,0.12)] hover:shadow-[0_18px_40px_rgba(249,115,22,0.18)]"
          />
          <StatCard
            label="Remaining Seats"
            value={event.remainingSeats}
            helper={soldOut ? 'Currently sold out' : 'Seats available right now'}
            icon={Users}
            accentClass="bg-[linear-gradient(135deg,#FED7AA_0%,#FFF7ED_100%)] text-orange-700"
            className="border-orange-100 shadow-[0_14px_32px_rgba(249,115,22,0.12)] hover:shadow-[0_18px_40px_rgba(249,115,22,0.18)]"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className={`rounded-[24px] border bg-white p-6 ${attendeeTheme.panelBorder} ${attendeeTheme.bookingCard}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#64748B]">Description</p>
          <h3 className={`mt-3 text-2xl font-bold tracking-tight ${attendeeTheme.contentTitle}`}>About this event</h3>
          <p className="mt-5 text-sm leading-8 text-[#475569]">{event.description ?? 'No event description provided yet.'}</p>
        </Card>

        <Card className={`rounded-[24px] border bg-white p-6 ${attendeeTheme.panelBorder} ${attendeeTheme.bookingCard}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#64748B]">Organizer</p>
          <div className="mt-5 flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] text-lg font-bold text-white ${attendeeTheme.organizerBadge}`}>
              {getOrganizerInitials(event.organizer?.name)}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${attendeeTheme.contentTitle}`}>{event.organizer?.name ?? 'Not available'}</h3>
              <p className="mt-1 text-sm text-[#64748B]">Organizer profile</p>
            </div>
          </div>

          <div className={`mt-6 space-y-4 rounded-[20px] border p-5 ${attendeeTheme.panelBorder} ${attendeeTheme.organizerMeta}`}>
            <div className="flex items-center gap-3 text-sm text-[#475569]">
              <Mail className={`h-4 w-4 ${attendeeTheme.organizerMetaIcon}`} />
              <span>{event.organizer?.email ?? 'Not available'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#475569]">
              <Clock3 className={`h-4 w-4 ${attendeeTheme.organizerMetaIcon}`} />
              <span>{formatEventTime(event.startTime, event.endTime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#475569]">
              <CalendarDays className={`h-4 w-4 ${attendeeTheme.organizerMetaIcon}`} />
              <span>{formatFullDate(event.startDate)}</span>
            </div>
          </div>

        </Card>
      </div>

      <Card className={`rounded-[28px] border bg-white p-6 ${attendeeTheme.panelBorder} ${attendeeTheme.panelShadow}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#64748B]">Gallery</p>
            <h3 className={`mt-2 text-2xl font-bold tracking-tight ${attendeeTheme.contentTitle}`}>Event moments</h3>
          </div>
          {galleryImages.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll gallery left"
                onClick={() => scrollGallery('prev')}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${attendeeTheme.galleryButton}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll gallery right"
                onClick={() => scrollGallery('next')}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${attendeeTheme.galleryButton}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>

        <div ref={galleryRailRef} className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
          {galleryImages.length > 0 ? (
            galleryImages.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              data-gallery-index={index}
              onClick={() => setLightboxIndex(index + 1)}
              className={`group relative block h-56 w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border text-left transition duration-300 ${attendeeTheme.galleryCard} ${attendeeTheme.panelBorder}`}
            >
              <img
                src={imageUrl}
                alt={`${event.title} gallery ${index + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(7,27,77,0.82)] to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${attendeeTheme.galleryFrameText}`}>Frame {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{event.title}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur-md">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
            </button>
            ))
          ) : (
            <div className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FBFF] px-5 py-10 text-sm font-medium text-[#64748B]">
              No gallery images uploaded yet.
            </div>
          )}
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
          description="Deleting this event will permanently remove all event details and related entries."
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
        >
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            <p className="font-semibold text-rose-900">This cannot be undone.</p>
            <p>After you confirm, this event and all related data will be deleted permanently.</p>
            <p>Included in deletion: attendee tickets, attendee registrations, and venue booking entries linked to this event.</p>
          </div>
        </Modal>
      ) : null}

      {showBookingModal ? <TicketBookingModal event={event} onClose={() => setShowBookingModal(false)} onBooked={(booking) => void handleTicketBooked(booking)} /> : null}

      {lightboxIndex !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(2,6,23,0.86)] p-4 backdrop-blur-xl"
              onClick={() => setLightboxIndex(null)}
              role="presentation"
            >
              <div className={`absolute inset-0 ${attendeeTheme.lightboxGlow}`} />
              <button
                type="button"
                aria-label="Close image preview"
                onClick={() => setLightboxIndex(null)}
                className="absolute right-4 top-4 z-[210] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-md transition hover:bg-white/20 md:right-6 md:top-6"
              >
                <X className="h-5 w-5" />
              </button>

              {previewImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous preview image"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setLightboxIndex((currentIndex) => (currentIndex === null ? 0 : getCircularIndex(currentIndex - 1, previewImages.length)));
                    }}
                    className="absolute left-3 top-1/2 z-[210] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-md transition hover:bg-white/20 md:left-6"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next preview image"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setLightboxIndex((currentIndex) => (currentIndex === null ? 0 : getCircularIndex(currentIndex + 1, previewImages.length)));
                    }}
                    className="absolute right-3 top-1/2 z-[210] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-md transition hover:bg-white/20 md:right-6"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              <div
                className="relative z-[205] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/12 bg-white/6 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-md md:p-5"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
              >
                <div className="overflow-hidden rounded-[22px] bg-slate-950">
                  <img src={lightboxImage} alt={`${event.title} preview ${activeLightboxIndex + 1}`} className="max-h-[78vh] w-full object-contain" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 pb-1 text-white">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${attendeeTheme.lightboxEyebrow}`}>{event.category}</p>
                    <p className="mt-1 text-lg font-semibold">{event.title}</p>
                  </div>
                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                    {activeLightboxIndex + 1} / {previewImages.length}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.18)]">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default EventDetailPage;
