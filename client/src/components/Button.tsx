import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    block?: boolean;
  }
>;

const styles = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-400 disabled:bg-brand-800 disabled:text-brand-100",
  secondary:
    "bg-stone-800 text-stone-100 ring-1 ring-stone-700 hover:bg-stone-700 disabled:opacity-50",
  ghost:
    "bg-transparent text-stone-200 ring-1 ring-stone-700 hover:bg-stone-800/70 disabled:opacity-50"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  block,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${
        styles[variant]
      } ${block ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
