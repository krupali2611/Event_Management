import type { PropsWithChildren, ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface ModalProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
}

function Modal({ title, eyebrow, description, footer, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">{eyebrow}</p> : null}
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </Card>
    </div>
  );
}

export default Modal;
