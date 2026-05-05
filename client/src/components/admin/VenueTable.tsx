import { Building2, Eye, LoaderCircle, Pencil, UserCheck, UserX, Users } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Venue } from '@/types/venue.types';

interface VenueTableProps {
  venues: Venue[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onToggleStatus: (venue: Venue) => void;
  togglingVenueId: string | null;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="h-48 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function IconAction({
  children,
  tooltip,
}: {
  children: ReactNode;
  tooltip: string;
}) {
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all delay-150 duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
        {tooltip}
      </div>
    </div>
  );
}

function VenueTable({ venues, loading, loadingMore, hasMore, onToggleStatus, togglingVenueId, loadMoreRef }: VenueTableProps) {
  return (
    <div className="space-y-5">
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <Card className="px-6 py-12 text-center text-sm text-slate-500">No venues match the current filters.</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {venues.map((venue) => {
              const isToggling = togglingVenueId === venue.id;

              return (
                <Card key={venue.id} className="overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {venue.image ? (
                      <img src={venue.image} alt={venue.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-500">
                        <Building2 className="h-14 w-14" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <Badge color={venue.isActive ? 'green' : 'amber'}>{venue.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    </div>
                  </div>

                  <div className="space-y-6 p-5">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{venue.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{venue.address ? `${venue.location}, ${venue.address}` : venue.location}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-brand-500" />
                        <span>{venue.capacity.toLocaleString()} People</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <IconAction tooltip="View Venue">
                        <Link to={`/admin/venues/${venue.id}`}>
                          <Button size="icon" aria-label="View Venue" icon={<Eye className="h-4 w-4" />} />
                        </Link>
                      </IconAction>

                      <IconAction tooltip="Edit Venue">
                        <Link to={`/admin/venues/${venue.id}/edit`}>
                          <Button variant="secondary" size="icon" aria-label="Edit Venue" icon={<Pencil className="h-4 w-4" />} />
                        </Link>
                      </IconAction>

                      <IconAction tooltip={venue.isActive ? 'Deactivate Venue' : 'Activate Venue'}>
                        <Button
                          variant={venue.isActive ? 'danger' : 'success'}
                          size="icon"
                          aria-label={venue.isActive ? 'Deactivate Venue' : 'Activate Venue'}
                          disabled={isToggling}
                          icon={
                            isToggling ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : venue.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )
                          }
                          onClick={() => onToggleStatus(venue)}
                        />
                      </IconAction>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {loadingMore ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-sm text-slate-600 shadow-panel">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
              Loading more venues...
            </div>
          ) : !hasMore ? (
            <div className="text-center text-sm text-slate-500">No more venues</div>
          ) : null}
        </>
      )}

      <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
    </div>
  );
}

export default VenueTable;
