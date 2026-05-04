import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '@/components/organizer/EventCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { eventService } from '@/services/event.service';
import type { EventItem, EventListData, EventListFilters } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const initialFilters: EventListFilters = {
  page: 1,
  limit: 9,
  category: '',
  date: '',
  status: '',
  includeUnpublished: true,
};

const emptyData: EventListData = {
  events: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  },
};

function OrganizerEventsPage() {
  const [filters, setFilters] = useState<EventListFilters>(initialFilters);
  const [data, setData] = useState<EventListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadEvents(filters);
  }, [filters]);

  const loadEvents = async (nextFilters: EventListFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getEvents(nextFilters);
      setData(response.data ?? emptyData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitting(true);
      await eventService.deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      await loadEvents(filters);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Event Operations</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage your event rollout</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{data.pagination.total} events</div>
            <Link to="/organizer/events/new">
              <Button icon={<Plus className="h-4 w-4" />}>Create Event</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, category: event.target.value }))}
            placeholder="Filter by category"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, date: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as EventListFilters['status'] }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.limit}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value={9}>9 per page</option>
            <option value={18}>18 per page</option>
            <option value={27}>27 per page</option>
          </select>
        </div>
      </Card>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading events...</div> : null}

      {!loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} onDelete={setDeleteTarget} />
          ))}
          {data.events.length === 0 ? <Card className="p-6 text-sm text-slate-600 lg:col-span-3">No events match the current filters.</Card> : null}
        </div>
      ) : null}

      {!loading && data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>
            Previous
          </Button>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <Button
            variant="secondary"
            disabled={filters.page >= data.pagination.totalPages}
            onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
          >
            Next
          </Button>
        </div>
      ) : null}

      {deleteTarget ? (
        <Modal
          eyebrow="Delete Event"
          title={`Delete ${deleteTarget.title}?`}
          description="This will remove the event and cancel its linked venue booking."
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={submitting} onClick={() => void handleDelete()}>
                {submitting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </>
          }
        />
      ) : null}
    </section>
  );
}

export default OrganizerEventsPage;
