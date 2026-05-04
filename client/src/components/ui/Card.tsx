import type { HTMLAttributes, PropsWithChildren } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement>, PropsWithChildren {
  tone?: 'default' | 'dark';
}

function Card({ children, className = '', tone = 'default', ...props }: CardProps) {
  const toneClass =
    tone === 'dark'
      ? 'border border-slate-800 bg-slate-800/90 text-slate-100 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]'
      : 'border border-slate-200 bg-white/95 text-slate-900 shadow-panel';

  return (
    <div className={`rounded-[1.75rem] ${toneClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
