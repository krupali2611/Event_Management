import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRule, 'Use uppercase, lowercase, number, and special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    try {
      setSubmitError(null);
      await registerUser(values);
      navigate('/', { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Register as an attendee"
      description="Public registration always creates an attendee account. Elevated roles remain protected and enforced only by the backend."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            placeholder="Your full name"
            {...register('name')}
          />
          {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name.message}</p> : null}
        </div>

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
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            placeholder="Create a strong password"
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create attendee account'}
        </button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;
