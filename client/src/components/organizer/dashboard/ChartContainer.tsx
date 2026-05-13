import type { PropsWithChildren, ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface ChartContainerProps extends PropsWithChildren {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  action?: ReactNode;
  contentHeightClassName?: string;
}

function ChartContainer({
  title,
  loading = false,
  empty = false,
  emptyMessage = 'No analytics available yet.',
  action,
  contentHeightClassName = 'h-[280px]',
  children,
}: ChartContainerProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-6">
        {loading ? (
          <div className={`${contentHeightClassName} animate-pulse rounded-[1.5rem] bg-slate-100`} />
        ) : empty ? (
          <div className={`${contentHeightClassName} flex items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500`}>
            {emptyMessage}
          </div>
        ) : (
          <div className={contentHeightClassName}>{children}</div>
        )}
      </div>
    </Card>
  );
}

export default ChartContainer;
