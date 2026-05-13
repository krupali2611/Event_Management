import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface ModalProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  eyebrowClassName?: string;
}

function Modal({ title, eyebrow, description, footer, onClose, panelClassName = '', eyebrowClassName = '', children }: ModalProps) {
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-center justify-center">
        <Card
          className={`flex max-h-[calc(100vh-1rem)] w-full max-w-md flex-col overflow-hidden p-4 sm:max-h-[calc(100vh-2.5rem)] sm:p-5 ${panelClassName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0">
            {eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.3em] text-brand-700 ${eyebrowClassName}`}>{eyebrow}</p> : null}
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
                {description ? <p className="mt-1.5 text-sm text-slate-600">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close modal"
              >
                x
              </button>
            </div>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
          {footer ? <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">{footer}</div> : null}
        </Card>
      </div>
    </div>
  );
}

export default Modal;
