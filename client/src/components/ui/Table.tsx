import type { PropsWithChildren, ReactNode } from 'react';

interface TableProps extends PropsWithChildren {
  footer?: ReactNode;
  dark?: boolean;
}

function Table({ children, footer, dark = false }: TableProps) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} shadow-panel`}>
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className={`border-t px-6 py-4 ${dark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{footer}</div> : null}
    </div>
  );
}

export default Table;
