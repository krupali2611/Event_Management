function Navbar() {
  return (
    <header className="border-b border-slate-200/80 bg-white/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">Phase 1 Setup</p>
          <h1 className="text-lg font-bold text-slate-900">Event Management</h1>
        </div>
        <nav className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          Navbar Placeholder
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
