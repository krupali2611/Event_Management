import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, LoaderCircle, MapPin, Save, Upload, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import VenueCard from '@/components/admin/VenueCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { venueService } from '@/services/venue.service';
import type { Venue, VenuePayload } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const venueFormSchema = z.object({
  name: z.string().trim().min(1, 'Venue name is required'),
  location: z.string().trim().min(1, 'Location is required'),
  address: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be greater than 0'),
  description: z.string().trim().optional(),
  image: z.union([z.string().trim().url('Please enter a valid URL'), z.literal('')]).optional(),
  imagePublicId: z.string().trim().optional(),
  amenities: z.string().trim().optional(),
  isActive: z.boolean(),
});

type VenueFormValues = z.output<typeof venueFormSchema>;
type VenueFormInput = z.input<typeof venueFormSchema>;

interface VenueFormProps {
  mode: 'create' | 'edit';
  initialVenue?: Venue;
  submitting: boolean;
  onSubmit: (payload: VenuePayload) => Promise<void>;
}

function mapVenueToValues(initialVenue?: Venue): VenueFormValues {
  return {
    name: initialVenue?.name ?? '',
    location: initialVenue?.location ?? '',
    address: initialVenue?.address ?? '',
    capacity: initialVenue?.capacity ?? 1,
    description: initialVenue?.description ?? '',
    image: initialVenue?.image ?? '',
    imagePublicId: '',
    amenities: initialVenue?.amenities.join(', ') ?? '',
    isActive: initialVenue?.isActive ?? true,
  };
}

function VenueForm({ mode, initialVenue, submitting, onSubmit }: VenueFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VenueFormInput, undefined, VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: mapVenueToValues(initialVenue),
  });

  const imageUrl = watch('image');
  const previewVenue = useMemo<Venue>(
    () => ({
      id: initialVenue?.id ?? 'preview',
      name: watch('name')?.trim() || 'Venue name preview',
      location: watch('location')?.trim() || 'Location preview',
      address: watch('address')?.trim() || '',
      capacity: Number(watch('capacity')) > 0 ? Number(watch('capacity')) : 1,
      description: watch('description')?.trim() || '',
      image: imageUrl?.trim() || '',
      amenities: (watch('amenities') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: Boolean(watch('isActive')),
      createdBy: initialVenue?.createdBy ?? null,
      createdAt: initialVenue?.createdAt ?? new Date().toISOString(),
      updatedAt: initialVenue?.updatedAt ?? new Date().toISOString(),
    }),
    [imageUrl, initialVenue?.createdAt, initialVenue?.createdBy, initialVenue?.id, initialVenue?.updatedAt, watch],
  );

  const submitForm = async (values: VenueFormValues): Promise<void> => {
    await onSubmit({
      name: values.name.trim(),
      location: values.location.trim(),
      address: values.address?.trim() || undefined,
      capacity: values.capacity,
      description: values.description?.trim() || undefined,
      image: values.image?.trim() || undefined,
      imagePublicId: values.imagePublicId?.trim() || undefined,
      amenities: (values.amenities ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: values.isActive,
    });
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setImageUploading(true);
      setImageError(null);
      const response = await venueService.uploadVenueImage(file);
      const uploadedImageUrl = response.data?.imageUrl ?? '';
      const uploadedImagePublicId = response.data?.publicId ?? '';
      setValue('image', uploadedImageUrl, { shouldDirty: true, shouldValidate: true });
      setValue('imagePublicId', uploadedImagePublicId, { shouldDirty: true });
    } catch (requestError) {
      setImageError(getApiErrorMessage(requestError));
    } finally {
      setImageUploading(false);
      event.target.value = '';
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(submitForm)(event)} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-panel">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Venue Name</span>
              <Input {...register('name')} placeholder="Grand Summit Hall" />
              {errors.name ? <p className="text-sm text-rose-600">{errors.name.message}</p> : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Location</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input {...register('location')} placeholder="Ahmedabad West" className="pl-11" />
              </div>
              {errors.location ? <p className="text-sm text-rose-600">{errors.location.message}</p> : null}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <Input {...register('address')} placeholder="Street, area, city" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Capacity</span>
              <div className="relative">
                <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input type="number" min="1" {...register('capacity')} className="pl-11" />
              </div>
              {errors.capacity ? <p className="text-sm text-rose-600">{errors.capacity.message}</p> : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Venue Image</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => void handleImageFileChange(event)} className="hidden" />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon={imageUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {imageUrl ? <span className="text-sm text-emerald-700">Image uploaded</span> : <span className="text-sm text-slate-500">No image selected</span>}
              </div>
              <input type="hidden" {...register('image')} />
              <input type="hidden" {...register('imagePublicId')} />
              {errors.image ? <p className="text-sm text-rose-600">{errors.image.message}</p> : null}
              {imageError ? <p className="text-sm text-rose-600">{imageError}</p> : null}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Facilities</span>
              <Input {...register('amenities')} placeholder="WiFi, Parking, AC, Stage Lighting" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe the venue layout, ambiance, or operational notes."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Venue is active</p>
              </div>
            </label>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Eye className="h-4 w-4 text-brand-700" />
              Live Preview
            </div>
            <div className="mt-4">
              <VenueCard venue={previewVenue} preview />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" icon={<Save className="h-4 w-4" />} disabled={submitting}>
            {submitting ? 'Saving venue...' : mode === 'create' ? 'Create Venue' : 'Update Venue'}
          </Button>
        </aside>
      </div>
    </form>
  );
}

export default VenueForm;
