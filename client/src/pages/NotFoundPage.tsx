import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/85 p-10 text-center shadow-panel">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">404</p>
      <h2 className="mt-4 text-3xl font-bold text-slate-950">Page not found</h2>
      <p className="mt-3 text-slate-600">The page you are looking for does not exist in this Phase 1 setup.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Go back home
      </Link>
    </section>
  );
}

export default NotFoundPage;
