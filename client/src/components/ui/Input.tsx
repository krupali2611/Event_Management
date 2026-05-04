import type { InputHTMLAttributes } from 'react';

function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white ${className}`}
      {...props}
    />
  );
}

export default Input;
