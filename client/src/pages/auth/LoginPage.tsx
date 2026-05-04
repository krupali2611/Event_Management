import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    case 'ATTENDEE':
      return '/';
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      setSubmitError(null);
      const user = await login(values);
      const redirectPath =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        getDefaultRouteForRole(user.role);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign in to Event Management"
      description="Access the platform with your secure role-based account and continue managing events, registrations, or administration."
      footerText="Need an account?"
      footerLinkText="Create one"
      footerHref="/register"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <Link className="text-xs font-medium text-slate-500 hover:text-slate-800" to="/register">
              New here?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            placeholder="Enter your password"
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
