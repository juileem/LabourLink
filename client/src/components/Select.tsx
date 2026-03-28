import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2 text-sm text-stone-200">
      <span className="font-medium text-stone-300">{label}</span>
      <select
        className={`w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-stone-100 outline-none transition focus:border-brand-400 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
