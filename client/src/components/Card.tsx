import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`glass rounded-3xl border border-white/10 bg-stone-900/70 p-5 shadow-glow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
