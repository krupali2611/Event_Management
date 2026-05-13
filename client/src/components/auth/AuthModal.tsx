import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';
import { getDefaultRouteForRole, resolvePostLoginRedirect } from '@/utils/authRedirect';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

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

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const fieldLabelClassName = 'mb-2 block text-sm font-semibold text-slate-700';
const fieldInputClassName =
  'w-full rounded-2xl border border-orange-100 bg-white/90 px-4 py-3 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100';
const inlineSwitchClassName =
  'text-sm font-semibold text-orange-600 transition hover:text-orange-700';

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { closeModal, redirectTo, setMode } = useAuthModal();
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
      closeModal();
      const requestedPath = redirectTo ?? (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(resolvePostLoginRedirect(user.role, requestedPath), { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={fieldLabelClassName} htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            className={fieldInputClassName}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="login-password">
              Password
            </label>
          </div>
          <input
            id="login-password"
            type="password"
            className={fieldInputClassName}
            placeholder="Enter your password"
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(249,115,22,0.85)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Need an account?{' '}
        <button type="button" onClick={() => setMode('register')} className={inlineSwitchClassName}>
          Create one
        </button>
      </p>
    </>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { closeModal, redirectTo, setMode } = useAuthModal();
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
      const user = await registerUser(values);
      closeModal();
      navigate(resolvePostLoginRedirect(user.role, redirectTo ?? getDefaultRouteForRole(user.role)), { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={fieldLabelClassName} htmlFor="register-name">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            className={fieldInputClassName}
            placeholder="Your full name"
            {...register('name')}
          />
          {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className={fieldLabelClassName} htmlFor="register-email">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            className={fieldInputClassName}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className={fieldLabelClassName} htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            className={fieldInputClassName}
            placeholder="Create a strong password"
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className={fieldLabelClassName} htmlFor="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            type="password"
            className={fieldInputClassName}
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword.message}</p> : null}
        </div>

        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(249,115,22,0.85)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={() => setMode('login')} className={inlineSwitchClassName}>
          Sign in
        </button>
      </p>
    </>
  );
}

function AuthModal() {
  const { isOpen, mode, closeModal } = useAuthModal();

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      eyebrow={mode === 'login' ? 'Welcome Back' : 'Join the Platform'}
      eyebrowClassName="text-orange-600"
      title={mode === 'login' ? 'Sign in' : 'Create account'}
      description={mode === 'login' ? 'Continue to your events dashboard.' : undefined}
      onClose={closeModal}
    >
      {mode === 'login' ? <LoginForm /> : <RegisterForm />}
    </Modal>
  );
}

export default AuthModal;
