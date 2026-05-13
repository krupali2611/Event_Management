import { ArrowLeft, Building2, CheckCircle2, ClipboardList, ImageIcon, MapPin, Sparkles, Users, X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { venueService } from '@/services/venue.service';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function VenueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    const loadVenue = async (): Promise<void> => {
      if (!id) {
        setError('Venue id is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenueById(id);
        setVenue(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadVenue();
  }, [id]);

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <Card className="px-6 py-10 text-sm text-slate-500">Loading venue details...</Card>
      ) : venue ? (
        <>
          <Card className="overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,251,255,0.96)_100%)] p-0 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)]">
            <div className="grid gap-0 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
              <div className="p-4 pb-0 xl:p-5 xl:pb-5">
                <div
                  className={`group relative h-[320px] overflow-hidden rounded-[2rem] shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)] md:h-[400px] xl:h-[560px] ${
                    venue.image ? 'cursor-zoom-in bg-slate-100' : 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300'
                  }`}
                  role={venue.image ? 'button' : undefined}
                  tabIndex={venue.image ? 0 : -1}
                  onClick={venue.image ? () => setShowImagePreview(true) : undefined}
                  onKeyDown={
                    venue.image
                      ? (keyEvent) => {
                          if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                            keyEvent.preventDefault();
                            setShowImagePreview(true);
                          }
                        }
                      : undefined
                  }
                >
                  {venue.image ? (
                    <img src={venue.image} alt={venue.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Building2 className="h-16 w-16" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.08)_48%,rgba(15,23,42,0.72)_100%)]" />

                  <div className="absolute left-5 top-5">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                        venue.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {venue.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {venue.image ? (
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-200/90">Venue Image</p>
                        <p className="mt-2 text-2xl font-semibold">{venue.name}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-white/35 bg-white/15 backdrop-blur-md">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-5 md:p-6 xl:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-brand-500">Venue Profile</p>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 xl:text-[2.35rem]">{venue.name}</h2>
                  </div>
                  <Link to="/admin/venues" className="inline-flex">
                    <Button
                      className="rounded-[1.15rem] bg-brand-500 text-white shadow-[0_18px_36px_-24px_rgba(37,99,235,0.72)] hover:bg-brand-700"
                      icon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to Venues
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.22)] md:p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoTile icon={MapPin} label="Location" value={venue.location} />
                    <InfoTile icon={MapPin} label="Address" value={venue.address ?? 'Address not added yet.'} />
                    <InfoTile icon={Users} label="Capacity" value={`${venue.capacity.toLocaleString()} people`} />
                    <InfoTile
                      icon={CheckCircle2}
                      label="Status"
                      value={venue.isActive ? 'Active' : 'Inactive'}
                      valueSlot={
                        <span
                          className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
                            venue.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {venue.isActive ? 'Active' : 'Inactive'}
                        </span>
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.92fr)]">
                  <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.22)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Description</p>
                    <div className="mt-6 flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-slate-50 text-brand-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                        <ClipboardList className="h-7 w-7" />
                      </div>
                      <p className="text-sm leading-7 text-slate-600">{venue.description ?? 'No description provided yet.'}</p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.22)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Facilities</p>
                    <div className="mt-6 flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-slate-50 text-brand-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                        <Sparkles className="h-7 w-7" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {venue.amenities.length > 0 ? (
                          venue.amenities.map((amenity) => (
                            <span key={amenity} className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-slate-950">
                              {amenity}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No facilities added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {showImagePreview && venue.image
            ? createPortal(
                <div
                  className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(2,6,23,0.86)] p-4 backdrop-blur-xl"
                  onClick={() => setShowImagePreview(false)}
                  role="presentation"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,255,0.2),transparent_32%)]" />
                  <button
                    type="button"
                    aria-label="Close image preview"
                    onClick={() => setShowImagePreview(false)}
                    className="absolute right-4 top-4 z-[210] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-md transition hover:bg-white/20 md:right-6 md:top-6"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div
                    className="relative z-[205] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/12 bg-white/6 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-md md:p-5"
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                  >
                    <div className="overflow-hidden rounded-[22px] bg-slate-950">
                      <img src={venue.image} alt={`${venue.name} preview`} className="max-h-[78vh] w-full object-contain" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 pb-1 text-white">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100/80">Venue Image</p>
                        <p className="mt-1 text-lg font-semibold">{venue.name}</p>
                      </div>
                      <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md">1 / 1</div>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}
        </>
      ) : (
        <Card className="px-6 py-10 text-sm text-amber-800">Venue record could not be loaded.</Card>
      )}
    </section>
  );
}

function InfoTile({ icon: Icon, label, value, valueSlot }: { icon: typeof MapPin; label: string; value: string; valueSlot?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/75 p-4">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white text-brand-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
          {!valueSlot ? <p className="mt-2 text-base leading-6 text-slate-800">{value}</p> : <div className="mt-2">{valueSlot}</div>}
        </div>
      </div>
    </div>
  );
}

export default VenueDetailsPage;
