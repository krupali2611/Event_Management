import { Mail, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileDropdownProps {
  theme: 'dark' | 'light' | 'visual';
}

function ProfileDropdown({ theme }: ProfileDropdownProps) {
  const { currentUser } = useAuth();
  const isDark = theme === 'dark';
  const isVisual = theme === 'visual';

  if (!currentUser) {
    return null;
  }

  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="group relative">
      <button
        type="button"
        className={`inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border transition ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
            : isVisual
              ? 'border-white/80 bg-white/85 text-slate-700 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.45)] hover:bg-white'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
        aria-label="Profile"
      >
        {isVisual ? (
          <span className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f59e0b_0%,#fb7185_100%)] text-sm font-bold text-white">{initials}</span>
        ) : (
          <UserCircle2 className="h-5 w-5" />
        )}
      </button>

      <div
        className={`pointer-events-none absolute right-0 top-12 z-30 w-72 origin-top-right rounded-3xl border px-4 py-4 opacity-0 shadow-2xl transition duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 ${
          isDark
            ? 'scale-95 border-slate-800 bg-slate-950 text-slate-100 shadow-black/30'
            : isVisual
              ? 'scale-95 border-white/70 bg-white/95 text-slate-900 shadow-slate-300/40'
            : 'scale-95 border-slate-200 bg-white text-slate-900 shadow-slate-200/70'
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{currentUser.name}</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Account details</p>
        </div>

        <div className={`mt-4 space-y-3 rounded-2xl px-3 py-3 ${isDark ? 'bg-slate-900' : isVisual ? 'bg-slate-50/90' : 'bg-slate-50'}`}>
          <div className="flex items-start gap-3">
            <Mail className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <div className="min-w-0">
              <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
              <p className="truncate text-sm">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDropdown;
