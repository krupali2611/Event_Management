import { LoaderCircle } from 'lucide-react';
import type { RefObject } from 'react';
import Card from '@/components/ui/Card';
import VenueCard from '@/components/admin/VenueCard';
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
                <VenueCard key={venue.id} venue={venue} isToggling={isToggling} onToggleStatus={onToggleStatus} />
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
