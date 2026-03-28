import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2 text-sm text-stone-200">
      <span className="font-medium text-stone-300">{label}</span>
      <select
        aria-invalid={!!error}
        className={`w-full rounded-2xl border bg-stone-950/80 px-4 py-3 text-stone-100 outline-none transition focus:border-brand-400 ${
          error ? "border-red-500" : "border-white/10"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </label>
  );
}
