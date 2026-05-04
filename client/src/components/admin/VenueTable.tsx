import { Building2, Edit3, ImageIcon, MapPin, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import type { Venue, VenueListData } from '@/types/venue.types';

interface VenueTableProps {
  venues: Venue[];
  pagination: VenueListData['pagination'];
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onDeactivate: (venue: Venue) => void;
}

function VenueTable({ venues, pagination, loading, onPageChange, onPageSizeChange, onDeactivate }: VenueTableProps) {
  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, index) => index + 1);

  return (
    <Table
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            Showing page {pagination.page} of {pagination.totalPages} with {pagination.total} total venues
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pagination.limit}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    page === pagination.page ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          <tr>
            <th className="px-6 py-4">Venue</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Capacity</th>
            <th className="px-6 py-4">Facilities</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                Loading venues...
              </td>
            </tr>
          ) : venues.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                No venues match the current filters.
              </td>
            </tr>
          ) : (
            venues.map((venue) => (
              <tr key={venue.id} className="align-top">
                <td className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                      {venue.image ? (
                        <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        {venue.name}
                        {venue.image ? <ImageIcon className="h-4 w-4 text-slate-400" /> : null}
                      </div>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">{venue.description ?? 'No description provided yet.'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 text-brand-700" />
                    <div>
                      <p className="font-medium text-slate-900">{venue.location}</p>
                      <p className="mt-1 text-slate-500">{venue.address ?? 'Address not added'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-brand-700" />
                    {venue.capacity.toLocaleString()} guests
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex max-w-xs flex-wrap gap-2">
                    {venue.amenities.length > 0 ? (
                      venue.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No facilities added</span>
                    )}
                    {venue.amenities.length > 3 ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        +{venue.amenities.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Badge color={venue.isActive ? 'green' : 'amber'}>{venue.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/venues/${venue.id}/edit`}>
                      <Button variant="secondary" size="sm" icon={<Edit3 className="h-4 w-4" />}>
                        Edit
                      </Button>
                    </Link>
                    {venue.isActive ? (
                      <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDeactivate(venue)}>
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Table>
  );
}

export default VenueTable;
