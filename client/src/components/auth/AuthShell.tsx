import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

function AuthShell({
  children,
  eyebrow,
  title,
  description,
  footerText,
  footerLinkText,
  footerHref,
}: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-panel lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.24),transparent_38%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{eyebrow}</p>
            <h2 className="mt-6 text-4xl font-bold tracking-tight">Secure access for every role in your event platform.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">{description}</p>
            <div className="mt-10 space-y-3 text-sm text-slate-300">
              <p>SUPER_ADMIN manages admins and platform-wide access.</p>
              <p>ADMIN manages attendees and organizers without touching SUPER_ADMIN accounts.</p>
              <p>ATTENDEE registration always stays safe and role-controlled on the backend.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-slate-500">
            {footerText}{' '}
            <Link className="font-semibold text-brand-700 transition hover:text-brand-900" to={footerHref}>
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
