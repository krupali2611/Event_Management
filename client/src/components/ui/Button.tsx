import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
  icon: 'h-10 w-10 justify-center p-0',
};

function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export default Button;
