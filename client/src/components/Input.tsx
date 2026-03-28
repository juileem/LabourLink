import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2 text-sm text-stone-200">
      <span className="font-medium text-stone-300">{label}</span>
      <input
        className={`w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-stone-100 outline-none ring-0 transition placeholder:text-stone-500 focus:border-brand-400 ${className}`}
        {...props}
      />
    </label>
  );
}
