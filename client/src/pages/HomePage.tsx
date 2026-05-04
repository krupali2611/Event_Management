import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { healthService } from '@/services/healthService';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function HomePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [backendMessage, setBackendMessage] = useState('Checking backend connection...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkBackendStatus = async (): Promise<void> => {
      try {
        const response = await healthService.getStatus();
        setIsConnected(response.success);
        setBackendMessage(response.success ? 'Backend Connected Successfully' : 'Backend Connection Failed');
      } catch (error) {
        setIsConnected(false);
        setBackendMessage(`Backend Connection Failed: ${getApiErrorMessage(error)}`);
      }
    };

    void checkBackendStatus();
  }, []);

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-8 sm:p-10">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          Frontend Connected Successfully
        </span>
        <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Event Management System
        </h2>
        <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          A production-ready platform with React, Vite, TypeScript, Tailwind CSS, Express, Prisma, PostgreSQL, and a
          role-aware JWT authentication system designed for scalable event operations.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/register">
                <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Create attendee account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Signed in as {currentUser?.name} with role {currentUser?.role}.
            </div>
          )}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <CalendarDays className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-semibold text-slate-900">Multi-role flows</p>
            <p className="mt-1 text-sm text-slate-600">Admin, organizer, and attendee experiences stay distinct.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-semibold text-slate-900">Protected routes</p>
            <p className="mt-1 text-sm text-slate-600">Role checks remain enforced by the backend and routing layer.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-semibold text-slate-900">Modern UI system</p>
            <p className="mt-1 text-sm text-slate-600">Reusable cards, tables, badges, and layout shells.</p>
          </div>
        </div>
      </Card>

      <Card tone="dark" className="p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Backend Status</p>
        <div className="mt-6 flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]'}`}
          />
          <p className="text-xl font-semibold">{backendMessage}</p>
        </div>
        <p className="mt-4 text-sm text-slate-300">Health check target: http://localhost:5000/api/health</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Protected route examples</p>
          <p className="mt-2">`/admin` supports `ADMIN` and `SUPER_ADMIN`.</p>
          <p className="mt-1">`/organizer` supports `ORGANIZER`, `ADMIN`, and `SUPER_ADMIN`.</p>
          <p className="mt-1">`/attendee` supports all signed-in attendees and elevated roles.</p>
        </div>
      </Card>
    </section>
  );
}

export default HomePage;
