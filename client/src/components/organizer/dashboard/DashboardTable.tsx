import type { ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface DashboardTableProps {
  title: string;
  description?: string;
  headers: string[];
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  rows: ReactNode;
}

function DashboardTable({
  title,
  description,
  headers,
  loading = false,
  empty = false,
  emptyMessage = 'No records available right now.',
  rows,
}: DashboardTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        <p className="mt-2 text-xs font-medium text-slate-400 sm:hidden">Swipe horizontally to view all columns.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] divide-y divide-slate-200 sm:min-w-full">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              [...Array(5)].map((_, rowIndex) => (
                <tr key={`loading-row-${rowIndex}`}>
                  {headers.map((header) => (
                    <td key={`${header}-${rowIndex}`} className="px-5 py-4 sm:px-6">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : empty ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-12 text-center text-sm text-slate-500 sm:px-6">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default DashboardTable;
