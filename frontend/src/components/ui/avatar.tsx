import { cn } from "@/lib/utils";

export function Avatar({ color, alias, className }: { color: string; alias: string; className?: string }) {
  const initial = alias.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", className)}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
