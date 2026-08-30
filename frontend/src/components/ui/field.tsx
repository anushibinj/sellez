import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--border)] bg-white/50 px-4 text-sm outline-none ring-[var(--ring)] placeholder:text-[var(--muted)] focus:ring-2 dark:bg-black/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-2xl border border-[var(--border)] bg-white/50 px-4 py-3 text-sm outline-none ring-[var(--ring)] placeholder:text-[var(--muted)] focus:ring-2 dark:bg-black/20",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]", className)} {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] backdrop-blur-xl", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-black/10 dark:bg-white/10", className)} />;
}
