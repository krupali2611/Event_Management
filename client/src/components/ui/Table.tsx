import type { PropsWithChildren, ReactNode } from 'react';

interface TableProps extends PropsWithChildren {
  footer?: ReactNode;
  dark?: boolean;
}

function Table({ children, footer, dark = false }: TableProps) {
  return (
    <div
      className={`overflow-hidden rounded-[1.5rem] border ${
        dark ? 'border-slate-800 bg-slate-900 shadow-panel' : 'border-[#E2E8F0] bg-white shadow-[0_10px_35px_rgba(37,99,255,0.08)]'
      }`}
    >
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className={`border-t px-6 py-4 ${dark ? 'border-slate-800 text-slate-300' : 'border-[#E2E8F0] bg-white text-slate-600'}`}>{footer}</div>
      ) : null}
    </div>
  );
}

export default Table;
