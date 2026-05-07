import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, ImagePlus, MapPin, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { checkAvailability as checkVenueAvailability } from '@/services/api';
import type { EventItem, EventPayload } from '@/types/event.types';
import type { BookingAvailability } from '@/types/venue-booking.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function getTomorrowDateValue(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 10);
}

const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional(),
    category: z.string().trim().min(1, 'Category is required'),
    ticketPrice: z.number().min(0, 'Ticket price cannot be negative'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    attendeeLimit: z.number().int().min(1, 'Attendee limit must be greater than 0'),
    venueId: z.string().trim().min(1, 'Venue selection is required'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']),
  })
  .refine(
    (value) => {
      const startDate = new Date(value.startDate);
      startDate.setHours(0, 0, 0, 0);
      const tomorrow = new Date(getTomorrowDateValue());
      return startDate.getTime() >= tomorrow.getTime();
    },
    {
      message: 'Start date must be at least tomorrow',
      path: ['startDate'],
    },
  )
  .refine((value) => new Date(value.startDate).getTime() <= new Date(value.endDate).getTime(), {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export type EventWizardValues = z.output<typeof eventFormSchema>;

interface NewGalleryPreviewItem {
  file: File;
  previewUrl: string;
}

function toDefaultValues(initialEvent?: EventItem): EventWizardValues {
  return {
    title: initialEvent?.title ?? '',
    description: initialEvent?.description ?? '',
    category: initialEvent?.category ?? '',
    ticketPrice: initialEvent?.ticketPrice ?? 0,
    startDate: initialEvent?.startDate ? initialEvent.startDate.slice(0, 10) : '',
    endDate: initialEvent?.endDate ? initialEvent.endDate.slice(0, 10) : '',
    startTime: initialEvent?.startTime ?? '',
    endTime: initialEvent?.endTime ?? '',
    attendeeLimit: initialEvent?.attendeeLimit ?? 1,
    venueId: initialEvent?.venueId ?? '',
    status: initialEvent?.status ?? 'DRAFT',
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

function EventWizardForm({
  venues,
  initialEvent,
  submitting,
  onSubmit,
  mode = 'create',
}: {
  venues: Venue[];
  initialEvent?: EventItem;
  submitting: boolean;
  onSubmit: (payload: EventPayload) => Promise<void>;
  mode?: 'create' | 'edit';
}) {
  const tomorrowDate = useMemo(() => getTomorrowDateValue(), []);
  const [availability, setAvailability] = useState<BookingAvailability | null>(initialEvent?.venueId ? { available: true } : null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialEvent?.bannerImage ?? null);
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>(initialEvent?.galleryImages ?? []);
  const [newGalleryImages, setNewGalleryImages] = useState<NewGalleryPreviewItem[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EventWizardValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toDefaultValues(initialEvent),
  });

  const values = watch();
  const selectedVenue = useMemo(() => venues.find((venue) => venue.id === values.venueId) ?? null, [venues, values.venueId]);
  const canCheckAvailability = Boolean(values.venueId && values.startDate && values.endDate);
  const capacityExceeded = Boolean(selectedVenue && values.attendeeLimit > selectedVenue.capacity);
  const attendeeHelperText = selectedVenue ? `Max allowed: ${selectedVenue.capacity}` : 'Select a venue to see the maximum allowed attendees.';
  const isVenueAvailable = availability?.available === true;
  const isSubmitDisabled = submitting || !values.venueId || capacityExceeded || !isVenueAvailable;

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

  useEffect(() => {
    setAvailabilityError(null);
  }, [values.endDate, values.endTime, values.startDate, values.startTime, values.venueId]);

  useEffect(() => {
    setBannerImageFile(null);
    setBannerPreview(initialEvent?.bannerImage ?? null);
    setExistingGalleryImages(initialEvent?.galleryImages ?? []);
    setNewGalleryImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  }, [initialEvent]);

  useEffect(() => {
    if (capacityExceeded) {
      setError('attendeeLimit', {
        type: 'manual',
        message: 'Exceeds venue capacity',
      });
      return;
    }

    if (errors.attendeeLimit?.type === 'manual') {
      clearErrors('attendeeLimit');
    }
  }, [capacityExceeded, clearErrors, errors.attendeeLimit?.type, setError]);

  useEffect(() => {
    return () => {
      newGalleryImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [newGalleryImages]);

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextFile = event.target.files?.[0] ?? null;
    setBannerImageFile(nextFile);
    setBannerPreview(nextFile ? URL.createObjectURL(nextFile) : null);
    event.target.value = '';
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextFiles = Array.from(event.target.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    const nextItems = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewGalleryImages((current) => [...current, ...nextItems]);
    event.target.value = '';
  };

  const handleRemoveBanner = (): void => {
    setBannerImageFile(null);
    setBannerPreview(null);
  };

  const handleRemoveGalleryImage = (index: number): void => {
    if (index < existingGalleryImages.length) {
      setExistingGalleryImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
      return;
    }

    const newImageIndex = index - existingGalleryImages.length;
    setNewGalleryImages((current) => {
      const removedItem = current[newImageIndex];

      if (removedItem) {
        URL.revokeObjectURL(removedItem.previewUrl);
      }

      return current.filter((_, currentIndex) => currentIndex !== newImageIndex);
    });
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
        eventId: initialEvent?.id,
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
    const venue = venues.find((item) => item.id === formValues.venueId) ?? null;

    if (venue && formValues.attendeeLimit > venue.capacity) {
      setError('attendeeLimit', {
        type: 'manual',
        message: 'Exceeds venue capacity',
      });
      return;
    }

    if (!availability?.available) {
      setAvailabilityError('Please confirm venue availability before submitting.');
      return;
    }

    const payload: EventPayload = {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || undefined,
      bannerImage: bannerImageFile ? undefined : bannerPreview,
      bannerImageFile,
      galleryImages: existingGalleryImages,
      galleryImageFiles: newGalleryImages.map((item) => item.file),
      category: formValues.category.trim(),
      ticketPrice: formValues.ticketPrice,
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

  const galleryPreviewUrls = [...existingGalleryImages, ...newGalleryImages.map((item) => item.previewUrl)];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-xl p-0 shadow-sm">
        <form onSubmit={handleSubmit((formValues) => void submit(formValues))} className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="rounded-xl p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                  <Input {...register('title')} className="px-3 py-2 text-sm" placeholder="Annual product launch" />
                  <FieldError message={errors.title?.message} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                    placeholder="Short event summary"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                    <Input {...register('category')} className="px-3 py-2 text-sm" placeholder="Conference" />
                    <FieldError message={errors.category?.message} />
                  </div>
                  {mode === 'create' ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                      <select
                        {...register('status')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                    </div>
                  ) : (
                    <input type="hidden" {...register('status')} />
                  )}
                </div>
              </div>
            </Card>

            <Card className="rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                  <Input {...register('startDate')} className="px-3 py-2 text-sm" type="date" min={tomorrowDate} />
                  <FieldError message={errors.startDate?.message} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                  <Input {...register('endDate')} className="px-3 py-2 text-sm" type="date" min={values.startDate || tomorrowDate} />
                  <FieldError message={errors.endDate?.message} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
                  <Input {...register('startTime')} className="px-3 py-2 text-sm" type="time" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
                  <Input {...register('endTime')} className="px-3 py-2 text-sm" type="time" />
                </div>
              </div>
            </Card>

            <Card className="rounded-xl p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Venue</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      {...register('venueId')}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                    >
                      <option value="">Select a venue</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.location}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="secondary" disabled={!canCheckAvailability || checkingAvailability} onClick={() => void checkAvailability()}>
                      {checkingAvailability ? 'Checking...' : 'Check Availability'}
                    </Button>
                  </div>
                  <FieldError message={errors.venueId?.message} />
                  {availabilityError ? <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{availabilityError}</div> : null}
                  {availability?.available ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Available
                    </div>
                  ) : null}
                  {availability && !availability.available ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                      <AlertCircle className="h-4 w-4" />
                      Not Available
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-slate-900">{selectedVenue?.name ?? 'No venue selected'}</p>
                      <p className="text-slate-600">{selectedVenue?.location ?? 'Select a venue to view its location.'}</p>
                      <p className="text-slate-600">Capacity: {selectedVenue?.capacity ?? '--'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Attendee Limit</label>
                  <Input {...register('attendeeLimit', { valueAsNumber: true })} className="px-3 py-2 text-sm" type="number" min={1} />
                  <p className={`mt-1 text-xs ${capacityExceeded ? 'text-rose-600' : 'text-slate-500'}`}>{attendeeHelperText}</p>
                  <FieldError message={errors.attendeeLimit?.message} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Ticket Price</label>
                  <Input
                    {...register('ticketPrice', { valueAsNumber: true })}
                    className="px-3 py-2 text-sm"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter ticket price"
                  />
                  <FieldError message={errors.ticketPrice?.message} />
                </div>
              </div>

              <div className={`mt-3 rounded-xl border p-3 text-sm ${capacityExceeded ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4" />
                  <p>{capacityExceeded ? 'Exceeds venue capacity. Reduce the attendee limit or choose a larger venue.' : 'Attendee limit is within the selected venue capacity.'}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">Banner Image</label>
                  {bannerPreview ? (
                    <Button type="button" variant="ghost" size="icon" onClick={handleRemoveBanner} icon={<X className="h-4 w-4" />} />
                  ) : null}
                </div>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-brand-400 hover:bg-white">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="h-24 w-32 rounded-lg border object-cover" />
                  ) : (
                    <>
                      <ImagePlus className="h-7 w-7 text-slate-400" />
                      <p className="mt-2 text-sm font-medium text-slate-700">Upload banner image</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-brand-400 hover:bg-white">
                  <div>
                    <ImagePlus className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Upload gallery images</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                </label>
                <div className="flex flex-wrap gap-3">
                  {galleryPreviewUrls.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative">
                      <img src={imageUrl} alt={`Gallery preview ${index + 1}`} className="h-24 w-32 rounded-lg border object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {galleryPreviewUrls.length === 0 ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">No gallery images added yet.</div> : null}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitting ? 'Saving...' : initialEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EventWizardForm;
