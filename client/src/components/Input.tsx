import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2 text-sm text-stone-200">
      <span className="font-medium text-stone-300">{label}</span>
      <input
        aria-invalid={!!error}
        className={`w-full rounded-2xl border bg-stone-950/80 px-4 py-3 text-stone-100 outline-none ring-0 transition placeholder:text-stone-500 focus:border-brand-400 ${
          error ? "border-red-500" : "border-white/10"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </label>
  );
}
