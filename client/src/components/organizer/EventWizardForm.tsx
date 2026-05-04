import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { checkAvailability as checkVenueAvailability } from '@/services/api';
import type { BookingAvailability } from '@/types/venue-booking.types';
import type { EventItem, EventPayload } from '@/types/event.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional(),
    category: z.string().trim().min(1, 'Category is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    attendeeLimit: z.number().int().min(1, 'Attendee limit must be greater than 0'),
    venueId: z.string().trim().min(1, 'Venue selection is required'),
    status: z.enum(['draft', 'published', 'cancelled']),
  })
  .refine((value) => new Date(value.startDate).getTime() <= new Date(value.endDate).getTime(), {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export type EventWizardValues = z.output<typeof eventFormSchema>;

const steps = [
  { id: 1, title: 'Basic Info', icon: Sparkles },
  { id: 2, title: 'Date & Time', icon: CalendarDays },
  { id: 3, title: 'Venue', icon: MapPin },
] as const;

function toDefaultValues(initialEvent?: EventItem): EventWizardValues {
  return {
    title: initialEvent?.title ?? '',
    description: initialEvent?.description ?? '',
    category: initialEvent?.category ?? '',
    startDate: initialEvent?.startDate ? initialEvent.startDate.slice(0, 10) : '',
    endDate: initialEvent?.endDate ? initialEvent.endDate.slice(0, 10) : '',
    startTime: initialEvent?.startTime ?? '',
    endTime: initialEvent?.endTime ?? '',
    attendeeLimit: initialEvent?.attendeeLimit ?? 1,
    venueId: initialEvent?.venueId ?? '',
    status: initialEvent?.status ?? 'draft',
  };
}

function EventWizardForm({
  venues,
  initialEvent,
  submitting,
  onSubmit,
}: {
  venues: Venue[];
  initialEvent?: EventItem;
  submitting: boolean;
  onSubmit: (payload: EventPayload) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [availability, setAvailability] = useState<BookingAvailability | null>(initialEvent?.venueId ? { available: true } : null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<EventWizardValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toDefaultValues(initialEvent),
  });

  const values = watch();
  const selectedVenue = useMemo(() => venues.find((venue) => venue.id === values.venueId), [values.venueId, venues]);
  const canCheckAvailability = Boolean(values.venueId && values.startDate && values.endDate);

  useEffect(() => {
    if (!initialEvent) {
      setAvailability(null);
      return;
    }

    const scheduleChanged =
      values.venueId !== (initialEvent.venueId ?? '') ||
      values.startDate !== initialEvent.startDate.slice(0, 10) ||
      values.endDate !== initialEvent.endDate.slice(0, 10) ||
      values.startTime !== (initialEvent.startTime ?? '') ||
      values.endTime !== (initialEvent.endTime ?? '');

    setAvailability(scheduleChanged ? null : initialEvent.venueId ? { available: true } : null);
  }, [initialEvent, values.endDate, values.endTime, values.startDate, values.startTime, values.venueId]);

  const handleNext = async (): Promise<void> => {
    const fields =
      step === 1
        ? (['title', 'description', 'category', 'attendeeLimit', 'status'] as const)
        : (['startDate', 'endDate', 'startTime', 'endTime'] as const);
    const isValid = await trigger(fields);

    if (isValid) {
      setStep((current) => Math.min(3, current + 1));
    }
  };

  const checkAvailability = async (): Promise<void> => {
    if (!canCheckAvailability || !values.venueId) {
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);
      const response = await checkVenueAvailability({
        venueId: values.venueId,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      });
      setAvailability(response.data ?? null);
    } catch (requestError) {
      setAvailability(null);
      setAvailabilityError(getApiErrorMessage(requestError));
    } finally {
      setCheckingAvailability(false);
    }
  };

  const submit = async (formValues: EventWizardValues): Promise<void> => {
    const payload: EventPayload = {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || undefined,
      category: formValues.category.trim(),
      startDate: new Date(formValues.startDate).toISOString(),
      endDate: new Date(formValues.endDate).toISOString(),
      startTime: formValues.startTime || undefined,
      endTime: formValues.endTime || undefined,
      attendeeLimit: formValues.attendeeLimit,
      venueId: formValues.venueId,
      status: formValues.status,
    };

    await onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_40%,#d97706_100%)] px-6 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Event Builder</p>
          <h2 className="mt-3 text-2xl font-semibold">{initialEvent ? 'Edit event rollout' : 'Create a new event'}</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {steps.map((item) => {
              const Icon = item.icon;
              const active = step === item.id;
              const completed = step > item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border px-4 py-4 transition ${
                    active ? 'border-white/40 bg-white/15' : completed ? 'border-emerald-300/40 bg-emerald-400/15' : 'border-white/15 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl p-2 ${completed ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/65">Step {item.id}</p>
                      <p className="font-semibold">{item.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit((values) => void submit(values))} className="space-y-6 p-6">
          {step === 1 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <Input {...register('title')} placeholder="Annual product launch" />
                {errors.title ? <p className="mt-2 text-sm text-rose-600">{errors.title.message}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                  placeholder="Give your team and attendees a clear event summary."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <Input {...register('category')} placeholder="Conference" />
                {errors.category ? <p className="mt-2 text-sm text-rose-600">{errors.category.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Attendee Limit</label>
                <Input {...register('attendeeLimit', { valueAsNumber: true })} type="number" min={1} />
                {errors.attendeeLimit ? <p className="mt-2 text-sm text-rose-600">{errors.attendeeLimit.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                <Input {...register('startDate')} type="date" />
                {errors.startDate ? <p className="mt-2 text-sm text-rose-600">{errors.startDate.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
                <Input {...register('endDate')} type="date" />
                {errors.endDate ? <p className="mt-2 text-sm text-rose-600">{errors.endDate.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Time</label>
                <Input {...register('startTime')} type="time" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End Time</label>
                <Input {...register('endTime')} type="time" />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Venue</label>
                  <select
                    {...register('venueId')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                  >
                    <option value="">Select a venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.location}
                      </option>
                    ))}
                  </select>
                  {errors.venueId ? <p className="mt-2 text-sm text-rose-600">{errors.venueId.message}</p> : null}
                </div>
                <Card className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Venue Snapshot</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{selectedVenue?.name ?? 'No venue selected'}</h3>
                  <p className="mt-2 text-sm text-slate-600">{selectedVenue ? `${selectedVenue.location} - Capacity ${selectedVenue.capacity}` : 'Pick a venue to inspect its capacity and location.'}</p>
                </Card>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" disabled={!canCheckAvailability || checkingAvailability} onClick={() => void checkAvailability()}>
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </Button>
                {availability?.available ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Venue available for this schedule
                  </div>
                ) : null}
                {availability && !availability.available ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4" />
                    Venue not available
                  </div>
                ) : null}
              </div>

              {availabilityError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{availabilityError}</div> : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-slate-200 pt-5">
            <Button type="button" variant="ghost" disabled={step === 1} icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep((current) => Math.max(1, current - 1))}>
              Back
            </Button>
            <div className="flex gap-3">
              {step < 3 ? (
                <Button type="button" icon={<ArrowRight className="h-4 w-4" />} onClick={() => void handleNext()}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitting || !values.venueId || !availability?.available}>
                  {submitting ? 'Saving...' : initialEvent ? 'Update Event' : 'Create Event'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EventWizardForm;
