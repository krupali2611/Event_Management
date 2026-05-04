import { Filter, MapPin, Search, Users } from 'lucide-react';
import Input from '@/components/ui/Input';
import type { VenueListFilters } from '@/types/venue.types';

interface VenueFiltersProps {
  filters: VenueListFilters;
  onSearchChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onCapacityChange: (value: string) => void;
  onStatusChange: (value: VenueListFilters['status']) => void;
}

function VenueFilters({
  filters,
  onSearchChange,
  onLocationChange,
  onCapacityChange,
  onStatusChange,
}: VenueFiltersProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-panel">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter className="h-4 w-4 text-brand-700" />
        Venue Filters
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search venue or address"
              className="pl-11"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Location</span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.location}
              onChange={(event) => onLocationChange(event.target.value)}
              placeholder="Filter by city or zone"
              className="pl-11"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Min Capacity</span>
          <div className="relative">
            <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="number"
              min="1"
              value={filters.minCapacity}
              onChange={(event) => onCapacityChange(event.target.value)}
              placeholder="150"
              className="pl-11"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</span>
          <select
            value={filters.status}
            onChange={(event) => onStatusChange(event.target.value as VenueListFilters['status'])}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default VenueFilters;
