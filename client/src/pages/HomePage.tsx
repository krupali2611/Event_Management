import { useEffect, useState } from 'react';
import { healthService } from '@/services/healthService';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function HomePage() {
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
      <div className="rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-panel">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          Frontend Connected Successfully
        </span>
        <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Event Management System
        </h2>
        <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          A production-ready Phase 1 foundation with React, Vite, TypeScript, Tailwind CSS, Express, Prisma,
          PostgreSQL, and a JWT-ready backend architecture.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Backend Status</p>
        <div className="mt-6 flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]'}`}
          />
          <p className="text-xl font-semibold">{backendMessage}</p>
        </div>
        <p className="mt-4 text-sm text-slate-300">Health check target: http://localhost:5000/api/health</p>
      </div>
    </section>
  );
}

export default HomePage;
